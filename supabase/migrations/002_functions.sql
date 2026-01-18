-- Stubbed Database Functions

-- Function to get sport breakdown for a user
create or replace function get_sport_breakdown(p_user_id uuid)
returns table (
  "sportId" uuid,
  "sportName" text,
  count bigint,
  color text
) as $$
begin
  return query
  select
    s.id as "sportId",
    s.name as "sportName",
    count(ae.id) as count,
    s.color
  from attended_events ae
  join events e on ae.event_id = e.id
  join sports s on e.sport_id = s.id
  where ae.user_id = p_user_id
  group by s.id, s.name, s.color
  order by count desc;
end;
$$ language plpgsql security definer;

-- Function to get team breakdown for a user
create or replace function get_team_breakdown(p_user_id uuid)
returns table (
  "teamId" uuid,
  "teamName" text,
  count bigint
) as $$
begin
  return query
  select
    t.id as "teamId",
    t.name as "teamName",
    count(*) as count
  from attended_events ae
  join events e on ae.event_id = e.id
  join (
    select id, home_team_id as team_id from events
    union all
    select id, away_team_id as team_id from events
  ) et on et.id = e.id
  join teams t on et.team_id = t.id
  where ae.user_id = p_user_id
  group by t.id, t.name
  order by count desc
  limit 10;
end;
$$ language plpgsql security definer;

-- Function to get venue breakdown for a user
create or replace function get_venue_breakdown(p_user_id uuid)
returns table (
  "venueId" uuid,
  "venueName" text,
  count bigint
) as $$
begin
  return query
  select
    v.id as "venueId",
    v.name as "venueName",
    count(ae.id) as count
  from attended_events ae
  join events e on ae.event_id = e.id
  join venues v on e.venue_id = v.id
  where ae.user_id = p_user_id
  group by v.id, v.name
  order by count desc
  limit 10;
end;
$$ language plpgsql security definer;

-- Function to get monthly attendance trend
create or replace function get_monthly_trend(p_user_id uuid)
returns table (
  month text,
  count bigint
) as $$
begin
  return query
  select
    to_char(e.event_date, 'YYYY-MM') as month,
    count(ae.id) as count
  from attended_events ae
  join events e on ae.event_id = e.id
  where ae.user_id = p_user_id
    and e.event_date >= current_date - interval '12 months'
  group by to_char(e.event_date, 'YYYY-MM')
  order by month;
end;
$$ language plpgsql security definer;

-- Function to update user stats
create or replace function update_user_stats(p_user_id uuid)
returns void as $$
declare
  v_total_events integer;
  v_total_sports integer;
  v_total_teams integer;
  v_total_venues integer;
  v_favorite_sport_id uuid;
  v_favorite_team_id uuid;
  v_favorite_venue_id uuid;
begin
  -- Calculate totals
  select count(*) into v_total_events
  from attended_events where user_id = p_user_id;

  select count(distinct e.sport_id) into v_total_sports
  from attended_events ae
  join events e on ae.event_id = e.id
  where ae.user_id = p_user_id;

  select count(distinct team_id) into v_total_teams
  from (
    select e.home_team_id as team_id from attended_events ae
    join events e on ae.event_id = e.id
    where ae.user_id = p_user_id
    union
    select e.away_team_id as team_id from attended_events ae
    join events e on ae.event_id = e.id
    where ae.user_id = p_user_id
  ) teams;

  select count(distinct e.venue_id) into v_total_venues
  from attended_events ae
  join events e on ae.event_id = e.id
  where ae.user_id = p_user_id;

  -- Find favorites (most attended)
  select e.sport_id into v_favorite_sport_id
  from attended_events ae
  join events e on ae.event_id = e.id
  where ae.user_id = p_user_id
  group by e.sport_id
  order by count(*) desc
  limit 1;

  select e.venue_id into v_favorite_venue_id
  from attended_events ae
  join events e on ae.event_id = e.id
  where ae.user_id = p_user_id
  group by e.venue_id
  order by count(*) desc
  limit 1;

  -- Update stats
  update user_stats set
    total_events = v_total_events,
    total_sports = v_total_sports,
    total_teams = v_total_teams,
    total_venues = v_total_venues,
    favorite_sport_id = v_favorite_sport_id,
    favorite_venue_id = v_favorite_venue_id,
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Trigger to update stats when attendance changes
create or replace function trigger_update_stats()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform update_user_stats(OLD.user_id);
    return OLD;
  else
    perform update_user_stats(NEW.user_id);
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_attended_event_change
  after insert or update or delete on attended_events
  for each row execute procedure trigger_update_stats();

-- Function to check and award achievements
create or replace function check_achievements(p_user_id uuid)
returns void as $$
declare
  v_total_events integer;
  v_achievement record;
begin
  -- Get current stats
  select total_events into v_total_events
  from user_stats where user_id = p_user_id;

  -- Check attendance count achievements
  for v_achievement in
    select * from achievements
    where requirement_type = 'count'
    and (requirement_value->>'count')::integer <= v_total_events
    and id not in (select achievement_id from user_achievements where user_id = p_user_id)
  loop
    insert into user_achievements (user_id, achievement_id)
    values (p_user_id, v_achievement.id);

    -- Update total points
    update user_stats
    set total_points = total_points + v_achievement.points
    where user_id = p_user_id;

    -- Add to activity feed
    insert into activity_feed (user_id, activity_type, reference_id, metadata)
    values (p_user_id, 'achievement_unlocked', v_achievement.id,
      jsonb_build_object('achievement_name', v_achievement.name, 'points', v_achievement.points));
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger to check achievements after attendance update
create or replace function trigger_check_achievements()
returns trigger as $$
begin
  perform check_achievements(NEW.user_id);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_attendance_check_achievements
  after insert on attended_events
  for each row execute procedure trigger_check_achievements();
