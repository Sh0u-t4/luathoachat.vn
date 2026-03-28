/**
 * SCRIPT INGESTION - SEMANTIC CHUNKING CHO VĂN BẢN LUẬT
 *
 * Quy trình:
 * 1. Đọc file PDF/DOCX từ thư mục data/legal-documents
 * 2. Chunking THÔNG MINH theo cấu trúc luật (Điều, Khoản, Điểm)
 * 3. Tạo embedding với OpenAI text-embedding-3-small
 * 4. Lưu vào Supabase legal_knowledge_chunks
 *
 * YÊU CẦU:
 * - Node.js >= 18
 * - Environment variables: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

// Load .env manually (tsx doesn't auto-load dotenv)
const envPath = path.join(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

// ============================================================================
// CONFIGURATION (read AFTER .env is loaded)
// ============================================================================

const GEMINI_EMBED_MODEL = 'gemini-embedding-2-preview';

// Lazy getter — ensures env is already loaded before reading
function getConfig() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

  if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env');
  if (!SUPABASE_SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY in .env');

  return { SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, GEMINI_EMBED_URL };
}

// Supabase client — initialized lazily inside main()
let supabase: ReturnType<typeof createClient>;

// Mapping văn bản -> document_id
// Keys must match substrings of actual filenames in extracted-text/
const DOCUMENT_MAPPING: Record<string, { id: string; code: string; name: string }> = {
  'nghi_dinh_24': {
    id: '',
    code: '24/2026/NĐ-CP',
    name: 'Nghị định 24/2026/NĐ-CP',
  },
  'nghi_dinh_25': {
    id: '',
    code: '25/2026/NĐ-CP',
    name: 'Nghị định 25/2026/NĐ-CP',
  },
  'nghi_dinh_26': {
    id: '',
    code: '26/2026/NĐ-CP',
    name: 'Nghị định 26/2026/NĐ-CP',
  },
  '69qh': {
    id: '',
    code: '69/2025/QH15',
    name: 'Luật Hóa chất 69/2025/QH15',
  },
};

// ============================================================================
// SEMANTIC CHUNKING ENGINE
// ============================================================================

interface LegalChunk {
  document_code: string;
  document_name: string;
  article_number?: number;
  clause_number?: number;
  point_letter?: string;
  section_title?: string;
  content: string;
  chunk_type: 'article' | 'clause' | 'point' | 'chapter' | 'section';
  keywords: string[];
  chemical_names: string[];
}

/**
 * REGEX PATTERNS để nhận dạng cấu trúc luật Việt Nam
 */
const PATTERNS = {
  // "Điều 5. Nguyên tắc quản lý"
  article: /^Điều\s+(\d+)\.\s*(.+?)$/gim,

  // "1. Nội dung khoản 1"
  clause: /^(\d+)\.\s+(.+?)$/gim,

  // "a) Điểm a"
  point: /^([a-z])\)\s+(.+?)$/gim,

  // "Chương I" hoặc "PHẦN I"
  chapter: /^(Chương|PHẦN)\s+([IVX\d]+)[\.:\s]*(.+?)$/gim,
};

/**
 * Hàm chunking thông minh - Cắt theo cấu trúc luật
 */
function semanticChunk(rawText: string, documentInfo: { code: string; name: string }): LegalChunk[] {
  const chunks: LegalChunk[] = [];
  // Strip the "     N→" line-number prefix added by OCR scripts
  const stripPrefix = (line: string) => line.replace(/^\s*\d+→/, '').trim();
  const lines = rawText.split('\n').map(line => stripPrefix(line)).filter(line => line.length > 0);

  let currentArticle: number | null = null;
  let currentClause: number | null = null;
  let currentChunkContent: string[] = [];
  let currentChunkType: LegalChunk['chunk_type'] = 'article';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Kiểm tra "Điều X"
    const articleMatch = line.match(/^Điều\s+(\d+)/i);
    if (articleMatch) {
      // Lưu chunk trước (nếu có)
      if (currentChunkContent.length > 0) {
        chunks.push(createChunk(
          currentChunkContent.join('\n'),
          documentInfo,
          currentArticle,
          currentClause,
          null,
          currentChunkType
        ));
      }

      // Bắt đầu Điều mới
      currentArticle = parseInt(articleMatch[1]);
      currentClause = null;
      currentChunkContent = [line];
      currentChunkType = 'article';
      continue;
    }

    // Kiểm tra "Khoản X"
    const clauseMatch = line.match(/^(\d+)\.\s+/);
    if (clauseMatch && currentArticle) {
      // Lưu khoản trước (nếu có)
      if (currentClause !== null && currentChunkContent.length > 1) {
        chunks.push(createChunk(
          currentChunkContent.join('\n'),
          documentInfo,
          currentArticle,
          currentClause,
          null,
          'clause'
        ));
      }

      // Bắt đầu khoản mới
      currentClause = parseInt(clauseMatch[1]);
      currentChunkContent = [line];
      currentChunkType = 'clause';
      continue;
    }

    // Nối nội dung vào chunk hiện tại
    currentChunkContent.push(line);
  }

  // Lưu chunk cuối cùng
  if (currentChunkContent.length > 0) {
    chunks.push(createChunk(
      currentChunkContent.join('\n'),
      documentInfo,
      currentArticle,
      currentClause,
      null,
      currentChunkType
    ));
  }

  return chunks;
}

/**
 * Tạo chunk object với metadata
 */
function createChunk(
  content: string,
  documentInfo: { code: string; name: string },
  articleNumber: number | null,
  clauseNumber: number | null,
  pointLetter: string | null,
  chunkType: LegalChunk['chunk_type']
): LegalChunk {
  return {
    document_code: documentInfo.code,
    document_name: documentInfo.name,
    article_number: articleNumber || undefined,
    clause_number: clauseNumber || undefined,
    point_letter: pointLetter || undefined,
    content,
    chunk_type: chunkType,
    keywords: extractKeywords(content),
    chemical_names: extractChemicalNames(content),
  };
}

/**
 * Trích xuất keywords từ nội dung
 */
function extractKeywords(content: string): string[] {
  const keywords: string[] = [];
  const lowerContent = content.toLowerCase();

  // Các từ khóa pháp lý quan trọng
  const legalKeywords = [
    'giấy phép', 'khai báo', 'mức phạt', 'vi phạm', 'cấm', 'hạn chế',
    'nhập khẩu', 'xuất khẩu', 'kinh doanh', 'sản xuất', 'lưu trữ',
    'vận chuyển', 'phụ lục', 'tiền chất', 'đặc biệt', 'nguy hiểm'
  ];

  legalKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  return keywords;
}

/**
 * Trích xuất tên hóa chất từ nội dung
 */
function extractChemicalNames(content: string): string[] {
  const chemicals: string[] = [];
  const commonChemicals = [
    'axit', 'sulfuric', 'hydrochloric', 'hcl', 'h2so4', 'naoh',
    'methanol', 'acetone', 'toluene', 'benzene', 'ammonia'
  ];

  const lowerContent = content.toLowerCase();
  commonChemicals.forEach(chem => {
    if (lowerContent.includes(chem)) {
      chemicals.push(chem);
    }
  });

  return chemicals;
}

// ============================================================================
// EMBEDDING GENERATION — Gemini gemini-embedding-2-preview (output 1536 dims)
// ============================================================================

/**
 * Tạo embedding vector với Gemini text-embedding-004
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { GEMINI_EMBED_URL } = getConfig();
  const response = await fetch(GEMINI_EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${GEMINI_EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 1536,   // Reduce from 3072 → 1536 to match vector(1536) in Supabase
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini embed error ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.embedding.values as number[];
}

/**
 * Tạo embedding cho batch chunks (từng item với delay nhỏ — Gemini free tier)
 */
async function generateEmbeddingsBatch(chunks: LegalChunk[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  console.log(`Generating embeddings for ${chunks.length} chunks using Gemini text-embedding-004...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const key = `${chunk.document_code}-${chunk.article_number}-${chunk.clause_number || 0}-${i}`;

    try {
      const embedding = await generateEmbedding(chunk.content);
      embeddings.set(key, embedding);

      if ((i + 1) % 10 === 0) {
        console.log(`  Embedded ${i + 1}/${chunks.length} chunks`);
      }

      // Small delay to avoid rate limiting on free tier
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Error embedding chunk ${i} (${chunk.document_code} Điều ${chunk.article_number}):`, error);
    }
  }

  console.log(`Embedding complete: ${embeddings.size}/${chunks.length} successful`);
  return embeddings;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Query document IDs từ Supabase
 */
async function getDocumentIds(): Promise<void> {
  const { data, error } = await supabase
    .from('legal_documents_2026')
    .select('id, document_code');

  if (error) {
    console.error('Error fetching document IDs:', error);
    return;
  }

  // Map document_code -> id
  data?.forEach((doc: { id: string; document_code: string }) => {
    Object.keys(DOCUMENT_MAPPING).forEach(key => {
      if (DOCUMENT_MAPPING[key].code === doc.document_code) {
        DOCUMENT_MAPPING[key].id = doc.id;
      }
    });
  });

  console.log('Document IDs loaded:', DOCUMENT_MAPPING);
}

/**
 * Insert chunks vào Supabase
 */
async function insertChunks(chunks: LegalChunk[], embeddings: Map<string, number[]>): Promise<void> {
  console.log(`Inserting ${chunks.length} chunks into Supabase...`);

  const BATCH_SIZE = 50;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const records = batch.map((chunk, batchIndex) => {
      const globalIndex = i + batchIndex;
      const key = `${chunk.document_code}-${chunk.article_number}-${chunk.clause_number || 0}-${globalIndex}`;
      const embedding = embeddings.get(key);

      // Tìm document_id
      const doc = Object.values(DOCUMENT_MAPPING).find(d => d.code === chunk.document_code);

      return {
        document_id: doc?.id || '',
        document_code: chunk.document_code,
        document_name: chunk.document_name,
        article_number: chunk.article_number,
        clause_number: chunk.clause_number,
        point_letter: chunk.point_letter,
        section_title: chunk.section_title,
        content: chunk.content,
        chunk_type: chunk.chunk_type,
        keywords: chunk.keywords,
        chemical_names: chunk.chemical_names,
        embedding: embedding ? `[${embedding.join(',')}]` : null,
      };
    });

    const { error } = await (supabase as any)
      .from('legal_knowledge_chunks')
      .insert(records);

    if (error) {
      console.error(`Error inserting batch ${i}-${i + BATCH_SIZE}:`, error);
    } else {
      console.log(`Inserted ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Legal Document Ingestion with Semantic Chunking...\n');

  // Initialize supabase client AFTER env is loaded
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = getConfig();
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✓ Supabase client initialized');
  console.log('  URL:', SUPABASE_URL.substring(0, 40) + '...');

  // 1. Load document IDs
  await getDocumentIds();

  // 2. Read raw text files (giả định đã extract từ PDF)
  const documentsDir = path.join(process.cwd(), 'data', 'legal-documents', 'extracted-text');

  try {
    const files = await fs.readdir(documentsDir);
    console.log(`Found ${files.length} text files\n`);

    let allChunks: LegalChunk[] = [];

    // 3. Process each file
    for (const file of files) {
      if (!file.endsWith('.txt')) continue;

      console.log(`📄 Processing: ${file}`);
      const filePath = path.join(documentsDir, file);
      const rawText = await fs.readFile(filePath, 'utf-8');

      // Detect document type from filename
      const docKey = Object.keys(DOCUMENT_MAPPING).find(key => file.includes(key));
      if (!docKey) {
        console.log(`⚠️  Skipping ${file} - No matching document mapping`);
        continue;
      }

      const documentInfo = DOCUMENT_MAPPING[docKey];

      // Semantic chunking
      const chunks = semanticChunk(rawText, documentInfo);
      console.log(`  ✓ Created ${chunks.length} chunks`);

      allChunks = allChunks.concat(chunks);
    }

    console.log(`\n📊 Total chunks: ${allChunks.length}\n`);

    // 4. Generate embeddings
    const embeddings = await generateEmbeddingsBatch(allChunks);

    // 5. Insert into Supabase
    await insertChunks(allChunks, embeddings);

    console.log('\n✅ Ingestion completed successfully!');
  } catch (error) {
    console.error('❌ Error during ingestion:', error);
  }
}

// Always run main when executed as a script
main();

export { semanticChunk, generateEmbedding, generateEmbeddingsBatch };
