-- Add additional profile fields
-- Email for username login, personal info for user profiles

alter table profiles add column if not exists email text;
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists date_of_birth date;

-- Create index on email for faster username login lookup
create index if not exists profiles_email_idx on profiles(email);
