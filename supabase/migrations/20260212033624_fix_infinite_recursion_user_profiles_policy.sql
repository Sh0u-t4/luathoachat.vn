/*
  # Fix Infinite Recursion in user_profiles RLS Policy
  
  1. Problem
    - The "Admins can read all profiles" policy creates infinite recursion
    - It queries user_profiles table to check if user is admin
    - This triggers the same policy check again, causing infinite loop
  
  2. Solution
    - Drop the problematic policy
    - Create a security definer function to check admin role
    - This function bypasses RLS, preventing recursion
    - Recreate the policy using this safe function
  
  3. Security
    - Function is SECURITY DEFINER to bypass RLS
    - Only checks if the current user has admin role
    - No sensitive data exposure
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Create a safe function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the current user
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  -- Return true if admin, false otherwise
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Recreate the admin policy using the safe function
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Also add UPDATE policy for admins
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
