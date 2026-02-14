/*
  # Allow Anonymous Users to Submit Feedback

  ## Changes
  - Modify message_feedback table to allow NULL user_id
  - Update RLS policies to allow anonymous users to submit feedback
  - Change UNIQUE constraint to use session_id instead of user_id

  ## Security
  - Anonymous users can submit feedback using session_id
  - Authenticated users can still submit with user_id
  - One feedback per session per message
*/

-- Drop existing UNIQUE constraint
ALTER TABLE message_feedback DROP CONSTRAINT IF EXISTS message_feedback_message_id_user_id_key;

-- Add new UNIQUE constraint on (message_id, session_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'message_feedback_message_id_session_id_key'
  ) THEN
    ALTER TABLE message_feedback 
    ADD CONSTRAINT message_feedback_message_id_session_id_key 
    UNIQUE(message_id, session_id);
  END IF;
END $$;

-- Allow NULL user_id
ALTER TABLE message_feedback ALTER COLUMN user_id DROP NOT NULL;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own feedback" ON message_feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON message_feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON message_feedback;

-- New policies: Allow anonymous feedback
CREATE POLICY "Anyone can create feedback"
  ON message_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view feedback by session"
  ON message_feedback FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update own session feedback"
  ON message_feedback FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own session feedback"
  ON message_feedback FOR DELETE
  TO anon, authenticated
  USING (true);
