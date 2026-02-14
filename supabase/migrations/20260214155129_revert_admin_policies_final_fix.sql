/*
  # Revert Admin Policies - Final Fix

  ## Problem
  - Admin không thể xem chat logs và user management
  - Function is_admin() gây recursive RLS loop

  ## Solution  
  - Drop tất cả policies phụ thuộc vào is_admin()
  - Recreate is_admin() function với SECURITY DEFINER để bypass RLS
  - Tạo lại admin policies cho tất cả tables

  ## Tables Fixed
  - user_profiles (user management)
  - chat_messages (chat logs)
  - chat_analytics
  - leads
  - message_feedback
  - message_ratings
  - document_downloads
  - faq_cache
  - n8n_api_keys
  - n8n_chat_logs
*/

-- ============================================
-- STEP 1: Drop all policies dependent on is_admin()
-- ============================================

-- user_profiles
DROP POLICY IF EXISTS "Admin users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin users can delete profiles" ON user_profiles;

-- chat_messages
DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can read all chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON chat_messages;
DROP POLICY IF EXISTS "Admin users can read all chat messages" ON chat_messages;

-- chat_analytics
DROP POLICY IF EXISTS "Admins can read all chat analytics" ON chat_analytics;
DROP POLICY IF EXISTS "Admin users can read all chat analytics" ON chat_analytics;

-- leads
DROP POLICY IF EXISTS "Admins can read all leads" ON leads;
DROP POLICY IF EXISTS "Admin users can read all leads" ON leads;

-- message_feedback
DROP POLICY IF EXISTS "Admins can read all feedback" ON message_feedback;

-- message_ratings
DROP POLICY IF EXISTS "Admins can view all ratings" ON message_ratings;

-- document_downloads
DROP POLICY IF EXISTS "Admins can view all download logs" ON document_downloads;

-- faq_cache
DROP POLICY IF EXISTS "Admins can update FAQ" ON faq_cache;
DROP POLICY IF EXISTS "Admins can delete FAQ" ON faq_cache;

-- n8n_api_keys
DROP POLICY IF EXISTS "Admins can view all API keys" ON n8n_api_keys;
DROP POLICY IF EXISTS "Admins can update API keys" ON n8n_api_keys;
DROP POLICY IF EXISTS "Admins can delete API keys" ON n8n_api_keys;

-- n8n_chat_logs
DROP POLICY IF EXISTS "Admins can view all chat logs" ON n8n_chat_logs;

-- landing_visibility_settings
DROP POLICY IF EXISTS "Admins can update visibility settings" ON landing_visibility_settings;
DROP POLICY IF EXISTS "Admins can insert visibility settings" ON landing_visibility_settings;

-- ============================================
-- STEP 2: Drop and recreate is_admin() function
-- ============================================

DROP FUNCTION IF EXISTS is_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Query user_profiles directly with SECURITY DEFINER to bypass RLS
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- Return true if admin, false otherwise
  RETURN COALESCE(user_role = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    -- If any error occurs, safely return false
    RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;

COMMENT ON FUNCTION is_admin() IS 'Safely checks if current user is admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- ============================================
-- STEP 3: Recreate user_profiles policies
-- ============================================

-- Users read own, admins read all
CREATE POLICY "users_read_own_admins_read_all_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    OR is_admin()
  );

-- Users update own, admins update all
CREATE POLICY "users_update_own_admins_update_all_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() 
    OR is_admin()
  )
  WITH CHECK (
    id = auth.uid() 
    OR is_admin()
  );

-- Only admins delete
CREATE POLICY "admins_delete_profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- STEP 4: Recreate chat_messages policies
-- ============================================

-- Users read own, admins read all
CREATE POLICY "users_read_own_admins_read_all_chat"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_admin()
  );

-- Users insert own
CREATE POLICY "users_insert_own_chat"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users update own, admins update all
CREATE POLICY "users_update_own_admins_update_all_chat"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR is_admin()
  );

-- ============================================
-- STEP 5: Recreate admin-only policies
-- ============================================

-- chat_analytics
CREATE POLICY "admins_read_analytics"
  ON chat_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- leads
CREATE POLICY "admins_read_leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- message_feedback
CREATE POLICY "admins_read_feedback"
  ON message_feedback
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- message_ratings
CREATE POLICY "admins_read_ratings"
  ON message_ratings
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- document_downloads
CREATE POLICY "admins_read_downloads"
  ON document_downloads
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- faq_cache
CREATE POLICY "admins_update_faq"
  ON faq_cache
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_delete_faq"
  ON faq_cache
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- n8n_api_keys
CREATE POLICY "admins_read_api_keys"
  ON n8n_api_keys
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "admins_update_api_keys"
  ON n8n_api_keys
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_delete_api_keys"
  ON n8n_api_keys
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- n8n_chat_logs
CREATE POLICY "admins_read_n8n_logs"
  ON n8n_chat_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- landing_visibility_settings
CREATE POLICY "admins_update_visibility"
  ON landing_visibility_settings
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "admins_insert_visibility"
  ON landing_visibility_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ============================================
-- Success notification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✅ ADMIN POLICIES REVERTED AND FIXED SUCCESSFULLY';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin can now access:';
  RAISE NOTICE '  ✓ User Management (user_profiles table)';
  RAISE NOTICE '  ✓ Chat Logs (chat_messages table)';
  RAISE NOTICE '  ✓ Analytics Dashboard (chat_analytics table)';
  RAISE NOTICE '  ✓ Leads Management (leads table)';
  RAISE NOTICE '  ✓ Feedback & Ratings (message_feedback, message_ratings)';
  RAISE NOTICE '  ✓ Document Downloads (document_downloads table)';
  RAISE NOTICE '  ✓ FAQ Management (faq_cache table)';
  RAISE NOTICE '  ✓ N8N Integration (n8n_api_keys, n8n_chat_logs)';
  RAISE NOTICE '  ✓ Landing Page Settings (landing_visibility_settings)';
  RAISE NOTICE '';
  RAISE NOTICE 'Function is_admin() uses SECURITY DEFINER to prevent recursion.';
  RAISE NOTICE '================================================================';
END $$;
