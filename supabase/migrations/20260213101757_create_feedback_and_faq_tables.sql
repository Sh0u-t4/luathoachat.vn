/*
  # Create Feedback and FAQ Cache System

  ## Overview
  This migration adds support for:
  - User feedback collection (thumbs up/down) on AI responses
  - FAQ cache system for offline fallback functionality
  - Analytics tracking for message quality

  ## New Tables

  ### `message_feedback`
  Stores user feedback (thumbs up/down) on AI assistant messages
  - `id` (uuid, primary key)
  - `message_id` (uuid, references chat_messages)
  - `user_id` (uuid, references auth.users)
  - `session_id` (text, session identifier)
  - `rating` (text: 'positive' | 'negative')
  - `comment` (text, optional detailed feedback)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `faq_cache`
  Stores frequently asked questions and answers for offline mode
  - `id` (uuid, primary key)
  - `question` (text, the FAQ question)
  - `question_variations` (text[], alternative phrasings)
  - `answer` (text, pre-generated answer)
  - `citations` (jsonb, source references)
  - `category` (text, e.g., 'licensing', 'chemicals', 'regulations')
  - `priority` (integer, higher = more important)
  - `usage_count` (integer, tracks popularity)
  - `last_updated` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can read their own feedback
  - Users can create feedback for their own messages
  - FAQ cache is publicly readable (for offline access)
  - Only admins can manage FAQ cache
*/

-- Create message_feedback table
CREATE TABLE IF NOT EXISTS message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure one feedback per user per message
  UNIQUE(message_id, user_id)
);

-- Create index for fast feedback lookups
CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_session_id ON message_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_rating ON message_feedback(rating);

-- Create faq_cache table
CREATE TABLE IF NOT EXISTS faq_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  question_variations text[] DEFAULT ARRAY[]::text[],
  answer text NOT NULL,
  citations jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  priority integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create full-text search index on questions (using 'simple' for Vietnamese text)
CREATE INDEX IF NOT EXISTS idx_faq_cache_question_search
  ON faq_cache USING gin(to_tsvector('simple', question));
CREATE INDEX IF NOT EXISTS idx_faq_cache_category ON faq_cache(category);
CREATE INDEX IF NOT EXISTS idx_faq_cache_priority ON faq_cache(priority DESC);

-- Enable RLS on message_feedback
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
CREATE POLICY "Users can view own feedback"
  ON message_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create feedback for their own messages
CREATE POLICY "Users can create feedback"
  ON message_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON message_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback for analytics
CREATE POLICY "Admins can read all feedback"
  ON message_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Enable RLS on faq_cache
ALTER TABLE faq_cache ENABLE ROW LEVEL SECURITY;

-- FAQ cache is publicly readable (for offline access)
CREATE POLICY "FAQ cache is publicly readable"
  ON faq_cache FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert FAQ
CREATE POLICY "Admins can insert FAQ"
  ON faq_cache FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update FAQ
CREATE POLICY "Admins can update FAQ"
  ON faq_cache FOR UPDATE
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

-- Only admins can delete FAQ
CREATE POLICY "Admins can delete FAQ"
  ON faq_cache FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_message_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER message_feedback_updated_at
  BEFORE UPDATE ON message_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_message_feedback_updated_at();

-- Insert sample FAQ data
INSERT INTO faq_cache (question, question_variations, answer, citations, category, priority) VALUES
(
  'Hóa chất nguy hiểm là gì?',
  ARRAY['Định nghĩa hóa chất nguy hiểm', 'Hóa chất nguy hiểm theo pháp luật', 'Thế nào là hóa chất nguy hiểm'],
  'Theo Nghị định 26/2026/NĐ-CP, hóa chất nguy hiểm là hóa chất có một hoặc nhiều tính chất nguy hiểm về gây cháy, nổ, oxy hóa, ăn mòn, độc hại, phóng xạ, lây nhiễm... đe dọa đến con người, môi trường và tài sản.',
  '[{"document": "Nghị định 26/2026/NĐ-CP", "article": "Điều 3", "clause": "Khoản 1", "page": 2}]'::jsonb,
  'regulations',
  100
),
(
  'Giấy phép kinh doanh hóa chất cần điều kiện gì?',
  ARRAY['Điều kiện cấp giấy phép kinh doanh hóa chất', 'Yêu cầu để xin giấy phép hóa chất', 'Thủ tục cấp phép kinh doanh hóa chất'],
  'Để được cấp giấy phép kinh doanh hóa chất theo Nghị định 25/2026/NĐ-CP, doanh nghiệp cần: (1) Có cơ sở vật chất, thiết bị phù hợp, (2) Có nhân sự được đào tạo về an toàn hóa chất, (3) Có phương án ứng phó sự cố, (4) Cam kết tuân thủ quy định an toàn.',
  '[{"document": "Nghị định 25/2026/NĐ-CP", "article": "Điều 15", "clause": "Khoản 1, 2, 3", "page": 8}]'::jsonb,
  'licensing',
  95
),
(
  'MSDS là gì?',
  ARRAY['Phiếu an toàn hóa chất', 'Material Safety Data Sheet', 'SDS là gì'],
  'MSDS (Material Safety Data Sheet) hay Phiếu dữ liệu an toàn hóa chất là tài liệu cung cấp thông tin chi tiết về tính chất, nguy hiểm, cách xử lý, bảo quản và ứng phó sự cố của một hóa chất cụ thể. Theo quy định, mọi hóa chất nguy hiểm phải có MSDS kèm theo.',
  '[{"document": "Nghị định 26/2026/NĐ-CP", "article": "Điều 12", "clause": "Khoản 2", "page": 5}]'::jsonb,
  'chemicals',
  90
),
(
  'Khai báo hóa chất như thế nào?',
  ARRAY['Thủ tục khai báo hóa chất', 'Cách thức khai báo hóa chất', 'Quy trình khai báo hóa chất nguy hiểm'],
  'Theo Nghị định 24/2026/NĐ-CP, doanh nghiệp phải khai báo hóa chất thông qua Cổng thông tin quốc gia về hóa chất. Khai báo bao gồm: thông tin doanh nghiệp, loại hóa chất, khối lượng sản xuất/nhập khẩu/kinh doanh, mục đích sử dụng. Thời hạn khai báo: trước ngày 31/3 hàng năm.',
  '[{"document": "Nghị định 24/2026/NĐ-CP", "article": "Điều 8", "clause": "Khoản 1, 2", "page": 4}, {"document": "Nghị định 24/2026/NĐ-CP", "article": "Điều 9", "clause": "Khoản 1", "page": 5}]'::jsonb,
  'declaration',
  85
),
(
  'Ai phải kiểm tra định kỳ về hóa chất?',
  ARRAY['Đối tượng phải kiểm tra hóa chất định kỳ', 'Doanh nghiệp nào cần kiểm tra hóa chất', 'Yêu cầu kiểm tra định kỳ hóa chất'],
  'Theo Luật Hóa chất 69/2025/QH15, các cơ sở sản xuất, kinh doanh hóa chất nguy hiểm với khối lượng từ 10 tấn/năm trở lên phải thực hiện kiểm tra định kỳ về điều kiện an toàn. Cơ quan chức năng sẽ kiểm tra hồ sơ, kho bãi, thiết bị, quy trình vận hành và năng lực nhân sự.',
  '[{"document": "Luật Hóa chất 69/2025/QH15", "article": "Điều 45", "clause": "Khoản 1, 2", "page": 22}]'::jsonb,
  'inspection',
  80
);

-- Add comment to tables
COMMENT ON TABLE message_feedback IS 'Stores user feedback on AI assistant messages for quality improvement';
COMMENT ON TABLE faq_cache IS 'Stores frequently asked questions for offline fallback functionality';
