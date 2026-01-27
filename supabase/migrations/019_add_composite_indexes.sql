-- Add composite indexes for frequently queried tables
-- Migration 019

-- Composite index for fetching a user's attended events with event details
CREATE INDEX IF NOT EXISTS idx_attended_events_user_event
  ON attended_events(user_id, event_id);

-- Composite index for public review feeds (filtered by is_public, sorted by created_at)
CREATE INDEX IF NOT EXISTS idx_event_reviews_public_created
  ON event_reviews(is_public, created_at DESC)
  WHERE is_public = true;

-- Index for fetching reviews by attended event
CREATE INDEX IF NOT EXISTS idx_event_reviews_attended_event_id
  ON event_reviews(attended_event_id);

-- Index for follow lookups (who is following whom)
CREATE INDEX IF NOT EXISTS idx_follows_following_id
  ON follows(following_id);

-- Index for user achievements lookup
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id
  ON user_achievements(user_id);
