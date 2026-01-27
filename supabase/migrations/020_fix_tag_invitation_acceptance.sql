-- Migration 020: Create tagging infrastructure and fix invitation acceptance flow
--
-- Includes migration 004 content (was never applied) plus new fixes:
-- 1. Add went_with_user_ids column to attended_events
-- 2. Create event_tag_invitations table with RLS
-- 3. Add RLS policy so invited users can see the source attended_event
-- 4. Create security-definer RPC for proper acceptance flow

-- ============================================================
-- Part 1: Tagging infrastructure (from migration 004)
-- ============================================================

-- Add went_with_user_ids column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attended_events' AND column_name = 'went_with_user_ids'
  ) THEN
    ALTER TABLE attended_events ADD COLUMN went_with_user_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Index for "events I was tagged in" queries
CREATE INDEX IF NOT EXISTS idx_attended_events_went_with_user_ids
ON attended_events USING GIN (went_with_user_ids);

-- Event tag invitations table
CREATE TABLE IF NOT EXISTS event_tag_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attended_event_id uuid REFERENCES attended_events(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(attended_event_id, to_user_id)
);

-- RLS for event_tag_invitations
ALTER TABLE event_tag_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own invitations' AND tablename = 'event_tag_invitations'
  ) THEN
    CREATE POLICY "Users can view their own invitations"
    ON event_tag_invitations FOR SELECT
    USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update invitations sent to them' AND tablename = 'event_tag_invitations'
  ) THEN
    CREATE POLICY "Users can update invitations sent to them"
    ON event_tag_invitations FOR UPDATE
    USING (auth.uid() = to_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can create invitations for their events' AND tablename = 'event_tag_invitations'
  ) THEN
    CREATE POLICY "Users can create invitations for their events"
    ON event_tag_invitations FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);
  END IF;
END $$;

-- Allow tagged users to view events they're tagged in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Tagged users can view events they are tagged in' AND tablename = 'attended_events'
  ) THEN
    CREATE POLICY "Tagged users can view events they are tagged in"
    ON attended_events FOR SELECT
    USING (auth.uid() = ANY(went_with_user_ids));
  END IF;
END $$;

-- ============================================================
-- Part 2: Fix invitation acceptance (new)
-- ============================================================

-- Allow invited users to see the attended event referenced by their invitation
-- Without this, the join in fetchPendingInvitations returns null for attended_event
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Invited users can view source attended events' AND tablename = 'attended_events'
  ) THEN
    CREATE POLICY "Invited users can view source attended events"
    ON attended_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM event_tag_invitations eti
        WHERE eti.attended_event_id = attended_events.id
        AND eti.to_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Security-definer function to accept a tag invitation
-- Handles the full flow server-side: validates, copies event, populates companions
CREATE OR REPLACE FUNCTION accept_tag_invitation(p_invitation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_source record;
  v_new_went_with uuid[];
  v_existing_id uuid;
  v_result_id uuid;
BEGIN
  -- Verify invitation belongs to calling user and is pending
  SELECT * INTO v_invitation
  FROM event_tag_invitations
  WHERE id = p_invitation_id
    AND to_user_id = auth.uid()
    AND status = 'pending';

  IF v_invitation IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found or already responded');
  END IF;

  -- Get the source attended event (bypasses RLS via SECURITY DEFINER)
  SELECT * INTO v_source
  FROM attended_events
  WHERE id = v_invitation.attended_event_id;

  IF v_source IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Source event not found');
  END IF;

  -- Build went_with list: tagger + their companions, excluding self
  v_new_went_with := ARRAY[v_invitation.from_user_id];

  IF v_source.went_with_user_ids IS NOT NULL AND array_length(v_source.went_with_user_ids, 1) > 0 THEN
    SELECT array_agg(DISTINCT uid) INTO v_new_went_with
    FROM (
      SELECT v_invitation.from_user_id AS uid
      UNION
      SELECT unnest(v_source.went_with_user_ids)
    ) sub
    WHERE uid != auth.uid();
  END IF;

  -- Mark invitation as accepted
  UPDATE event_tag_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = p_invitation_id;

  -- Check if user already has this event
  SELECT id INTO v_existing_id
  FROM attended_events
  WHERE user_id = auth.uid() AND event_id = v_source.event_id;

  IF v_existing_id IS NOT NULL THEN
    -- User already has this event - merge went_with arrays
    UPDATE attended_events
    SET went_with_user_ids = (
      SELECT array_agg(DISTINCT uid) FROM (
        SELECT unnest(COALESCE(went_with_user_ids, '{}')) AS uid
        UNION
        SELECT unnest(v_new_went_with)
      ) sub
      WHERE uid != auth.uid()
    )
    WHERE id = v_existing_id;
    v_result_id := v_existing_id;
  ELSE
    -- Create new attended event for the accepting user
    INSERT INTO attended_events (user_id, event_id, section, seat_info, went_with_user_ids)
    VALUES (
      auth.uid(),
      v_source.event_id,
      v_source.section,
      v_source.seat_info,
      v_new_went_with
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN json_build_object('success', true, 'attended_event_id', v_result_id);
END;
$$;
