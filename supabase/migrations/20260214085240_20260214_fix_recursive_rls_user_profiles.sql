/*
  # Fix Infinite Recursion in user_profiles RLS Policies

  1. Problem:
    - Admin policies contain recursive subqueries
    - When checking if user is admin, it queries user_profiles again
    - This creates infinite loop causing HTTP 500 errors

  2. Solution:
    - Create helper function to check admin role safely
    - Replace recursive policies with function-based policies
    - Function uses SECURITY DEFINER to bypass RLS during role check

  3. Changes:
    - Drop existing problematic policies
    - Create `is_admin()` helper function
    - Recreate policies using the helper function
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can delete profiles" ON user_profiles;

-- Create safe helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Recreate policies using the helper function
CREATE POLICY "Admin users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admin users can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "Admin users can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());
