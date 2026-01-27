-- Social Features (safe re-run version - uses IF NOT EXISTS everywhere)
-- Run this instead of 015_social_features.sql if some tables already exist

-- ============================================
-- Follows table
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Anyone can view follows') THEN
    CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can follow others') THEN
    CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can unfollow') THEN
    CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- ============================================
-- Event Reviews table
-- ============================================
CREATE TABLE IF NOT EXISTS event_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attended_event_id uuid REFERENCES attended_events(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  review_text text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  atmosphere_rating integer CHECK (atmosphere_rating >= 1 AND atmosphere_rating <= 5),
  photo_urls text[],
  is_watched boolean DEFAULT false,
  is_public boolean DEFAULT true,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_reviews_user_id ON event_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_created_at ON event_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_reviews_is_public ON event_reviews(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_event_reviews_likes_count ON event_reviews(likes_count DESC);

ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Public reviews are viewable by everyone') THEN
    CREATE POLICY "Public reviews are viewable by everyone" ON event_reviews FOR SELECT USING (is_public = true OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Users can create their own reviews') THEN
    CREATE POLICY "Users can create their own reviews" ON event_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Users can update their own reviews') THEN
    CREATE POLICY "Users can update their own reviews" ON event_reviews FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Users can delete their own reviews') THEN
    CREATE POLICY "Users can delete their own reviews" ON event_reviews FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- Review Likes table
-- ============================================
CREATE TABLE IF NOT EXISTS review_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES event_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_likes' AND policyname = 'Anyone can view likes') THEN
    CREATE POLICY "Anyone can view likes" ON review_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_likes' AND policyname = 'Users can like reviews') THEN
    CREATE POLICY "Users can like reviews" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_likes' AND policyname = 'Users can unlike') THEN
    CREATE POLICY "Users can unlike" ON review_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- Review Comments table
-- ============================================
CREATE TABLE IF NOT EXISTS review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES event_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES review_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_parent_id ON review_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at);

ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_comments' AND policyname = 'Anyone can view comments on public reviews') THEN
    CREATE POLICY "Anyone can view comments on public reviews" ON review_comments FOR SELECT USING (
      EXISTS (SELECT 1 FROM event_reviews er WHERE er.id = review_comments.review_id AND (er.is_public = true OR er.user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_comments' AND policyname = 'Users can add comments') THEN
    CREATE POLICY "Users can add comments" ON review_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_comments' AND policyname = 'Users can edit their own comments') THEN
    CREATE POLICY "Users can edit their own comments" ON review_comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_comments' AND policyname = 'Users can delete their own comments') THEN
    CREATE POLICY "Users can delete their own comments" ON review_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- Reports table
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('review', 'comment')),
  content_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can view their own reports') THEN
    CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can create reports') THEN
    CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;

-- ============================================
-- Update user_settings with social columns
-- ============================================
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS reviews_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_comments boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_watched_reviews boolean DEFAULT true;

-- ============================================
-- Trigger functions for review stats
-- ============================================
CREATE OR REPLACE FUNCTION increment_review_likes()
RETURNS trigger AS $$
BEGIN
  UPDATE event_reviews SET likes_count = likes_count + 1 WHERE id = new.review_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_review_likes()
RETURNS trigger AS $$
BEGIN
  UPDATE event_reviews SET likes_count = greatest(0, likes_count - 1) WHERE id = old.review_id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_review_comments()
RETURNS trigger AS $$
BEGIN
  UPDATE event_reviews SET comments_count = comments_count + 1 WHERE id = new.review_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_review_comments()
RETURNS trigger AS $$
BEGIN
  UPDATE event_reviews SET comments_count = greatest(0, comments_count - 1) WHERE id = old.review_id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_review_like_added ON review_likes;
CREATE TRIGGER on_review_like_added AFTER INSERT ON review_likes FOR EACH ROW EXECUTE PROCEDURE increment_review_likes();

DROP TRIGGER IF EXISTS on_review_like_removed ON review_likes;
CREATE TRIGGER on_review_like_removed AFTER DELETE ON review_likes FOR EACH ROW EXECUTE PROCEDURE decrement_review_likes();

DROP TRIGGER IF EXISTS on_review_comment_added ON review_comments;
CREATE TRIGGER on_review_comment_added AFTER INSERT ON review_comments FOR EACH ROW EXECUTE PROCEDURE increment_review_comments();

DROP TRIGGER IF EXISTS on_review_comment_removed ON review_comments;
CREATE TRIGGER on_review_comment_removed AFTER DELETE ON review_comments FOR EACH ROW EXECUTE PROCEDURE decrement_review_comments();

-- ============================================
-- Update attended_events SELECT policy for public reviews
-- ============================================
DROP POLICY IF EXISTS "Users can view their own attended events" ON attended_events;
DROP POLICY IF EXISTS "Users can view attended events" ON attended_events;

CREATE POLICY "Users can view attended events" ON attended_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM event_reviews er
      WHERE er.attended_event_id = attended_events.id
      AND er.is_public = true
    )
  );

-- ============================================
-- Update user_stats SELECT policy for public profiles
-- ============================================
DROP POLICY IF EXISTS "Users can view their own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can view stats" ON user_stats;

CREATE POLICY "Users can view stats" ON user_stats
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = user_stats.user_id
      AND us.show_stats = true
    )
  );
