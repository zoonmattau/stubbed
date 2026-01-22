-- Add text fields for team and venue names
-- These allow users to enter events with free-text team/venue names
-- without requiring them to exist in the teams/venues lookup tables

ALTER TABLE events ADD COLUMN IF NOT EXISTS home_team_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS away_team_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sport_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_abandoned boolean DEFAULT false;

-- Add index for searching by team names
CREATE INDEX IF NOT EXISTS idx_events_home_team_name ON events(home_team_name);
CREATE INDEX IF NOT EXISTS idx_events_away_team_name ON events(away_team_name);

-- Change rating columns to numeric to support half-star ratings (0.5, 1, 1.5, etc.)
-- First drop the constraints, then alter the type
ALTER TABLE attended_events
  ALTER COLUMN rating TYPE numeric(2,1) USING rating::numeric(2,1),
  ALTER COLUMN atmosphere_rating TYPE numeric(2,1) USING atmosphere_rating::numeric(2,1);

-- Update constraints to allow values from 0.5 to 5 in 0.5 increments
ALTER TABLE attended_events
  DROP CONSTRAINT IF EXISTS attended_events_rating_check,
  DROP CONSTRAINT IF EXISTS attended_events_atmosphere_rating_check;

ALTER TABLE attended_events
  ADD CONSTRAINT attended_events_rating_check CHECK (rating >= 0.5 AND rating <= 5),
  ADD CONSTRAINT attended_events_atmosphere_rating_check CHECK (atmosphere_rating >= 0.5 AND atmosphere_rating <= 5);
