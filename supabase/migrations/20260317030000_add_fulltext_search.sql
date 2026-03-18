/*
  # Add Full-Text Search to Knowledge Chunks
  
  Adds a tsvector column and GIN index to knowledge_chunks for fast full-text search.
  This is used as fallback when vector embeddings are not available.
*/

-- Add tsvector column for full-text search
ALTER TABLE knowledge_chunks
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts
  ON knowledge_chunks USING GIN(content_tsv);

-- Full-text search function (no embedding required)
CREATE OR REPLACE FUNCTION search_knowledge_text(
  search_query text,
  match_count int DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_index INTEGER,
  content TEXT,
  rank FLOAT
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
    ts_rank(kc.content_tsv, plainto_tsquery('simple', search_query))::FLOAT AS rank
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'ready'
    AND kc.content_tsv @@ plainto_tsquery('simple', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Hybrid search: combines vector similarity (if available) with text search
CREATE OR REPLACE FUNCTION search_knowledge_hybrid(
  search_query text,
  query_embedding vector(768) DEFAULT NULL,
  match_count int DEFAULT 6
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
  -- If embedding provided, use vector search
  IF query_embedding IS NOT NULL THEN
    RETURN QUERY
      SELECT * FROM search_knowledge_base(query_embedding, 0.3, match_count);
  ELSE
    -- Fallback to full-text search
    RETURN QUERY
    SELECT
      kc.id,
      kc.document_id,
      kd.title AS document_title,
      kc.chunk_index,
      kc.content,
      ts_rank(kc.content_tsv, plainto_tsquery('simple', search_query))::FLOAT AS similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kd.id = kc.document_id
    WHERE kd.status = 'ready'
      AND kc.content_tsv @@ plainto_tsquery('simple', search_query)
    ORDER BY similarity DESC
    LIMIT match_count;
  END IF;
END;
$$;
