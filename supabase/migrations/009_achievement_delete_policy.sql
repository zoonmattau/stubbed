-- Add delete policy for user_achievements to allow achievement recalculation
-- This allows users to have their achievements revoked when they no longer qualify

create policy "Users can delete their own achievements" on user_achievements
  for delete using (auth.uid() = user_id);
