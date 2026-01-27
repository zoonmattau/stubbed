-- Public Profile & Leaderboard Functions
-- Migration 017
-- These security-definer functions bypass RLS to return public-facing data
-- while respecting user privacy settings internally.

-- ============================================
-- Helper: check if a user allows public events
-- (security definer to bypass user_settings RLS)
-- ============================================
create or replace function user_allows_public_events(p_user_id uuid)
returns boolean as $$
begin
  return coalesce(
    (select show_events from user_settings where user_id = p_user_id),
    true
  );
end;
$$ language plpgsql security definer stable;

-- ============================================
-- Update attended_events RLS to allow viewing
-- when the user has show_events enabled
-- ============================================
drop policy if exists "Users can view attended events" on attended_events;

create policy "Users can view attended events" on attended_events
  for select using (
    auth.uid() = user_id
    or user_allows_public_events(user_id)
    or exists (
      select 1 from event_reviews er
      where er.attended_event_id = attended_events.id
      and er.is_public = true
    )
  );

-- ============================================
-- Get a user's public stats + privacy flags
-- ============================================
create or replace function get_user_public_stats(p_user_id uuid)
returns table (
  total_events integer,
  total_sports integer,
  total_points integer,
  show_events boolean,
  show_stats boolean
) as $$
begin
  return query
  select
    coalesce(us.total_events, 0) as total_events,
    coalesce(us.total_sports, 0) as total_sports,
    coalesce(us.total_points, 0) as total_points,
    coalesce(uset.show_events, true) as show_events,
    coalesce(uset.show_stats, true) as show_stats
  from user_stats us
  left join user_settings uset on uset.user_id = us.user_id
  where us.user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- Get leaderboard (top users by events)
-- Only includes users who allow leaderboard visibility
-- ============================================
drop function if exists get_leaderboard(integer);
create or replace function get_leaderboard(p_limit integer default 50)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_events integer,
  total_xp integer,
  followers_count bigint,
  reviews_count bigint
) as $$
begin
  return query
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    coalesce(us.total_events, 0) as total_events,
    coalesce(us.total_points, 0) as total_xp,
    (select count(*) from follows f where f.following_id = p.id) as followers_count,
    (select count(*) from event_reviews er where er.user_id = p.id and er.is_public = true) as reviews_count
  from profiles p
  left join user_stats us on us.user_id = p.id
  left join user_settings uset on uset.user_id = p.id
  where coalesce(uset.show_on_leaderboards, true) = true
  order by coalesce(us.total_events, 0) desc
  limit p_limit;
end;
$$ language plpgsql security definer;
