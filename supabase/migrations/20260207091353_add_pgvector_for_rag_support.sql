/*
  # Thêm pgvector Extension và Embedding Columns cho RAG

  ## Mục đích
  Nâng cấp hệ thống lên RAG (Retrieval-Augmented Generation) với vector similarity search
  để cải thiện độ chính xác và tốc độ trả lời (< 3 giây).

  ## 1. Cải tiến
  
  ### Extension pgvector
  - Kích hoạt pgvector để hỗ trợ vector embeddings
  - Sử dụng với OpenAI text-embedding-3-small (dimension 1536)

  ### Bảng legal_articles
  - Thêm cột `embedding` (vector 1536) để lưu semantic representation
  - Index HNSW cho similarity search nhanh

  ### Bảng legal_knowledge_chunks
  - Bảng mới chứa các đoạn văn bản đã được semantic chunking
  - Mỗi chunk = 1 Điều luật hoặc 1 Khoản
  - Có metadata đầy đủ để trích dẫn chính xác

  ## 2. Performance
  - HNSW index cho vector search (tốc độ cao, độ chính xác tốt)
  - Cosine distance metric (phù hợp với OpenAI embeddings)

  ## 3. Security
  - Public READ cho knowledge base
  - Authenticated WRITE cho data ingestion
*/

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to existing legal_articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'legal_articles' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE legal_articles ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- 3. Create new table for semantic chunks (RAG optimized)
CREATE TABLE IF NOT EXISTS legal_knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source document metadata
  document_id uuid NOT NULL REFERENCES legal_documents_2026(id) ON DELETE CASCADE,
  document_code text NOT NULL,
  document_name text NOT NULL,
  
  -- Legal structure (for precise citation)
  article_number integer,
  clause_number integer,
  point_letter text,
  section_title text,
  
  -- Content (original text chunk)
  content text NOT NULL,
  content_length integer GENERATED ALWAYS AS (length(content)) STORED,
  
  -- Vector embedding (OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata for retrieval filtering
  chunk_type text CHECK (chunk_type IN ('article', 'clause', 'point', 'chapter', 'section')),
  applies_to text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  chemical_names text[] DEFAULT '{}',
  
  -- Context preservation
  previous_chunk_id uuid REFERENCES legal_knowledge_chunks(id),
  next_chunk_id uuid REFERENCES legal_knowledge_chunks(id),
  
  -- Tracking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure we can trace back exact legal reference
  CONSTRAINT valid_legal_structure CHECK (
    article_number IS NOT NULL OR section_title IS NOT NULL
  )
);

-- 4. Create HNSW indexes for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_legal_articles_embedding 
  ON legal_articles USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_legal_knowledge_chunks_embedding 
  ON legal_knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 5. Additional indexes for filtering and metadata search
CREATE INDEX IF NOT EXISTS idx_chunks_document 
  ON legal_knowledge_chunks(document_id, article_number);

CREATE INDEX IF NOT EXISTS idx_chunks_keywords 
  ON legal_knowledge_chunks USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_chunks_chemicals 
  ON legal_knowledge_chunks USING gin(chemical_names);

CREATE INDEX IF NOT EXISTS idx_chunks_content_fts 
  ON legal_knowledge_chunks USING gin(to_tsvector('simple', content));

-- 6. Row Level Security
ALTER TABLE legal_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read knowledge chunks"
  ON legal_knowledge_chunks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert knowledge chunks"
  ON legal_knowledge_chunks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update knowledge chunks"
  ON legal_knowledge_chunks FOR UPDATE
  TO authenticated
  USING (true);

-- 7. Auto update timestamps
CREATE TRIGGER update_legal_knowledge_chunks_updated_at
  BEFORE UPDATE ON legal_knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Similarity search function (helper for RAG)
CREATE OR REPLACE FUNCTION search_legal_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_code text,
  article_number integer,
  clause_number integer,
  point_letter text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    legal_knowledge_chunks.id,
    legal_knowledge_chunks.document_code,
    legal_knowledge_chunks.article_number,
    legal_knowledge_chunks.clause_number,
    legal_knowledge_chunks.point_letter,
    legal_knowledge_chunks.content,
    1 - (legal_knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM legal_knowledge_chunks
  WHERE legal_knowledge_chunks.embedding IS NOT NULL
    AND 1 - (legal_knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY legal_knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
