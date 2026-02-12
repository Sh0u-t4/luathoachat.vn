/*
  # Tạo Knowledge Base cho Hệ thống Tư vấn Pháp lý Hóa chất 2026

  ## Mục đích
  Xây dựng hệ thống cơ sở dữ liệu để lưu trữ và tra cứu chính xác các văn bản pháp luật 
  về hóa chất Việt Nam 2026, hỗ trợ AI tư vấn với độ chính xác cao.

  ## 1. Tables Mới
  
  ### `legal_documents_2026`
  Lưu trữ 4 văn bản luật chính:
  - Luật Hóa chất 69/2025/QH15
  - Nghị định 24/2026/NĐ-CP (Danh mục)
  - Nghị định 25/2026/NĐ-CP (Phát triển & An toàn)
  - Nghị định 26/2026/NĐ-CP (Quản lý hoạt động)

  ### `legal_articles`
  Lưu từng điều luật chi tiết để tra cứu chính xác đến Điều, Khoản, Điểm

  ### `chemicals_2026`
  Danh mục hóa chất theo Nghị định 24/2026 với đầy đủ metadata pháp lý

  ### `ai_chat_logs`
  Lưu lịch sử chat để cải thiện AI

  ## 2. Security
  - Enable RLS cho tất cả tables
  - Public READ cho knowledge base (tri thức công khai)
  - Authenticated WRITE cho chat logs

  ## 3. Indexes
  - Full-text search cho nội dung và keywords
  - Lookup indexes cho CAS number, appendix
*/

-- 1. CREATE TABLES

CREATE TABLE IF NOT EXISTS legal_documents_2026 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code text UNIQUE NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('law', 'decree', 'circular')),
  issuing_authority text NOT NULL,
  issue_date date NOT NULL,
  effective_date date NOT NULL,
  summary text,
  full_text_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES legal_documents_2026(id) ON DELETE CASCADE,
  article_number integer NOT NULL,
  article_title text NOT NULL,
  clause_number integer,
  point_letter text,
  content text NOT NULL,
  applies_to text[] DEFAULT '{}',
  chemical_category text[] DEFAULT '{}',
  penalty_min numeric,
  penalty_max numeric,
  keywords text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chemicals_2026 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cas_number text UNIQUE,
  vietnamese_name text NOT NULL,
  english_name text NOT NULL,
  formula text,
  decree_24_appendix text NOT NULL CHECK (decree_24_appendix IN ('I', 'II', 'III', 'IV')),
  appendix_category text CHECK (appendix_category IN ('basic', 'banned', 'restricted', 'precursor', 'special_control')),
  requires_incident_plan boolean DEFAULT false,
  threshold_mass_kg numeric,
  license_type text,
  import_declaration_required boolean DEFAULT true,
  special_control boolean DEFAULT false,
  hazard_class text,
  un_number text,
  storage_requirements text,
  legal_reference text,
  penalty_range text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL,
  user_query text NOT NULL,
  detected_chemicals text[] DEFAULT '{}',
  articles_referenced uuid[] DEFAULT '{}',
  ai_response text,
  response_time_ms integer,
  user_feedback text CHECK (user_feedback IN ('helpful', 'not_helpful', 'unclear')),
  created_at timestamptz DEFAULT now()
);

-- 2. INDEXES for Performance

CREATE INDEX IF NOT EXISTS idx_legal_articles_content_search 
  ON legal_articles USING gin(to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_legal_articles_keywords 
  ON legal_articles USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_chemicals_2026_name_search 
  ON chemicals_2026 USING gin(to_tsvector('simple', vietnamese_name || ' ' || english_name));

CREATE INDEX IF NOT EXISTS idx_chemicals_2026_cas 
  ON chemicals_2026(cas_number);

CREATE INDEX IF NOT EXISTS idx_chemicals_2026_appendix 
  ON chemicals_2026(decree_24_appendix);

CREATE INDEX IF NOT EXISTS idx_legal_articles_document 
  ON legal_articles(document_id, article_number);

CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session 
  ON ai_chat_logs(session_token, created_at DESC);

-- 3. ROW LEVEL SECURITY

ALTER TABLE legal_documents_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemicals_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read legal documents"
  ON legal_documents_2026 FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read legal articles"
  ON legal_articles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read chemicals 2026"
  ON chemicals_2026 FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert chat logs"
  ON ai_chat_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can read chat logs"
  ON ai_chat_logs FOR SELECT
  TO authenticated
  USING (true);

-- 4. AUTO UPDATE TIMESTAMPS

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_legal_documents_2026_updated_at
  BEFORE UPDATE ON legal_documents_2026
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_articles_updated_at
  BEFORE UPDATE ON legal_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chemicals_2026_updated_at
  BEFORE UPDATE ON chemicals_2026
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
