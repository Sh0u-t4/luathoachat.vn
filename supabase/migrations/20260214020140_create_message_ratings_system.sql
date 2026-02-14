/*
  # Create Message Ratings System

  ## Overview
  Hệ thống đánh giá like/dislike cho phản hồi của AI bot trong chat interface.
  Cho phép người dùng đánh giá chất lượng phản hồi và admin theo dõi qua chat logs.

  ## New Tables
  
  ### `message_ratings`
  Lưu trữ đánh giá của người dùng cho từng message
  - `id` (uuid, primary key) - ID duy nhất
  - `message_id` (uuid) - ID của message được đánh giá
  - `session_id` (text) - Session ID của người dùng
  - `user_id` (uuid, nullable) - User ID nếu đã đăng nhập
  - `rating_type` (text) - Loại đánh giá: 'like' hoặc 'dislike'
  - `feedback_text` (text, nullable) - Phản hồi chi tiết (optional)
  - `created_at` (timestamptz) - Thời gian tạo
  - `updated_at` (timestamptz) - Thời gian cập nhật
  - `ip_address` (text, nullable) - IP người dùng
  - `user_agent` (text, nullable) - Browser info

  ## Indexes
  - Index trên `message_id` để query nhanh ratings của message
  - Index trên `session_id` để query ratings của user
  - Index trên `created_at` để sắp xếp theo thời gian

  ## Security
  - Enable RLS
  - Cho phép anonymous users tạo ratings
  - Chỉ admin đọc được tất cả ratings
  - Users chỉ đọc/cập nhật ratings của chính mình
*/

-- Create message_ratings table
CREATE TABLE IF NOT EXISTS message_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating_type text NOT NULL CHECK (rating_type IN ('like', 'dislike')),
  feedback_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  
  -- Một user chỉ có thể rate một message một lần
  UNIQUE(message_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_ratings_message_id ON message_ratings(message_id);
CREATE INDEX IF NOT EXISTS idx_message_ratings_session_id ON message_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_message_ratings_created_at ON message_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_ratings_user_id ON message_ratings(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE message_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users có thể tạo ratings
CREATE POLICY "Anyone can create ratings"
  ON message_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users có thể xem ratings của chính mình
CREATE POLICY "Users can view own ratings"
  ON message_ratings
  FOR SELECT
  TO anon, authenticated
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Policy: Users có thể cập nhật ratings của chính mình
CREATE POLICY "Users can update own ratings"
  ON message_ratings
  FOR UPDATE
  TO anon, authenticated
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Policy: Admin đọc tất cả ratings
CREATE POLICY "Admins can view all ratings"
  ON message_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_message_ratings_updated_at ON message_ratings;
CREATE TRIGGER update_message_ratings_updated_at
  BEFORE UPDATE ON message_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_message_rating_timestamp();

-- Create view for rating statistics
CREATE OR REPLACE VIEW message_rating_stats AS
SELECT 
  message_id,
  COUNT(*) as total_ratings,
  COUNT(*) FILTER (WHERE rating_type = 'like') as likes,
  COUNT(*) FILTER (WHERE rating_type = 'dislike') as dislikes,
  ROUND(
    (COUNT(*) FILTER (WHERE rating_type = 'like')::numeric / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as like_percentage
FROM message_ratings
GROUP BY message_id;

-- Grant access to view
GRANT SELECT ON message_rating_stats TO authenticated, anon;
