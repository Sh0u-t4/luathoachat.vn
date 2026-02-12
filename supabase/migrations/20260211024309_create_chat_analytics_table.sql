/*
  # Create chat_analytics table for comprehensive query tracking

  1. New Tables
    - `chat_analytics`
      - `id` (uuid, primary key)
      - `session_id` (text) - groups messages in the same conversation session
      - `user_query` (text) - the user's question
      - `ai_response` (text) - the AI's full response
      - `response_source` (text) - where the response came from: 'n8n' or 'rag_fallback'
      - `response_time_ms` (integer) - how long the response took in milliseconds
      - `is_successful` (boolean) - whether a valid response was returned
      - `error_message` (text, nullable) - error details if the request failed
      - `user_agent` (text, nullable) - browser/device info for device analytics
      - `referer_url` (text, nullable) - which page the user asked from
      - `ip_address` (text, nullable) - for geographic analytics
      - `metadata` (jsonb) - flexible field for any extra data (detected topics, chemicals, etc.)
      - `created_at` (timestamptz) - when the question was asked

  2. Indexes
    - Index on `created_at` for time-based analytics queries
    - Index on `session_id` for session grouping
    - Index on `response_source` for source filtering
    - Index on `is_successful` for error rate tracking

  3. Security
    - Enable RLS on `chat_analytics` table
    - Only service_role can insert (from edge functions)
    - Only service_role can read (for admin dashboards)
*/

CREATE TABLE IF NOT EXISTS chat_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  user_query text NOT NULL,
  ai_response text DEFAULT '',
  response_source text NOT NULL DEFAULT 'unknown',
  response_time_ms integer DEFAULT 0,
  is_successful boolean DEFAULT true,
  error_message text,
  user_agent text,
  referer_url text,
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to chat_analytics"
  ON chat_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_analytics_created_at ON chat_analytics (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_session_id ON chat_analytics (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_response_source ON chat_analytics (response_source);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_is_successful ON chat_analytics (is_successful);
