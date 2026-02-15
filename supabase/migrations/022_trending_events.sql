-- Get trending events with aggregated stats
-- Shows event name, popularity, attendance count, average ratings, result, date/time
-- NOTE: Ratings come from attended_events table, not event_reviews

create or replace function get_trending_events(
  p_sport_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  event_id uuid,
  event_name text,
  event_date date,
  event_time time,
  home_team_name text,
  away_team_name text,
  home_team_logo text,
  away_team_logo text,
  home_score text,
  away_score text,
  venue_name text,
  sport_name text,
  sport_icon text,
  sport_color text,
  competition text,
  attendance_count bigint,
  avg_overall_rating numeric,
  avg_atmosphere_rating numeric,
  trending_score numeric
) as $$
begin
  return query
  select
    e.id as event_id,
    -- Build event name from teams or use competition
    case
      when coalesce(ht.name, e.home_team_name) is not null
           and coalesce(att.name, e.away_team_name) is not null then
        coalesce(ht.name, e.home_team_name) || ' vs ' || coalesce(att.name, e.away_team_name)
      else coalesce(e.competition, 'Event')
    end as event_name,
    e.event_date,
    e.event_time,
    coalesce(ht.name, e.home_team_name) as home_team_name,
    coalesce(att.name, e.away_team_name) as away_team_name,
    ht.logo_url as home_team_logo,
    att.logo_url as away_team_logo,
    e.home_score,
    e.away_score,
    coalesce(v.name, e.venue_name) as venue_name,
    -- Use joined sport name, or fall back to event's sport_name field
    coalesce(s.name, e.sport_name) as sport_name,
    s.icon as sport_icon,
    s.color as sport_color,
    e.competition,
    count(ae.id) as attendance_count,
    -- Ratings come from attended_events, not event_reviews
    round(avg(ae.rating)::numeric, 1) as avg_overall_rating,
    round(avg(ae.atmosphere_rating)::numeric, 1) as avg_atmosphere_rating,
    -- Trending score: recency + attendance + avg rating
    round(
      (
        -- Recency: events within last 30 days get higher scores
        exp(-extract(epoch from (now() - e.event_date::timestamp)) / (86400 * 14)) * 40 +
        -- Attendance: more people = more trending (capped at 50 points)
        least(count(ae.id) * 10, 50) +
        -- Average rating contribution
        coalesce(avg(ae.rating), 3) * 6
      )::numeric, 2
    ) as trending_score
  from events e
  left join sports s on s.id = e.sport_id
  left join teams ht on ht.id = e.home_team_id
  left join teams att on att.id = e.away_team_id
  left join venues v on v.id = e.venue_id
  join attended_events ae on ae.event_id = e.id
  where (p_sport_id is null or e.sport_id = p_sport_id)
  group by e.id, e.event_date, e.event_time, e.home_team_name, e.away_team_name,
           e.home_score, e.away_score, e.venue_name, e.competition,
           ht.name, ht.logo_url, att.name, att.logo_url, v.name,
           s.name, s.icon, s.color
  having count(ae.id) > 0  -- Must have at least 1 attendee
  order by trending_score desc, e.event_date desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;
