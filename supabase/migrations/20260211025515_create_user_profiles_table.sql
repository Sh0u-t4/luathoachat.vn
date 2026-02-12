/*
  # Create user_profiles table for registered accounts

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - links to auth.users.id
      - `email` (text, unique) - user's email address
      - `full_name` (text) - full name of the user
      - `phone` (text, nullable) - phone/Zalo number
      - `company_name` (text, nullable) - company or organization name
      - `company_tax_code` (text, nullable) - ma so thue doanh nghiep
      - `position` (text, nullable) - job title/position
      - `industry` (text, nullable) - industry sector
      - `avatar_url` (text, nullable) - profile image URL
      - `account_status` (text) - active, suspended, deactivated
      - `role` (text) - user, admin, moderator
      - `registration_source` (text) - where the user signed up from
      - `last_login_at` (timestamptz, nullable) - last login timestamp
      - `login_count` (integer) - total number of logins
      - `metadata` (jsonb) - flexible extra data
      - `created_at` (timestamptz) - registration timestamp
      - `updated_at` (timestamptz) - last profile update

  2. Indexes
    - Index on `email` for lookup
    - Index on `account_status` for filtering
    - Index on `created_at` for registration analytics
    - Index on `company_name` for business queries

  3. Security
    - Enable RLS on `user_profiles`
    - Authenticated users can read their own profile
    - Authenticated users can update their own profile
    - Service role has full access (for admin operations)

  4. Trigger
    - Auto-create a profile row when a new user signs up via Supabase Auth
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  company_name text,
  company_tax_code text,
  position text,
  industry text,
  avatar_url text,
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  registration_source text NOT NULL DEFAULT 'website',
  last_login_at timestamptz,
  login_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access to user_profiles"
  ON user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles (account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles (company_name);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, registration_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'registration_source', 'website')
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
