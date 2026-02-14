/*
  # Fix message_feedback Schema for Client-side Message IDs

  ## Problem
  - message_id is currently UUID type
  - Chat messages use client-generated string IDs like "assistant_1771046321524"
  - This causes "invalid input syntax for type uuid" errors

  ## Solution
  - Change message_id from UUID to TEXT
  - Remove foreign key constraint (messages are client-side, not in DB yet)
  - Update unique constraint to work with TEXT

  ## Changes
  1. Drop foreign key constraint if exists
  2. Alter column type from UUID to TEXT
  3. Recreate unique constraint
*/

-- Drop foreign key constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_feedback_message_id_fkey'
  ) THEN
    ALTER TABLE message_feedback DROP CONSTRAINT message_feedback_message_id_fkey;
  END IF;
END $$;

-- Change message_id from UUID to TEXT
ALTER TABLE message_feedback 
ALTER COLUMN message_id TYPE TEXT USING message_id::TEXT;

-- Make message_id NOT NULL (it should always have a value)
ALTER TABLE message_feedback 
ALTER COLUMN message_id SET NOT NULL;

-- Ensure unique constraint exists on (message_id, session_id)
-- First drop if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'message_feedback_message_id_session_id_key'
  ) THEN
    ALTER TABLE message_feedback DROP CONSTRAINT message_feedback_message_id_session_id_key;
  END IF;
END $$;

-- Recreate unique constraint
ALTER TABLE message_feedback 
ADD CONSTRAINT message_feedback_message_id_session_id_key 
UNIQUE(message_id, session_id);

-- Recreate index for fast lookups
DROP INDEX IF EXISTS idx_message_feedback_message_id;
CREATE INDEX idx_message_feedback_message_id ON message_feedback(message_id);

-- Add comment
COMMENT ON COLUMN message_feedback.message_id IS 'Client-generated message ID (e.g., assistant_1234567890)';
