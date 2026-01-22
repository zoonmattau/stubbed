-- Social Features: Follows, Reviews, Likes, Comments, Reports
-- Migration 015

-- ============================================
-- Follows table (one-way following)
-- ============================================
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

-- Indexes for follows
create index idx_follows_follower_id on follows(follower_id);
create index idx_follows_following_id on follows(following_id);

-- Enable RLS
alter table follows enable row level security;

-- RLS Policies for follows
create policy "Anyone can view follows" on follows
  for select using (true);

create policy "Users can follow others" on follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow" on follows
  for delete using (auth.uid() = follower_id);

-- ============================================
-- Event Reviews table (public reviews linked to attended_events)
-- ============================================
create table event_reviews (
  id uuid primary key default gen_random_uuid(),
  attended_event_id uuid references attended_events(id) on delete cascade not null unique,
  user_id uuid references profiles(id) on delete cascade not null,
  -- Review content
  review_text text,
  rating integer check (rating >= 1 and rating <= 5),
  atmosphere_rating integer check (atmosphere_rating >= 1 and atmosphere_rating <= 5),
  photo_urls text[],
  -- Metadata
  is_watched boolean default false, -- User watched but didn't attend in person
  is_public boolean default true,
  -- Engagement stats (denormalized for performance)
  likes_count integer default 0,
  comments_count integer default 0,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for event_reviews
create index idx_event_reviews_user_id on event_reviews(user_id);
create index idx_event_reviews_created_at on event_reviews(created_at desc);
create index idx_event_reviews_is_public on event_reviews(is_public) where is_public = true;
create index idx_event_reviews_likes_count on event_reviews(likes_count desc);

-- Enable RLS
alter table event_reviews enable row level security;

-- RLS Policies for event_reviews
create policy "Public reviews are viewable by everyone" on event_reviews
  for select using (
    is_public = true
    or auth.uid() = user_id
  );

create policy "Users can create their own reviews" on event_reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews" on event_reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reviews" on event_reviews
  for delete using (auth.uid() = user_id);

-- ============================================
-- Review Likes table
-- ============================================
create table review_likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references event_reviews(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);

-- Indexes for review_likes
create index idx_review_likes_review_id on review_likes(review_id);
create index idx_review_likes_user_id on review_likes(user_id);

-- Enable RLS
alter table review_likes enable row level security;

-- RLS Policies for review_likes
create policy "Anyone can view likes" on review_likes
  for select using (true);

create policy "Users can like reviews" on review_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike" on review_likes
  for delete using (auth.uid() = user_id);

-- ============================================
-- Review Comments table (with nested replies support)
-- ============================================
create table review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references event_reviews(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references review_comments(id) on delete cascade, -- For nested replies
  content text not null,
  is_edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for review_comments
create index idx_review_comments_review_id on review_comments(review_id);
create index idx_review_comments_user_id on review_comments(user_id);
create index idx_review_comments_parent_id on review_comments(parent_id);
create index idx_review_comments_created_at on review_comments(created_at);

-- Enable RLS
alter table review_comments enable row level security;

-- RLS Policies for review_comments
create policy "Anyone can view comments on public reviews" on review_comments
  for select using (
    exists (
      select 1 from event_reviews er
      where er.id = review_comments.review_id
      and (er.is_public = true or er.user_id = auth.uid())
    )
  );

create policy "Users can add comments" on review_comments
  for insert with check (auth.uid() = user_id);

create policy "Users can edit their own comments" on review_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on review_comments
  for delete using (auth.uid() = user_id);

-- ============================================
-- Reports table (for moderation)
-- ============================================
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade not null,
  -- Polymorphic reference (either review or comment)
  content_type text not null check (content_type in ('review', 'comment')),
  content_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  description text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes for reports
create index idx_reports_content on reports(content_type, content_id);
create index idx_reports_status on reports(status);
create index idx_reports_reporter_id on reports(reporter_id);

-- Enable RLS
alter table reports enable row level security;

-- RLS Policies for reports
create policy "Users can view their own reports" on reports
  for select using (auth.uid() = reporter_id);

create policy "Users can create reports" on reports
  for insert with check (auth.uid() = reporter_id);

-- ============================================
-- Update user_settings table with new privacy columns
-- ============================================
alter table user_settings
  add column if not exists reviews_public boolean default true,
  add column if not exists allow_comments boolean default true,
  add column if not exists show_watched_reviews boolean default true;

-- ============================================
-- Functions for updating review stats
-- ============================================

-- Function to increment likes count
create or replace function increment_review_likes()
returns trigger as $$
begin
  update event_reviews
  set likes_count = likes_count + 1
  where id = new.review_id;
  return new;
end;
$$ language plpgsql security definer;

-- Function to decrement likes count
create or replace function decrement_review_likes()
returns trigger as $$
begin
  update event_reviews
  set likes_count = greatest(0, likes_count - 1)
  where id = old.review_id;
  return old;
end;
$$ language plpgsql security definer;

-- Triggers for likes count
create trigger on_review_like_added
  after insert on review_likes
  for each row execute procedure increment_review_likes();

create trigger on_review_like_removed
  after delete on review_likes
  for each row execute procedure decrement_review_likes();

-- Function to increment comments count
create or replace function increment_review_comments()
returns trigger as $$
begin
  update event_reviews
  set comments_count = comments_count + 1
  where id = new.review_id;
  return new;
end;
$$ language plpgsql security definer;

-- Function to decrement comments count
create or replace function decrement_review_comments()
returns trigger as $$
begin
  update event_reviews
  set comments_count = greatest(0, comments_count - 1)
  where id = old.review_id;
  return old;
end;
$$ language plpgsql security definer;

-- Triggers for comments count
create trigger on_review_comment_added
  after insert on review_comments
  for each row execute procedure increment_review_comments();

create trigger on_review_comment_removed
  after delete on review_comments
  for each row execute procedure decrement_review_comments();

-- ============================================
-- Update attended_events to allow viewing others' events
-- (for public reviews feature)
-- ============================================

-- Drop the old restrictive policy
drop policy if exists "Users can view their own attended events" on attended_events;

-- Create new policy that allows viewing attended events if:
-- 1. It's your own event, OR
-- 2. There's a public review associated with it
create policy "Users can view attended events" on attended_events
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from event_reviews er
      where er.attended_event_id = attended_events.id
      and er.is_public = true
    )
  );

-- ============================================
-- Add policy to view other users' stats (for profiles)
-- ============================================
drop policy if exists "Users can view their own stats" on user_stats;

create policy "Users can view stats" on user_stats
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from user_settings us
      where us.user_id = user_stats.user_id
      and us.show_stats = true
    )
  );
