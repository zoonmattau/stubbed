-- Migration: Add user-submitted event data fields to attended_events
-- This enables community-driven consensus for scores, rounds, times, etc.

-- Add columns for user-submitted data (separate from the canonical event data)
ALTER TABLE attended_events
ADD COLUMN IF NOT EXISTS submitted_home_score VARCHAR(50),
ADD COLUMN IF NOT EXISTS submitted_away_score VARCHAR(50),
ADD COLUMN IF NOT EXISTS submitted_round VARCHAR(100),
ADD COLUMN IF NOT EXISTS submitted_event_time TIME,
ADD COLUMN IF NOT EXISTS submitted_competition VARCHAR(255),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for efficient consensus queries
CREATE INDEX IF NOT EXISTS idx_attended_events_event_id_submitted
ON attended_events(event_id)
WHERE submitted_home_score IS NOT NULL;

-- Comment explaining the purpose
COMMENT ON COLUMN attended_events.submitted_home_score IS 'User-submitted home score for consensus calculation';
COMMENT ON COLUMN attended_events.submitted_away_score IS 'User-submitted away score for consensus calculation';
COMMENT ON COLUMN attended_events.submitted_round IS 'User-submitted round for consensus calculation';
COMMENT ON COLUMN attended_events.submitted_event_time IS 'User-submitted event time for consensus calculation';
COMMENT ON COLUMN attended_events.submitted_competition IS 'User-submitted competition name for consensus calculation';

-- Function to calculate consensus score for an event
CREATE OR REPLACE FUNCTION get_event_consensus(p_event_id UUID)
RETURNS TABLE (
  field_name TEXT,
  consensus_value TEXT,
  vote_count BIGINT,
  total_votes BIGINT,
  has_conflict BOOLEAN
) AS $$
BEGIN
  -- Home score consensus
  RETURN QUERY
  SELECT
    'home_score'::TEXT as field_name,
    submitted_home_score as consensus_value,
    COUNT(*) as vote_count,
    (SELECT COUNT(*) FROM attended_events WHERE event_id = p_event_id AND submitted_home_score IS NOT NULL) as total_votes,
    (SELECT COUNT(DISTINCT submitted_home_score) > 1 FROM attended_events WHERE event_id = p_event_id AND submitted_home_score IS NOT NULL) as has_conflict
  FROM attended_events
  WHERE event_id = p_event_id AND submitted_home_score IS NOT NULL
  GROUP BY submitted_home_score
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Away score consensus
  RETURN QUERY
  SELECT
    'away_score'::TEXT,
    submitted_away_score,
    COUNT(*),
    (SELECT COUNT(*) FROM attended_events WHERE event_id = p_event_id AND submitted_away_score IS NOT NULL),
    (SELECT COUNT(DISTINCT submitted_away_score) > 1 FROM attended_events WHERE event_id = p_event_id AND submitted_away_score IS NOT NULL)
  FROM attended_events
  WHERE event_id = p_event_id AND submitted_away_score IS NOT NULL
  GROUP BY submitted_away_score
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Round consensus
  RETURN QUERY
  SELECT
    'round'::TEXT,
    submitted_round,
    COUNT(*),
    (SELECT COUNT(*) FROM attended_events WHERE event_id = p_event_id AND submitted_round IS NOT NULL),
    (SELECT COUNT(DISTINCT submitted_round) > 1 FROM attended_events WHERE event_id = p_event_id AND submitted_round IS NOT NULL)
  FROM attended_events
  WHERE event_id = p_event_id AND submitted_round IS NOT NULL
  GROUP BY submitted_round
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Event time consensus
  RETURN QUERY
  SELECT
    'event_time'::TEXT,
    submitted_event_time::TEXT,
    COUNT(*),
    (SELECT COUNT(*) FROM attended_events WHERE event_id = p_event_id AND submitted_event_time IS NOT NULL),
    (SELECT COUNT(DISTINCT submitted_event_time) > 1 FROM attended_events WHERE event_id = p_event_id AND submitted_event_time IS NOT NULL)
  FROM attended_events
  WHERE event_id = p_event_id AND submitted_event_time IS NOT NULL
  GROUP BY submitted_event_time
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Competition consensus
  RETURN QUERY
  SELECT
    'competition'::TEXT,
    submitted_competition,
    COUNT(*),
    (SELECT COUNT(*) FROM attended_events WHERE event_id = p_event_id AND submitted_competition IS NOT NULL),
    (SELECT COUNT(DISTINCT LOWER(submitted_competition)) > 1 FROM attended_events WHERE event_id = p_event_id AND submitted_competition IS NOT NULL)
  FROM attended_events
  WHERE event_id = p_event_id AND submitted_competition IS NOT NULL
  GROUP BY submitted_competition
  ORDER BY COUNT(*) DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to apply consensus to an event (can be called periodically or on-demand)
CREATE OR REPLACE FUNCTION apply_event_consensus(p_event_id UUID)
RETURNS VOID AS $$
DECLARE
  v_home_score TEXT;
  v_away_score TEXT;
  v_round TEXT;
  v_event_time TIME;
  v_competition TEXT;
BEGIN
  -- Get consensus values (most voted)
  SELECT consensus_value INTO v_home_score
  FROM get_event_consensus(p_event_id) WHERE field_name = 'home_score';

  SELECT consensus_value INTO v_away_score
  FROM get_event_consensus(p_event_id) WHERE field_name = 'away_score';

  SELECT consensus_value INTO v_round
  FROM get_event_consensus(p_event_id) WHERE field_name = 'round';

  SELECT consensus_value::TIME INTO v_event_time
  FROM get_event_consensus(p_event_id) WHERE field_name = 'event_time';

  SELECT consensus_value INTO v_competition
  FROM get_event_consensus(p_event_id) WHERE field_name = 'competition';

  -- Update event with consensus values (only if we have submissions)
  UPDATE events
  SET
    home_score = COALESCE(v_home_score, home_score),
    away_score = COALESCE(v_away_score, away_score),
    round = COALESCE(v_round, round),
    event_time = COALESCE(v_event_time, event_time),
    competition = COALESCE(v_competition, competition)
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;
