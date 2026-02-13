/*
  # Create N8N Integration Tables

  1. New Tables
    - `n8n_api_keys`
      - `id` (uuid, primary key)
      - `api_key` (text, unique) - The API key for authentication
      - `name` (text) - Friendly name for the API key
      - `is_active` (boolean) - Whether the key is active
      - `rate_limit_per_hour` (integer) - Max requests per hour
      - `usage_count` (integer) - Current usage count
      - `last_used_at` (timestamptz) - Last time the key was used
      - `created_by` (uuid, FK to auth.users) - Who created this key
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `n8n_chat_logs`
      - `id` (uuid, primary key)
      - `session_id` (text) - Chat session identifier
      - `api_key` (text) - Which API key was used
      - `user_query` (text) - User's question
      - `ai_response` (text) - AI's response
      - `contexts_found` (integer) - Number of RAG contexts found
      - `response_time_ms` (integer) - Response time in milliseconds
      - `metadata` (jsonb) - Additional metadata (top_k, contexts, etc.)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin users can read all data
    - Only admin can create/update API keys
    - Chat logs are insert-only for the edge function (service role)
*/

-- Create n8n_api_keys table
CREATE TABLE IF NOT EXISTS n8n_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  rate_limit_per_hour integer NOT NULL DEFAULT 100,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create n8n_chat_logs table
CREATE TABLE IF NOT EXISTS n8n_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  api_key text NOT NULL DEFAULT '',
  user_query text NOT NULL,
  ai_response text NOT NULL DEFAULT '',
  contexts_found integer NOT NULL DEFAULT 0,
  response_time_ms integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_n8n_api_keys_api_key ON n8n_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_n8n_api_keys_is_active ON n8n_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_logs_session_id ON n8n_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_logs_api_key ON n8n_chat_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_logs_created_at ON n8n_chat_logs(created_at DESC);

-- Enable RLS
ALTER TABLE n8n_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for n8n_api_keys

-- Admin can view all API keys
CREATE POLICY "Admin can view all API keys"
  ON n8n_api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can insert API keys
CREATE POLICY "Admin can insert API keys"
  ON n8n_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can update API keys
CREATE POLICY "Admin can update API keys"
  ON n8n_api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admin can delete API keys
CREATE POLICY "Admin can delete API keys"
  ON n8n_api_keys FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for n8n_chat_logs

-- Admin can view all chat logs
CREATE POLICY "Admin can view all chat logs"
  ON n8n_chat_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Edge function (service role) can insert chat logs
-- Note: Service role bypasses RLS, but we define this for clarity
CREATE POLICY "Service role can insert chat logs"
  ON n8n_chat_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Insert a default demo API key for testing
INSERT INTO n8n_api_keys (api_key, name, is_active, rate_limit_per_hour)
VALUES (
  'demo_n8n_key_' || gen_random_uuid()::text,
  'Demo N8N API Key (Testing)',
  true,
  1000
)
ON CONFLICT (api_key) DO NOTHING;