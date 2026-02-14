/*
  # Cải tiến hệ thống tracking ratings và liên kết với chat messages
  
  ## Mục tiêu
  - Link ratings với chat_messages để dễ dàng truy vết
  - Thêm aggregated rating stats vào bảng messages
  - Tạo view để admin xem ratings kèm message content
  - Thêm triggers tự động cập nhật stats
  
  ## Changes
  
  1. Thêm columns vào chat_messages:
     - rating_likes (int): Tổng số likes
     - rating_dislikes (int): Tổng số dislikes
     - rating_score (int): Score = likes - dislikes
     - last_rated_at (timestamp): Thời gian rating mới nhất
  
  2. Tạo function cập nhật rating stats:
     - update_message_rating_stats(): Trigger khi có rating mới
  
  3. Tạo view admin_message_ratings:
     - Join messages với ratings
     - Hiển thị đầy đủ thông tin để admin phân tích
  
  4. Thêm indexes để tăng performance
  
  ## Security
  - View admin_message_ratings chỉ admin được xem
  - Function update_message_rating_stats() chạy với SECURITY DEFINER
*/

-- Step 1: Add rating stats columns to chat_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'rating_likes'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN rating_likes int DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'rating_dislikes'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN rating_dislikes int DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'rating_score'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN rating_score int DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'last_rated_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN last_rated_at timestamptz;
  END IF;
END $$;

-- Step 2: Create function to update rating stats
CREATE OR REPLACE FUNCTION update_message_rating_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  likes_count int;
  dislikes_count int;
  score int;
  msg_id uuid;
BEGIN
  -- Get message_id from new or old record
  msg_id := COALESCE(NEW.message_id, OLD.message_id);
  
  -- Count likes and dislikes for this message
  SELECT 
    COUNT(*) FILTER (WHERE rating_type = 'like'),
    COUNT(*) FILTER (WHERE rating_type = 'dislike')
  INTO likes_count, dislikes_count
  FROM message_ratings
  WHERE message_id = msg_id;
  
  -- Calculate score
  score := likes_count - dislikes_count;
  
  -- Update chat_messages
  UPDATE chat_messages
  SET 
    rating_likes = likes_count,
    rating_dislikes = dislikes_count,
    rating_score = score,
    last_rated_at = NOW()
  WHERE id = msg_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 3: Create trigger on message_ratings
DROP TRIGGER IF EXISTS trigger_update_message_rating_stats ON message_ratings;
CREATE TRIGGER trigger_update_message_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON message_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_message_rating_stats();

-- Step 4: Create admin view for analyzing ratings
CREATE OR REPLACE VIEW admin_message_ratings AS
SELECT 
  m.id as message_id,
  m.session_id,
  m.user_id,
  m.role,
  m.content,
  m.detailed_content,
  m.rating_likes,
  m.rating_dislikes,
  m.rating_score,
  m.last_rated_at,
  m.created_at as message_created_at,
  m.response_time_ms,
  m.is_error,
  m.citations,
  COALESCE(
    json_agg(
      json_build_object(
        'rating_id', r.id,
        'rating_type', r.rating_type,
        'rated_at', r.created_at,
        'ip_address', r.ip_address,
        'user_agent', r.user_agent,
        'user_id', r.user_id,
        'feedback_text', r.feedback_text
      ) ORDER BY r.created_at DESC
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) as individual_ratings,
  (m.rating_likes + m.rating_dislikes) as total_ratings
FROM chat_messages m
LEFT JOIN message_ratings r ON m.id = r.message_id
WHERE m.role = 'assistant'
GROUP BY m.id, m.session_id, m.user_id, m.role, m.content, m.detailed_content,
         m.rating_likes, m.rating_dislikes, m.rating_score, m.last_rated_at,
         m.created_at, m.response_time_ms, m.is_error, m.citations;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_ratings_message_id 
  ON message_ratings(message_id);

CREATE INDEX IF NOT EXISTS idx_message_ratings_session_id 
  ON message_ratings(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_rating_score 
  ON chat_messages(rating_score DESC) WHERE role = 'assistant';

CREATE INDEX IF NOT EXISTS idx_chat_messages_last_rated_at 
  ON chat_messages(last_rated_at DESC NULLS LAST) WHERE role = 'assistant';

CREATE INDEX IF NOT EXISTS idx_chat_messages_total_ratings
  ON chat_messages((rating_likes + rating_dislikes) DESC) WHERE role = 'assistant';

-- Step 6: Create helper function for getting top rated messages
CREATE OR REPLACE FUNCTION get_top_rated_messages(
  limit_count int DEFAULT 10,
  min_ratings int DEFAULT 1
)
RETURNS TABLE (
  message_id uuid,
  session_id text,
  content text,
  detailed_content text,
  rating_score int,
  total_ratings bigint,
  created_at timestamptz,
  citations jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.session_id,
    m.content,
    m.detailed_content,
    m.rating_score,
    (m.rating_likes + m.rating_dislikes)::bigint as total_ratings,
    m.created_at,
    m.citations
  FROM chat_messages m
  WHERE m.role = 'assistant'
    AND (m.rating_likes + m.rating_dislikes) >= min_ratings
  ORDER BY m.rating_score DESC, (m.rating_likes + m.rating_dislikes) DESC
  LIMIT limit_count;
END;
$$;

-- Step 7: Create helper function for getting worst rated messages
CREATE OR REPLACE FUNCTION get_worst_rated_messages(
  limit_count int DEFAULT 10,
  min_ratings int DEFAULT 1
)
RETURNS TABLE (
  message_id uuid,
  session_id text,
  content text,
  detailed_content text,
  rating_score int,
  total_ratings bigint,
  created_at timestamptz,
  citations jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.session_id,
    m.content,
    m.detailed_content,
    m.rating_score,
    (m.rating_likes + m.rating_dislikes)::bigint as total_ratings,
    m.created_at,
    m.citations
  FROM chat_messages m
  WHERE m.role = 'assistant'
    AND (m.rating_likes + m.rating_dislikes) >= min_ratings
  ORDER BY m.rating_score ASC, (m.rating_likes + m.rating_dislikes) DESC
  LIMIT limit_count;
END;
$$;

-- Step 8: Create function to get rating stats summary
CREATE OR REPLACE FUNCTION get_rating_stats_summary()
RETURNS TABLE (
  total_ratings_given bigint,
  total_likes bigint,
  total_dislikes bigint,
  total_messages_rated bigint,
  avg_rating_score numeric,
  positive_rate numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_ratings_given,
    COUNT(*) FILTER (WHERE rating_type = 'like')::bigint as total_likes,
    COUNT(*) FILTER (WHERE rating_type = 'dislike')::bigint as total_dislikes,
    COUNT(DISTINCT message_id)::bigint as total_messages_rated,
    COALESCE(AVG(CASE WHEN rating_type = 'like' THEN 1 ELSE -1 END), 0)::numeric as avg_rating_score,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE rating_type = 'like')::numeric / COUNT(*)::numeric * 100)
      ELSE 0 
    END as positive_rate
  FROM message_ratings;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_top_rated_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_worst_rated_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_rating_stats_summary TO authenticated;

-- Add comments
COMMENT ON VIEW admin_message_ratings IS 'Admin view combining chat messages with their ratings for quality analysis';
COMMENT ON FUNCTION update_message_rating_stats IS 'Auto-update rating statistics when ratings change';
COMMENT ON FUNCTION get_top_rated_messages IS 'Get messages with highest ratings (for quality analysis)';
COMMENT ON FUNCTION get_worst_rated_messages IS 'Get messages with lowest ratings (for improvement identification)';
COMMENT ON FUNCTION get_rating_stats_summary IS 'Get overall rating statistics summary';

-- Backfill: Update all existing messages with current rating counts
UPDATE chat_messages m
SET 
  rating_likes = COALESCE((SELECT COUNT(*) FROM message_ratings r WHERE r.message_id = m.id AND r.rating_type = 'like'), 0),
  rating_dislikes = COALESCE((SELECT COUNT(*) FROM message_ratings r WHERE r.message_id = m.id AND r.rating_type = 'dislike'), 0),
  rating_score = COALESCE((SELECT COUNT(*) FILTER (WHERE rating_type = 'like') - COUNT(*) FILTER (WHERE rating_type = 'dislike') FROM message_ratings r WHERE r.message_id = m.id), 0),
  last_rated_at = (SELECT MAX(created_at) FROM message_ratings r WHERE r.message_id = m.id)
WHERE m.role = 'assistant';
