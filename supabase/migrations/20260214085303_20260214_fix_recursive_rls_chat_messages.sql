/*
  # Fix Infinite Recursion in chat_messages RLS Policies

  1. Problem:
    - Admin policies contain recursive subqueries to user_profiles
    - Duplicate policies checking admin status
    - Causes HTTP 500 when loading chat sessions

  2. Solution:
    - Drop duplicate and problematic policies
    - Recreate using the `is_admin()` helper function
    - Simplify policy structure

  3. Changes:
    - Drop recursive policies
    - Recreate with function-based admin check
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can read all chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON chat_messages;

-- Recreate single admin policy using helper function
CREATE POLICY "Admins can read all chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());
