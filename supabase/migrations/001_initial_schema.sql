-- Stubbed Database Schema
-- Initial migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  favorite_sport text,
  favorite_team text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sports
create table sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  color text,
  country text default 'AU',
  created_at timestamptz default now()
);

-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete set null,
  name text not null,
  short_name text,
  logo_url text,
  home_venue text,
  city text,
  state text,
  country text default 'AU',
  created_at timestamptz default now()
);

-- Venues
create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  country text default 'AU',
  capacity integer,
  latitude decimal,
  longitude decimal,
  created_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_id uuid references teams(id) on delete set null,
  sport_id uuid references sports(id) on delete set null,
  position text,
  jersey_number integer,
  photo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Events (master list of sporting events)
create table events (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id) on delete set null,
  home_team_id uuid references teams(id) on delete set null,
  away_team_id uuid references teams(id) on delete set null,
  venue_id uuid references venues(id) on delete set null,
  event_date date not null,
  event_time time,
  season text,
  round text,
  competition text,
  home_score text,
  away_score text,
  winner_team_id uuid references teams(id) on delete set null,
  is_draw boolean default false,
  is_verified boolean default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- User Attended Events (the core tracking table)
create table attended_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  section text,
  seat_info text,
  ticket_price decimal,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  photo_urls text[],
  atmosphere_rating integer check (atmosphere_rating >= 1 and atmosphere_rating <= 5),
  went_with text[],
  is_favorite boolean default false,
  created_at timestamptz default now(),
  unique(user_id, event_id)
);

-- Event Lineups
create table event_lineups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  was_starter boolean default true,
  created_at timestamptz default now()
);

-- Friendships
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id) on delete cascade,
  addressee_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'declined', 'blocked')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- Activity Feed
create table activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  activity_type text not null,
  reference_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Achievement Definitions
create table achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  icon text,
  category text,
  requirement_type text,
  requirement_value jsonb,
  points integer default 10,
  rarity text check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  created_at timestamptz default now()
);

-- User Achievements
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- User Stats (cached/computed)
create table user_stats (
  user_id uuid references profiles(id) on delete cascade primary key,
  total_events integer default 0,
  total_sports integer default 0,
  total_teams integer default 0,
  total_venues integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_points integer default 0,
  favorite_sport_id uuid references sports(id) on delete set null,
  favorite_team_id uuid references teams(id) on delete set null,
  favorite_venue_id uuid references venues(id) on delete set null,
  win_percentage decimal,
  updated_at timestamptz default now()
);

-- User Streaks tracking
create table user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  streak_type text,
  reference_id uuid,
  current_count integer default 0,
  best_count integer default 0,
  last_event_date date,
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index idx_teams_sport_id on teams(sport_id);
create index idx_events_sport_id on events(sport_id);
create index idx_events_event_date on events(event_date);
create index idx_attended_events_user_id on attended_events(user_id);
create index idx_attended_events_event_id on attended_events(event_id);
create index idx_friendships_requester_id on friendships(requester_id);
create index idx_friendships_addressee_id on friendships(addressee_id);
create index idx_activity_feed_user_id on activity_feed(user_id);
create index idx_user_achievements_user_id on user_achievements(user_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table sports enable row level security;
alter table teams enable row level security;
alter table venues enable row level security;
alter table players enable row level security;
alter table events enable row level security;
alter table attended_events enable row level security;
alter table event_lineups enable row level security;
alter table friendships enable row level security;
alter table activity_feed enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table user_stats enable row level security;
alter table user_streaks enable row level security;

-- RLS Policies

-- Profiles: Users can read all profiles, update only their own
create policy "Profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Sports, Teams, Venues, Players: Public read access
create policy "Sports are viewable by everyone" on sports
  for select using (true);

create policy "Teams are viewable by everyone" on teams
  for select using (true);

create policy "Venues are viewable by everyone" on venues
  for select using (true);

create policy "Players are viewable by everyone" on players
  for select using (true);

-- Events: Public read, authenticated users can create
create policy "Events are viewable by everyone" on events
  for select using (true);

create policy "Authenticated users can create events" on events
  for insert with check (auth.role() = 'authenticated');

-- Attended Events: Users can manage their own
create policy "Users can view their own attended events" on attended_events
  for select using (auth.uid() = user_id);

create policy "Users can insert their own attended events" on attended_events
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own attended events" on attended_events
  for update using (auth.uid() = user_id);

create policy "Users can delete their own attended events" on attended_events
  for delete using (auth.uid() = user_id);

-- Friendships: Users can see their own friendships
create policy "Users can view their friendships" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can send friend requests" on friendships
  for insert with check (auth.uid() = requester_id);

create policy "Users can update friendships they're part of" on friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can delete friendships they're part of" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Activity Feed: Users can see their friends' activity
create policy "Users can view activity feed" on activity_feed
  for select using (true);

create policy "System can insert activity" on activity_feed
  for insert with check (auth.uid() = user_id);

-- Achievements: Public read
create policy "Achievements are viewable by everyone" on achievements
  for select using (true);

-- User Achievements: Users can see their own and friends'
create policy "Users can view user achievements" on user_achievements
  for select using (true);

create policy "System can grant achievements" on user_achievements
  for insert with check (auth.uid() = user_id);

-- User Stats: Users can see their own stats
create policy "Users can view their own stats" on user_stats
  for select using (auth.uid() = user_id);

create policy "Users can insert their own stats" on user_stats
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own stats" on user_stats
  for update using (auth.uid() = user_id);

-- User Streaks
create policy "Users can view their own streaks" on user_streaks
  for select using (auth.uid() = user_id);

create policy "Users can insert their own streaks" on user_streaks
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own streaks" on user_streaks
  for update using (auth.uid() = user_id);

-- Functions for profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'username');

  insert into public.user_stats (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
