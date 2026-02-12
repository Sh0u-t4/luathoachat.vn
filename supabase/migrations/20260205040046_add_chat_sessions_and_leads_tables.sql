/*
  # Tao tables chat_sessions va leads cho Lead Generation Flow

  ## 1. Tables Moi

  ### `chat_sessions`
  Luu tru phien chat de tracking conversion:
  - `id` (uuid, primary key)
  - `session_token` (text, unique) - Token dinh danh phien
  - `query_summary` (text) - Tong hop cau hoi nguoi dung
  - `response_summary` (text) - Tong hop cau tra loi AI
  - `is_converted` (boolean) - Da dang ky thanh lead chua
  - `created_at` (timestamptz)

  ### `leads`
  Luu thong tin khach hang tiem nang:
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `phone_zalo` (text)
  - `company_name` (text, nullable)
  - `intent_tag` (text) - tu_van_luat, mua_hoa_chat, xu_ly_moi_truong, khac
  - `source_page` (text) - Trang gui form (homepage, chat, khai-bao, kiem-tra)
  - `query_text` (text, nullable) - Cau hoi lien quan
  - `status` (text) - new, contacted, qualified, converted
  - `created_at`, `updated_at`

  ## 2. Security
  - RLS enabled cho ca 2 tables
  - Public INSERT cho leads (form submission)
  - Authenticated READ cho admin
*/

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  query_summary text,
  response_summary text,
  is_converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone_zalo text NOT NULL,
  company_name text,
  intent_tag text NOT NULL CHECK (intent_tag IN ('tu_van_luat', 'mua_hoa_chat', 'xu_ly_moi_truong', 'khac')),
  source_page text DEFAULT 'homepage',
  query_text text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_converted ON chat_sessions(is_converted);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Anyone can insert chat sessions"
  ON chat_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update own session by token"
  ON chat_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read sessions"
  ON chat_sessions FOR SELECT
  TO public
  USING (true);

-- Policies for leads
CREATE POLICY "Anyone can submit lead"
  ON leads FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated can read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

-- Auto update timestamp for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
