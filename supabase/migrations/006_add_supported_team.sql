-- Add supported team tracking to attended_events
-- Options: 'home', 'away', 'neutral', or null (not specified)
ALTER TABLE attended_events
ADD COLUMN IF NOT EXISTS supported_team text
CHECK (supported_team IN ('home', 'away', 'neutral'));

-- Add result from user's perspective (calculated based on supported_team)
-- 'win', 'loss', 'draw', or null if neutral/not specified
ALTER TABLE attended_events
ADD COLUMN IF NOT EXISTS result text
CHECK (result IN ('win', 'loss', 'draw'));

COMMENT ON COLUMN attended_events.supported_team IS 'Which team the user was supporting: home, away, or neutral';
COMMENT ON COLUMN attended_events.result IS 'Result from the user perspective: win, loss, or draw';
