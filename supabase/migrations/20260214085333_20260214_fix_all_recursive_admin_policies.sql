/*
  # Fix All Recursive Admin RLS Policies

  1. Problem:
    - Multiple tables have recursive subqueries to user_profiles
    - Causes HTTP 500 errors when admin tries to access data
    - Tables affected: chat_analytics, document_downloads, faq_cache, leads,
      message_feedback, message_ratings, n8n_api_keys, n8n_chat_logs

  2. Solution:
    - Replace all recursive policies with `is_admin()` function
    - Ensure consistent admin checking across all tables

  3. Changes:
    - Drop all problematic policies
    - Recreate using `is_admin()` helper function
*/

-- ============================================
-- CHAT ANALYTICS
-- ============================================
DROP POLICY IF EXISTS "Admin users can read all chat analytics" ON chat_analytics;

CREATE POLICY "Admins can read all chat analytics"
  ON chat_analytics
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- DOCUMENT DOWNLOADS
-- ============================================
DROP POLICY IF EXISTS "Admins can view all download logs" ON document_downloads;

CREATE POLICY "Admins can view all download logs"
  ON document_downloads
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- FAQ CACHE
-- ============================================
DROP POLICY IF EXISTS "Admins can update FAQ" ON faq_cache;
DROP POLICY IF EXISTS "Admins can delete FAQ" ON faq_cache;

CREATE POLICY "Admins can update FAQ"
  ON faq_cache
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete FAQ"
  ON faq_cache
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- LEADS
-- ============================================
DROP POLICY IF EXISTS "Admin users can read all leads" ON leads;

CREATE POLICY "Admins can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- MESSAGE FEEDBACK
-- ============================================
DROP POLICY IF EXISTS "Admins can read all feedback" ON message_feedback;

CREATE POLICY "Admins can read all feedback"
  ON message_feedback
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- MESSAGE RATINGS
-- ============================================
DROP POLICY IF EXISTS "Admins can view all ratings" ON message_ratings;

CREATE POLICY "Admins can view all ratings"
  ON message_ratings
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- N8N API KEYS
-- ============================================
DROP POLICY IF EXISTS "Admin can view all API keys" ON n8n_api_keys;
DROP POLICY IF EXISTS "Admin can update API keys" ON n8n_api_keys;
DROP POLICY IF EXISTS "Admin can delete API keys" ON n8n_api_keys;

CREATE POLICY "Admins can view all API keys"
  ON n8n_api_keys
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update API keys"
  ON n8n_api_keys
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete API keys"
  ON n8n_api_keys
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- N8N CHAT LOGS
-- ============================================
DROP POLICY IF EXISTS "Admin can view all chat logs" ON n8n_chat_logs;

CREATE POLICY "Admins can view all chat logs"
  ON n8n_chat_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());
