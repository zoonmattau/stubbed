-- Fix type mismatch in get_event_consensus function
-- Cast VARCHAR columns to TEXT to match the function return type

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
    submitted_home_score::TEXT as consensus_value,
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
    submitted_away_score::TEXT,
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
    submitted_round::TEXT,
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
    submitted_competition::TEXT,
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
