/*
  # Create system_config table

  1. New Tables
    - `system_config`
      - `id` (uuid, primary key)
      - `key` (text, unique) - configuration key name
      - `value` (text) - configuration value
      - `description` (text) - human-readable description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `system_config` table
    - Only service_role can access (edge functions use service role key)

  3. Initial Data
    - Insert n8n_webhook_url placeholder
*/

CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to system_config"
  ON system_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO system_config (key, value, description)
VALUES (
  'n8n_webhook_url',
  '',
  'n8n AI Agent Chat Trigger webhook URL. Set this to enable n8n integration.'
)
ON CONFLICT (key) DO NOTHING;
