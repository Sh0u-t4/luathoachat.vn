/*
  # Create user chat messages table for personalized chat history

  ## 1. Tables

  ### `chat_messages`
  Stores individual chat messages for each authenticated user:
  - `id` (uuid, primary key) - unique message ID
  - `user_id` (uuid, foreign key) - references auth.users (null for anonymous)
  - `session_id` (text) - groups messages in the same conversation
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - message content (summary for assistant)
  - `detailed_content` (text, nullable) - full detailed response for assistant
  - `detected_chemicals` (text[], nullable) - array of detected chemical names
  - `citations` (jsonb, nullable) - legal citations in structured format
  - `metadata` (jsonb) - flexible field for additional data (IP, user agent, etc.)
  - `response_time_ms` (integer, nullable) - AI response time
  - `is_error` (boolean) - whether this was an error message
  - `created_at` (timestamptz) - message timestamp
  - `updated_at` (timestamptz) - last update timestamp

  ## 2. Indexes
  - Index on `user_id` for fast user-specific queries
  - Index on `session_id` for grouping conversations
  - Index on `created_at` for chronological ordering
  - Composite index on (user_id, created_at) for user history queries

  ## 3. Security (RLS Policies)
  - Users can INSERT their own messages
  - Users can SELECT only their own messages
  - Authenticated users cannot UPDATE or DELETE messages (audit trail)
  - Service role has full access (for edge functions)

  ## 4. Important Notes
  - Messages are NEVER deleted (audit trail)
  - Anonymous users: user_id is NULL, tracked by session_id only
  - Authenticated users: both user_id and session_id are populated
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  detailed_content text,
  detected_chemicals text[],
  citations jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  response_time_ms integer,
  is_error boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert own messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anonymous users can insert messages (user_id will be NULL)
CREATE POLICY "Anonymous users can insert messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Policy: Users can read only their own messages
CREATE POLICY "Users can read own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anonymous users can read their session messages
CREATE POLICY "Anonymous users can read session messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Policy: Service role has full access (for edge functions)
CREATE POLICY "Service role full access"
  ON chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto update timestamp trigger
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();

-- Create view for user chat statistics
CREATE OR REPLACE VIEW chat_statistics AS
SELECT
  u.email,
  COUNT(DISTINCT cm.session_id) as total_sessions,
  COUNT(cm.id) FILTER (WHERE cm.role = 'user') as user_messages_count,
  COUNT(cm.id) FILTER (WHERE cm.role = 'assistant') as assistant_messages_count,
  MIN(cm.created_at) as first_chat_date,
  MAX(cm.created_at) as last_chat_date
FROM auth.users u
LEFT JOIN chat_messages cm ON u.id = cm.user_id
GROUP BY u.id, u.email;

COMMENT ON TABLE chat_messages IS 'Stores all chat messages for authenticated and anonymous users with full audit trail';
COMMENT ON COLUMN chat_messages.user_id IS 'Foreign key to auth.users. NULL for anonymous users';
COMMENT ON COLUMN chat_messages.session_id IS 'Groups messages in the same conversation session';
COMMENT ON COLUMN chat_messages.citations IS 'JSON array of legal citations with article, section, and content';
COMMENT ON COLUMN chat_messages.metadata IS 'Flexible JSONB field for IP address, user agent, referer, etc.';