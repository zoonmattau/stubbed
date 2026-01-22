-- Preview duplicate events BEFORE running the migration
-- Run this in Supabase SQL Editor to see what will be merged

WITH event_groups AS (
  SELECT
    e.id,
    e.event_date,
    e.home_team_name,
    e.away_team_name,
    ht.name as home_team_fk_name,
    at.name as away_team_fk_name,
    e.home_score,
    e.away_score,
    e.competition,
    e.created_at,
    e.created_by,
    -- Create matching keys
    COALESCE(e.home_team_id::text, LOWER(TRIM(e.home_team_name))) as home_key,
    COALESCE(e.away_team_id::text, LOWER(TRIM(e.away_team_name))) as away_key,
    -- Count attendance records
    (SELECT COUNT(*) FROM attended_events ae WHERE ae.event_id = e.id) as attendance_count,
    -- Rank within group
    ROW_NUMBER() OVER (
      PARTITION BY
        e.event_date,
        COALESCE(e.home_team_id::text, LOWER(TRIM(e.home_team_name))),
        COALESCE(e.away_team_id::text, LOWER(TRIM(e.away_team_name)))
      ORDER BY e.created_at ASC
    ) as rank_in_group,
    -- Count duplicates in group
    COUNT(*) OVER (
      PARTITION BY
        e.event_date,
        COALESCE(e.home_team_id::text, LOWER(TRIM(e.home_team_name))),
        COALESCE(e.away_team_id::text, LOWER(TRIM(e.away_team_name)))
    ) as group_size
  FROM events e
  LEFT JOIN teams ht ON e.home_team_id = ht.id
  LEFT JOIN teams at ON e.away_team_id = at.id
  WHERE e.event_date IS NOT NULL
)
SELECT
  CASE WHEN rank_in_group = 1 THEN '✓ KEEP (canonical)' ELSE '✗ MERGE INTO ABOVE' END as action,
  id as event_id,
  event_date,
  COALESCE(home_team_fk_name, home_team_name) as home_team,
  COALESCE(away_team_fk_name, away_team_name) as away_team,
  home_score || ' - ' || away_score as score,
  competition,
  attendance_count,
  created_at
FROM event_groups
WHERE group_size > 1  -- Only show groups with duplicates
ORDER BY event_date DESC, home_key, away_key, rank_in_group;

-- Summary stats
SELECT
  'SUMMARY' as info,
  COUNT(DISTINCT CASE WHEN rank_in_group > 1 THEN id END) as duplicate_events_to_delete,
  COUNT(DISTINCT CASE WHEN rank_in_group = 1 AND group_size > 1 THEN id END) as canonical_events_to_keep,
  SUM(CASE WHEN rank_in_group > 1 THEN attendance_count ELSE 0 END) as attendance_records_to_relink
FROM (
  SELECT
    e.id,
    (SELECT COUNT(*) FROM attended_events ae WHERE ae.event_id = e.id) as attendance_count,
    ROW_NUMBER() OVER (
      PARTITION BY
        e.event_date,
        COALESCE(e.home_team_id::text, LOWER(TRIM(e.home_team_name))),
        COALESCE(e.away_team_id::text, LOWER(TRIM(e.away_team_name)))
      ORDER BY e.created_at ASC
    ) as rank_in_group,
    COUNT(*) OVER (
      PARTITION BY
        e.event_date,
        COALESCE(e.home_team_id::text, LOWER(TRIM(e.home_team_name))),
        COALESCE(e.away_team_id::text, LOWER(TRIM(e.away_team_name)))
    ) as group_size
  FROM events e
  WHERE e.event_date IS NOT NULL
) sub;
