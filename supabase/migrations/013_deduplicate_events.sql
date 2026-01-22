-- Migration: Deduplicate events
-- This script finds duplicate events (same date + same teams) and merges them

-- Step 1: Create a temporary table to identify duplicates
-- We group by date and teams (using both IDs and names for matching)
CREATE TEMP TABLE duplicate_groups AS
WITH event_groups AS (
  SELECT
    id,
    event_date,
    COALESCE(home_team_id::text, LOWER(TRIM(home_team_name))) as home_key,
    COALESCE(away_team_id::text, LOWER(TRIM(away_team_name))) as away_key,
    created_at,
    -- Rank events within each duplicate group (oldest first = canonical)
    ROW_NUMBER() OVER (
      PARTITION BY
        event_date,
        COALESCE(home_team_id::text, LOWER(TRIM(home_team_name))),
        COALESCE(away_team_id::text, LOWER(TRIM(away_team_name)))
      ORDER BY created_at ASC
    ) as rn,
    -- Get the canonical (oldest) event ID for each group
    FIRST_VALUE(id) OVER (
      PARTITION BY
        event_date,
        COALESCE(home_team_id::text, LOWER(TRIM(home_team_name))),
        COALESCE(away_team_id::text, LOWER(TRIM(away_team_name)))
      ORDER BY created_at ASC
    ) as canonical_id
  FROM events
  WHERE event_date IS NOT NULL
    AND (home_team_id IS NOT NULL OR home_team_name IS NOT NULL)
    AND (away_team_id IS NOT NULL OR away_team_name IS NOT NULL)
)
SELECT
  id as duplicate_id,
  canonical_id,
  event_date,
  home_key,
  away_key
FROM event_groups
WHERE rn > 1;  -- Only duplicates, not the canonical event

-- Step 2: Log what we're about to do
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM duplicate_groups;
  RAISE NOTICE 'Found % duplicate events to merge', dup_count;
END $$;

-- Step 3: Update attended_events to point to canonical events
UPDATE attended_events ae
SET event_id = dg.canonical_id
FROM duplicate_groups dg
WHERE ae.event_id = dg.duplicate_id;

-- Step 4: Before deleting duplicates, copy any scores/data from duplicates to canonical if canonical is missing them
UPDATE events e
SET
  home_score = COALESCE(e.home_score, dup.home_score),
  away_score = COALESCE(e.away_score, dup.away_score),
  competition = COALESCE(e.competition, dup.competition),
  round = COALESCE(e.round, dup.round),
  event_time = COALESCE(e.event_time, dup.event_time),
  venue_id = COALESCE(e.venue_id, dup.venue_id),
  venue_name = COALESCE(e.venue_name, dup.venue_name),
  home_team_id = COALESCE(e.home_team_id, dup.home_team_id),
  away_team_id = COALESCE(e.away_team_id, dup.away_team_id)
FROM duplicate_groups dg
JOIN events dup ON dup.id = dg.duplicate_id
WHERE e.id = dg.canonical_id;

-- Step 5: Delete the duplicate events (attended_events already updated)
DELETE FROM events
WHERE id IN (SELECT duplicate_id FROM duplicate_groups);

-- Step 6: Log completion
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate events', deleted_count;
END $$;

-- Clean up
DROP TABLE duplicate_groups;

-- Add a comment to the events table documenting the deduplication
COMMENT ON TABLE events IS 'Stores unique sporting events. Deduplication based on date + teams was applied in migration 013.';
