-- User Settings table for persisting notification and privacy preferences
-- Migration 007

create table user_settings (
  user_id uuid references profiles(id) on delete cascade primary key,

  -- Push Notifications
  push_enabled boolean default true,

  -- Notification Types
  notify_friend_requests boolean default true,
  notify_achievements boolean default true,
  notify_event_reminders boolean default true,

  -- Email Notifications
  email_enabled boolean default true,
  email_weekly_digest boolean default false,

  -- Privacy Settings
  profile_public boolean default true,
  show_stats boolean default true,
  show_events boolean default true,
  allow_tagging boolean default true,
  show_on_leaderboards boolean default true,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table user_settings enable row level security;

-- RLS Policies
create policy "Users can view their own settings" on user_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own settings" on user_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own settings" on user_settings
  for update using (auth.uid() = user_id);

-- Create index
create index idx_user_settings_user_id on user_settings(user_id);

-- Function to create default settings when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'username');

  insert into public.user_stats (user_id)
  values (new.id);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Note: The trigger on_auth_user_created already exists from migration 001,
-- so it will use this updated function automatically
