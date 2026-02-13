/*
  # Remove 'moderator' role from user_profiles

  1. Data Migration
    - Convert all existing 'moderator' roles to 'user'

  2. Schema Changes
    - Drop existing CHECK constraint
    - Add new CHECK constraint with only 'user' and 'admin' roles

  3. Notes
    - Safe operation: converts moderators to regular users before removing the role
    - Does not affect admin accounts
*/

-- Convert existing moderator users to regular users
UPDATE user_profiles
SET role = 'user'
WHERE role = 'moderator';

-- Drop the old constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new constraint with only user and admin roles
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('user', 'admin'));
