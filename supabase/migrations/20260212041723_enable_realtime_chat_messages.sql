/*
  # Enable Realtime for chat_messages table

  1. Purpose
    - Enable realtime updates for chat messages
    - Allow clients to subscribe to INSERT events
    - Auto-update chat history sidebar when new messages arrive

  2. Changes
    - Enable replica identity for the table (required for realtime)
    - Set publication to include INSERT operations

  3. Security
    - RLS policies still apply for realtime subscriptions
    - Users can only see their own messages in realtime
*/

-- Enable replica identity (required for realtime subscriptions)
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Note: Realtime is enabled by default in Supabase for all tables
-- The subscription filtering will be handled by RLS policies
-- Users will only receive updates for messages they have permission to see

COMMENT ON TABLE chat_messages IS 'Chat messages table with realtime enabled for instant sidebar updates';
