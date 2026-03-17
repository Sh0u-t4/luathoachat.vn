/*
  # Drop Legacy N8N and Pre-RAG Tables

  Removes all tables and functions from the old n8n integration and the
  previous manual-entry knowledge base system (legal_documents_2026, etc.)
  These are no longer needed since the system now uses the self-hosted
  RAG pipeline with Gemini embeddings (knowledge_documents / knowledge_chunks).

  Tables dropped:
  - n8n_api_keys
  - n8n_chat_logs
  - document_downloads           (download tracking for old legal_documents_2026)
  - legal_knowledge_chunks       (old OpenAI 1536-dim RAG chunks)
  - legal_articles               (FK to legal_documents_2026)
  - ai_chat_logs                 (old chat log table)
  - chemicals_2026               (old manual chemical catalog)
  - legal_documents_2026         (parent table — drop last)

  Functions/views dropped:
  - document_download_stats      (view)
  - increment_download_count     (function)
  - search_legal_knowledge       (function, old RAG search)
*/

-- Drop dependent views first
DROP VIEW IF EXISTS document_download_stats CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS increment_download_count(uuid);
DROP FUNCTION IF EXISTS search_legal_knowledge(vector, float, int);

-- Drop tables with foreign keys first
DROP TABLE IF EXISTS n8n_chat_logs CASCADE;
DROP TABLE IF EXISTS n8n_api_keys CASCADE;
DROP TABLE IF EXISTS document_downloads CASCADE;
DROP TABLE IF EXISTS legal_knowledge_chunks CASCADE;
DROP TABLE IF EXISTS legal_articles CASCADE;
DROP TABLE IF EXISTS ai_chat_logs CASCADE;
DROP TABLE IF EXISTS chemicals_2026 CASCADE;

-- Drop parent table last
DROP TABLE IF EXISTS legal_documents_2026 CASCADE;
