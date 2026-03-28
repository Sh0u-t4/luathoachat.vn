-- ============================================================
-- SUPABASE MIGRATION: Legal Knowledge Base Schema (v2)
-- Run trong Supabase Dashboard > SQL Editor
-- Dùng vector(1536) + hnsw index (tránh giới hạn 2000 dims của ivfflat)
-- ============================================================

-- Extension: pgvector
create extension if not exists vector;

-- ── Table 1: Legal Documents (metadata) ──────────────────────
create table if not exists legal_documents_2026 (
  id            uuid primary key default gen_random_uuid(),
  document_code text not null unique,
  document_name text not null,
  document_type text,
  issued_date   date,
  issuer        text,
  created_at    timestamptz default now()
);

-- Seed documents
insert into legal_documents_2026 (document_code, document_name, document_type, issuer) values
  ('24/2026/NĐ-CP',  'Nghị định 24/2026/NĐ-CP — Danh mục hóa chất',              'nghi_dinh', 'Chính phủ'),
  ('25/2026/NĐ-CP',  'Nghị định 25/2026/NĐ-CP — Phát triển công nghiệp hóa chất', 'nghi_dinh', 'Chính phủ'),
  ('26/2026/NĐ-CP',  'Nghị định 26/2026/NĐ-CP — Quản lý hóa chất',               'nghi_dinh', 'Chính phủ'),
  ('69/2025/QH15',   'Luật Hóa chất 69/2025/QH15',                                'luat',      'Quốc hội')
on conflict (document_code) do nothing;

-- ── Table 2: Knowledge Chunks (vector search) ────────────────
-- vector(1536): Gemini embedding-2-preview với output_dimensionality=1536
create table if not exists legal_knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid references legal_documents_2026(id) on delete cascade,
  document_code   text not null,
  document_name   text not null,
  article_number  int,
  clause_number   int,
  point_letter    text,
  section_title   text,
  content         text not null,
  chunk_type      text,
  keywords        text[],
  chemical_names  text[],
  embedding       vector(1536),    -- 1536 dims (Gemini output_dimensionality=1536)
  created_at      timestamptz default now()
);

-- Index HNSW (không giới hạn dims như ivfflat)
create index if not exists legal_knowledge_chunks_embedding_hnsw_idx
  on legal_knowledge_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Index cho filtered search
create index if not exists legal_knowledge_chunks_doc_code_idx
  on legal_knowledge_chunks (document_code);

-- ── RLS Policies ─────────────────────────────────────────────
alter table legal_documents_2026    enable row level security;
alter table legal_knowledge_chunks  enable row level security;

create policy "public_read_documents" on legal_documents_2026
  for select using (true);

create policy "public_read_chunks" on legal_knowledge_chunks
  for select using (true);

create policy "service_insert_chunks" on legal_knowledge_chunks
  for insert with check (true);

create policy "service_delete_chunks" on legal_knowledge_chunks
  for delete using (true);

-- ── Match function ────────────────────────────────────────────
create or replace function match_legal_chunks(
  query_embedding  vector(1536),
  match_threshold  float default 0.5,
  match_count      int   default 10
)
returns table (
  id             uuid,
  document_code  text,
  document_name  text,
  article_number int,
  clause_number  int,
  point_letter   text,
  section_title  text,
  content        text,
  chunk_type     text,
  keywords       text[],
  similarity     float
)
language sql stable as $$
  select
    id, document_code, document_name,
    article_number, clause_number, point_letter,
    section_title, content, chunk_type, keywords,
    1 - (embedding <=> query_embedding) as similarity
  from legal_knowledge_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

select 'Schema created successfully!' as status;
