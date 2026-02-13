/*
  # Add Document Tracking System

  ## Overview
  Enhance the legal_documents_2026 table with download tracking capabilities
  and create a comprehensive audit system for document downloads.

  ## Changes

  ### 1. Enhanced Columns in legal_documents_2026
    - `file_size` (bigint) - File size in bytes for bandwidth calculation
    - `file_path` (text) - Relative path within /documents/ directory
    - `download_count` (integer) - Total number of downloads (cached counter)
    - `last_downloaded_at` (timestamptz) - Timestamp of most recent download

  ### 2. New Table: document_downloads
    - Comprehensive audit log for every download event
    - Tracks user session, IP address, and user agent
    - Enables analytics and usage patterns analysis
    - Links to legal_documents_2026 via foreign key

  ### 3. Security
    - Enable RLS on document_downloads table
    - Admins can view all download logs
    - Regular users can only view their own downloads (if authenticated)
    - Anonymous downloads are tracked but not queryable by users

  ## Business Value
  - Track which documents are most valuable to users
  - Identify peak usage times for infrastructure planning
  - Detect unusual download patterns (potential abuse)
  - Provide data-driven insights for content strategy
*/

-- Step 1: Add tracking columns to legal_documents_2026
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents_2026' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE legal_documents_2026 ADD COLUMN file_size bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents_2026' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE legal_documents_2026 ADD COLUMN file_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents_2026' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE legal_documents_2026 ADD COLUMN download_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_documents_2026' AND column_name = 'last_downloaded_at'
  ) THEN
    ALTER TABLE legal_documents_2026 ADD COLUMN last_downloaded_at timestamptz;
  END IF;
END $$;

-- Step 2: Create document_downloads audit table
CREATE TABLE IF NOT EXISTS document_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES legal_documents_2026(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  ip_address text,
  user_agent text,
  referrer text,
  downloaded_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_downloads_document_id ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_user_id ON document_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_downloads_downloaded_at ON document_downloads(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_downloads_session_id ON document_downloads(session_id);

-- Step 3: Enable RLS on document_downloads
ALTER TABLE document_downloads ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for document_downloads

-- Policy: Admins can view all download logs
CREATE POLICY "Admins can view all download logs"
  ON document_downloads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Users can view their own downloads
CREATE POLICY "Users can view own downloads"
  ON document_downloads
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Anyone can insert download records (needed for tracking)
CREATE POLICY "Anyone can insert download records"
  ON document_downloads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 5: Create function to increment download counter
CREATE OR REPLACE FUNCTION increment_download_count(doc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE legal_documents_2026
  SET
    download_count = COALESCE(download_count, 0) + 1,
    last_downloaded_at = now()
  WHERE id = doc_id;
END;
$$;

-- Step 6: Create view for download analytics
CREATE OR REPLACE VIEW document_download_stats AS
SELECT
  ld.id,
  ld.document_code,
  ld.document_name,
  ld.document_type,
  ld.download_count,
  ld.last_downloaded_at,
  COUNT(dd.id) AS total_download_events,
  COUNT(DISTINCT dd.session_id) AS unique_sessions,
  COUNT(DISTINCT dd.user_id) AS unique_users,
  MAX(dd.downloaded_at) AS most_recent_download
FROM legal_documents_2026 ld
LEFT JOIN document_downloads dd ON dd.document_id = ld.id
GROUP BY ld.id, ld.document_code, ld.document_name, ld.document_type,
         ld.download_count, ld.last_downloaded_at;
