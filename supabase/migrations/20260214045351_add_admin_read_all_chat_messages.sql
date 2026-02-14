/*
  # Add admin read policy for chat_messages

  ## Changes
  - Add RLS policy allowing admins to read all chat messages

  ## Security
  - Only users with role 'admin' in user_profiles can read all messages
  - This enables the admin dashboard to display chat logs
*/

-- Policy: Admins can read all chat messages
CREATE POLICY "Admins can read all messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
