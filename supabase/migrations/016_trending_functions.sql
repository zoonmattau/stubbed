-- Trending Functions and Views for Explore Feed
-- Migration 016

-- ============================================
-- Calculate trending score for a review
-- Algorithm: Mix of recency, rating, engagement, and relevance
-- ============================================
create or replace function calculate_trending_score(
  p_created_at timestamptz,
  p_rating integer,
  p_likes_count integer,
  p_comments_count integer,
  p_is_watched boolean
)
returns numeric as $$
declare
  age_hours numeric;
  recency_score numeric;
  engagement_score numeric;
  quality_score numeric;
  watched_factor numeric;
  total_score numeric;
begin
  -- Calculate age in hours (capped at 720 hours = 30 days)
  age_hours := least(extract(epoch from (now() - p_created_at)) / 3600, 720);

  -- Recency score: exponential decay (newer = higher score)
  -- Half-life of ~48 hours
  recency_score := exp(-age_hours / 48) * 50;

  -- Engagement score: likes and comments weighted
  -- Likes worth 1 point, comments worth 2 points (more effort)
  engagement_score := least((coalesce(p_likes_count, 0) + coalesce(p_comments_count, 0) * 2), 100);

  -- Quality score: based on rating (1-5 stars)
  quality_score := coalesce(p_rating, 3) * 10;

  -- Watched factor: slight reduction for watched-only reviews (0.9x)
  watched_factor := case when p_is_watched then 0.9 else 1.0 end;

  -- Combined score (weighted average)
  total_score := (
    recency_score * 0.4 +      -- 40% weight on recency
    engagement_score * 0.35 +  -- 35% weight on engagement
    quality_score * 0.25       -- 25% weight on quality
  ) * watched_factor;

  return round(total_score, 2);
end;
$$ language plpgsql immutable;

-- ============================================
-- Get trending reviews with pagination
-- ============================================
create or replace function get_trending_reviews(
  p_sport_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  review_id uuid,
  attended_event_id uuid,
  user_id uuid,
  review_text text,
  rating integer,
  atmosphere_rating integer,
  photo_urls text[],
  is_watched boolean,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  trending_score numeric,
  -- User info
  username text,
  display_name text,
  avatar_url text,
  -- Event info
  event_id uuid,
  event_date date,
  event_time time,
  sport_id uuid,
  sport_name text,
  sport_icon text,
  sport_color text,
  home_team_id uuid,
  home_team_name text,
  home_team_logo text,
  away_team_id uuid,
  away_team_name text,
  away_team_logo text,
  venue_name text,
  home_score text,
  away_score text,
  competition text
) as $$
begin
  return query
  select
    er.id as review_id,
    er.attended_event_id,
    er.user_id,
    er.review_text,
    er.rating,
    er.atmosphere_rating,
    er.photo_urls,
    er.is_watched,
    er.likes_count,
    er.comments_count,
    er.created_at,
    calculate_trending_score(er.created_at, er.rating, er.likes_count, er.comments_count, er.is_watched) as trending_score,
    -- User info
    p.username,
    p.display_name,
    p.avatar_url,
    -- Event info
    e.id as event_id,
    e.event_date,
    e.event_time,
    e.sport_id,
    s.name as sport_name,
    s.icon as sport_icon,
    s.color as sport_color,
    e.home_team_id,
    coalesce(ht.name, e.home_team_name) as home_team_name,
    ht.logo_url as home_team_logo,
    e.away_team_id,
    coalesce(at.name, e.away_team_name) as away_team_name,
    at.logo_url as away_team_logo,
    coalesce(v.name, e.venue_name) as venue_name,
    e.home_score,
    e.away_score,
    e.competition
  from event_reviews er
  join profiles p on p.id = er.user_id
  join attended_events ae on ae.id = er.attended_event_id
  join events e on e.id = ae.event_id
  left join sports s on s.id = e.sport_id
  left join teams ht on ht.id = e.home_team_id
  left join teams at on at.id = e.away_team_id
  left join venues v on v.id = e.venue_id
  where er.is_public = true
    and (p_sport_id is null or e.sport_id = p_sport_id)
  order by trending_score desc, er.created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

-- ============================================
-- Get following feed (reviews from followed users)
-- ============================================
create or replace function get_following_feed(
  p_user_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  review_id uuid,
  attended_event_id uuid,
  user_id uuid,
  review_text text,
  rating integer,
  atmosphere_rating integer,
  photo_urls text[],
  is_watched boolean,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  -- User info
  username text,
  display_name text,
  avatar_url text,
  -- Event info
  event_id uuid,
  event_date date,
  event_time time,
  sport_id uuid,
  sport_name text,
  sport_icon text,
  sport_color text,
  home_team_id uuid,
  home_team_name text,
  home_team_logo text,
  away_team_id uuid,
  away_team_name text,
  away_team_logo text,
  venue_name text,
  home_score text,
  away_score text,
  competition text
) as $$
begin
  return query
  select
    er.id as review_id,
    er.attended_event_id,
    er.user_id,
    er.review_text,
    er.rating,
    er.atmosphere_rating,
    er.photo_urls,
    er.is_watched,
    er.likes_count,
    er.comments_count,
    er.created_at,
    -- User info
    p.username,
    p.display_name,
    p.avatar_url,
    -- Event info
    e.id as event_id,
    e.event_date,
    e.event_time,
    e.sport_id,
    s.name as sport_name,
    s.icon as sport_icon,
    s.color as sport_color,
    e.home_team_id,
    coalesce(ht.name, e.home_team_name) as home_team_name,
    ht.logo_url as home_team_logo,
    e.away_team_id,
    coalesce(at.name, e.away_team_name) as away_team_name,
    at.logo_url as away_team_logo,
    coalesce(v.name, e.venue_name) as venue_name,
    e.home_score,
    e.away_score,
    e.competition
  from event_reviews er
  join profiles p on p.id = er.user_id
  join attended_events ae on ae.id = er.attended_event_id
  join events e on e.id = ae.event_id
  left join sports s on s.id = e.sport_id
  left join teams ht on ht.id = e.home_team_id
  left join teams at on at.id = e.away_team_id
  left join venues v on v.id = e.venue_id
  where er.is_public = true
    and er.user_id in (
      select f.following_id from follows f where f.follower_id = p_user_id
    )
  order by er.created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

-- ============================================
-- Search reviews by query (team names, usernames, review text)
-- ============================================
create or replace function search_reviews(
  p_query text,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  review_id uuid,
  attended_event_id uuid,
  user_id uuid,
  review_text text,
  rating integer,
  atmosphere_rating integer,
  photo_urls text[],
  is_watched boolean,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  -- User info
  username text,
  display_name text,
  avatar_url text,
  -- Event info
  event_id uuid,
  event_date date,
  event_time time,
  sport_id uuid,
  sport_name text,
  sport_icon text,
  sport_color text,
  home_team_id uuid,
  home_team_name text,
  home_team_logo text,
  away_team_id uuid,
  away_team_name text,
  away_team_logo text,
  venue_name text,
  home_score text,
  away_score text,
  competition text
) as $$
declare
  search_pattern text;
begin
  search_pattern := '%' || lower(p_query) || '%';

  return query
  select
    er.id as review_id,
    er.attended_event_id,
    er.user_id,
    er.review_text,
    er.rating,
    er.atmosphere_rating,
    er.photo_urls,
    er.is_watched,
    er.likes_count,
    er.comments_count,
    er.created_at,
    -- User info
    p.username,
    p.display_name,
    p.avatar_url,
    -- Event info
    e.id as event_id,
    e.event_date,
    e.event_time,
    e.sport_id,
    s.name as sport_name,
    s.icon as sport_icon,
    s.color as sport_color,
    e.home_team_id,
    coalesce(ht.name, e.home_team_name) as home_team_name,
    ht.logo_url as home_team_logo,
    e.away_team_id,
    coalesce(at.name, e.away_team_name) as away_team_name,
    at.logo_url as away_team_logo,
    coalesce(v.name, e.venue_name) as venue_name,
    e.home_score,
    e.away_score,
    e.competition
  from event_reviews er
  join profiles p on p.id = er.user_id
  join attended_events ae on ae.id = er.attended_event_id
  join events e on e.id = ae.event_id
  left join sports s on s.id = e.sport_id
  left join teams ht on ht.id = e.home_team_id
  left join teams at on at.id = e.away_team_id
  left join venues v on v.id = e.venue_id
  where er.is_public = true
    and (
      lower(p.username) like search_pattern
      or lower(p.display_name) like search_pattern
      or lower(er.review_text) like search_pattern
      or lower(coalesce(ht.name, e.home_team_name, '')) like search_pattern
      or lower(coalesce(at.name, e.away_team_name, '')) like search_pattern
      or lower(coalesce(v.name, e.venue_name, '')) like search_pattern
    )
  order by er.created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

-- ============================================
-- Get user's public reviews for profile
-- ============================================
create or replace function get_user_reviews(
  p_user_id uuid,
  p_viewer_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  review_id uuid,
  attended_event_id uuid,
  user_id uuid,
  review_text text,
  rating integer,
  atmosphere_rating integer,
  photo_urls text[],
  is_watched boolean,
  likes_count integer,
  comments_count integer,
  created_at timestamptz,
  -- Event info
  event_id uuid,
  event_date date,
  event_time time,
  sport_id uuid,
  sport_name text,
  sport_icon text,
  sport_color text,
  home_team_id uuid,
  home_team_name text,
  home_team_logo text,
  away_team_id uuid,
  away_team_name text,
  away_team_logo text,
  venue_name text,
  home_score text,
  away_score text,
  competition text
) as $$
begin
  return query
  select
    er.id as review_id,
    er.attended_event_id,
    er.user_id,
    er.review_text,
    er.rating,
    er.atmosphere_rating,
    er.photo_urls,
    er.is_watched,
    er.likes_count,
    er.comments_count,
    er.created_at,
    -- Event info
    e.id as event_id,
    e.event_date,
    e.event_time,
    e.sport_id,
    s.name as sport_name,
    s.icon as sport_icon,
    s.color as sport_color,
    e.home_team_id,
    coalesce(ht.name, e.home_team_name) as home_team_name,
    ht.logo_url as home_team_logo,
    e.away_team_id,
    coalesce(at.name, e.away_team_name) as away_team_name,
    at.logo_url as away_team_logo,
    coalesce(v.name, e.venue_name) as venue_name,
    e.home_score,
    e.away_score,
    e.competition
  from event_reviews er
  join attended_events ae on ae.id = er.attended_event_id
  join events e on e.id = ae.event_id
  left join sports s on s.id = e.sport_id
  left join teams ht on ht.id = e.home_team_id
  left join teams at on at.id = e.away_team_id
  left join venues v on v.id = e.venue_id
  where er.user_id = p_user_id
    and (er.is_public = true or er.user_id = p_viewer_id)
  order by er.created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;

-- ============================================
-- Get follower/following counts
-- ============================================
create or replace function get_follow_counts(p_user_id uuid)
returns table (
  followers_count bigint,
  following_count bigint
) as $$
begin
  return query
  select
    (select count(*) from follows where following_id = p_user_id) as followers_count,
    (select count(*) from follows where follower_id = p_user_id) as following_count;
end;
$$ language plpgsql stable;

-- ============================================
-- Check if user A follows user B
-- ============================================
create or replace function is_following(p_follower_id uuid, p_following_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from follows
    where follower_id = p_follower_id
    and following_id = p_following_id
  );
end;
$$ language plpgsql stable;

-- ============================================
-- Get suggested users to follow
-- (users with most followers that current user doesn't follow)
-- ============================================
create or replace function get_suggested_users(
  p_user_id uuid,
  p_limit integer default 10
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
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
    p.bio,
    (select count(*) from follows f where f.following_id = p.id) as followers_count,
    (select count(*) from event_reviews er where er.user_id = p.id and er.is_public = true) as reviews_count
  from profiles p
  where p.id != p_user_id
    and not exists (
      select 1 from follows f
      where f.follower_id = p_user_id
      and f.following_id = p.id
    )
    -- Only suggest users who have public reviews
    and exists (
      select 1 from event_reviews er
      where er.user_id = p.id and er.is_public = true
    )
  order by followers_count desc, reviews_count desc
  limit p_limit;
end;
$$ language plpgsql stable;

-- ============================================
-- Search users by username/display name
-- ============================================
create or replace function search_users(
  p_query text,
  p_limit integer default 20
)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  followers_count bigint,
  reviews_count bigint
) as $$
declare
  search_pattern text;
begin
  search_pattern := '%' || lower(p_query) || '%';

  return query
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    (select count(*) from follows f where f.following_id = p.id) as followers_count,
    (select count(*) from event_reviews er where er.user_id = p.id and er.is_public = true) as reviews_count
  from profiles p
  where lower(p.username) like search_pattern
    or lower(p.display_name) like search_pattern
  order by followers_count desc
  limit p_limit;
end;
$$ language plpgsql stable;
