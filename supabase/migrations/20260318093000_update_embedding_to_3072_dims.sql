/*
  # Update knowledge_chunks embedding to 3072 dims (gemini-embedding-001)

  text-embedding-004 (768-dim) is not available in this GCP project.
  The available model is gemini-embedding-001 which outputs 3072-dim vectors.

  Changes:
  1. Drop old HNSW index (tied to wrong dims)
  2. Drop existing embedding column (all embeddings are NULL anyway)
  3. Recreate embedding column as vector(3072)
  4. Recreate HNSW index for the new dimension
  5. Update search_knowledge_base() function signature to vector(3072)
*/

-- 1. Drop old HNSW index
DROP INDEX IF EXISTS idx_knowledge_chunks_embedding;

-- 2. Drop and recreate embedding column with correct dims
ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(3072);

-- 3. Recreate HNSW index for 3072-dim
CREATE INDEX idx_knowledge_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Update the search function to use vector(3072)
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_index INTEGER,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kd.title AS document_title,
    kc.chunk_index,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.embedding IS NOT NULL
    AND kd.status = 'ready'
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
