-- Add user tagging support to attended_events
ALTER TABLE attended_events
ADD COLUMN went_with_user_ids uuid[] DEFAULT '{}';

-- Index for "events I was tagged in" queries
CREATE INDEX idx_attended_events_went_with_user_ids
ON attended_events USING GIN (went_with_user_ids);

-- Event tag invitations (for confirmation flow)
CREATE TABLE event_tag_invitations (
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

CREATE POLICY "Users can view their own invitations"
ON event_tag_invitations FOR SELECT
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can update invitations sent to them"
ON event_tag_invitations FOR UPDATE
USING (auth.uid() = to_user_id);

CREATE POLICY "Users can create invitations for their events"
ON event_tag_invitations FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Allow tagged users to view events they're tagged in
CREATE POLICY "Tagged users can view events they're tagged in"
ON attended_events FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = ANY(went_with_user_ids));
