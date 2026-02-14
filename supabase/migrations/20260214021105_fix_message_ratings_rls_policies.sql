/*
  # Fix Message Ratings RLS Policies

  ## Problem
  RLS policies đang cố lấy session_id từ JWT claims, nhưng session_id không được lưu ở đó.
  Điều này chặn tất cả users khỏi việc đọc và cập nhật ratings.

  ## Solution
  - Đơn giản hóa policies
  - Cho phép tất cả users (kể cả anon) đọc ratings
  - Cho phép users xóa ratings thông qua API (không cần RLS check)
  - Admin vẫn có quyền đọc tất cả

  ## Changes
  - Drop các policies cũ sử dụng JWT claims
  - Tạo policies mới đơn giản hơn
  - Ratings là dữ liệu công khai nên cho phép đọc tự do
*/

-- Drop old problematic policies
DROP POLICY IF EXISTS "Users can view own ratings" ON message_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON message_ratings;
DROP POLICY IF EXISTS "Anyone can create ratings" ON message_ratings;

-- Policy: Allow everyone to read ratings (public data)
CREATE POLICY "Anyone can view ratings"
  ON message_ratings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow everyone to insert ratings
CREATE POLICY "Anyone can insert ratings"
  ON message_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow everyone to update ratings
-- (We'll handle session validation in the API)
CREATE POLICY "Anyone can update ratings"
  ON message_ratings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow everyone to delete ratings
-- (We'll handle session validation in the API)
CREATE POLICY "Anyone can delete ratings"
  ON message_ratings
  FOR DELETE
  TO anon, authenticated
  USING (true);
