/*
  # Add Admin Policies for Analytics and Leads Tables

  1. Purpose
    - Allow admin users to read chat_analytics for dashboard insights
    - Allow admin users to read leads for marketing/sales tracking
    - Allow admin users to read chat_messages for support purposes
    - Admin access is required for the /quan-tri (Admin Dashboard) page

  2. Security
    - Uses public.is_admin() function (already exists) to verify admin role
    - Admin users can SELECT from these tables
    - Only service_role can INSERT/UPDATE/DELETE (prevents tampering)

  3. Tables Affected
    - chat_analytics: Admin can read all analytics data
    - leads: Admin can read all lead submissions
    - chat_messages: Admin can read all chat history
*/

-- Add admin SELECT policy for chat_analytics
DROP POLICY IF EXISTS "Admins can read all chat analytics" ON chat_analytics;
CREATE POLICY "Admins can read all chat analytics"
  ON chat_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Add admin SELECT policy for leads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all leads" ON leads';
    EXECUTE 'CREATE POLICY "Admins can read all leads"
      ON leads
      FOR SELECT
      TO authenticated
      USING (public.is_admin())';
  END IF;
END $$;

-- Add admin SELECT policy for chat_messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all chat messages" ON chat_messages';
    EXECUTE 'CREATE POLICY "Admins can read all chat messages"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (public.is_admin())';
  END IF;
END $$;
