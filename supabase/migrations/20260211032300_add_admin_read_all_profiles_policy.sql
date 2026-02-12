/*
  # Add admin RLS policy for user_profiles

  1. Security Changes
    - Add SELECT policy allowing admin users to read all user profiles
    - Admin role is checked via the user's own profile record
    - Non-admin users are unaffected (existing self-read policy remains)

  2. Notes
    - Uses a subquery to check the requesting user's role in user_profiles
    - Only users with role = 'admin' can see all profiles
*/

CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );
