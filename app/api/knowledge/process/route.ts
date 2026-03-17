import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Chunk text into segments with overlap
function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      const words = current.split(' ');
      current = words.slice(-Math.floor(overlap / 6)).join(' ') + ' ' + sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

// Generate embedding using Gemini text-embedding-004 (768-dim)
async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding error: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

// Extract text from PDF using Gemini File API (for scanned PDFs)
async function extractTextWithGeminiOCR(buffer: Buffer, filename: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  console.log(`[OCR] Uploading ${filename} to Gemini File API for OCR...`);

  // Step 1: Upload file to Gemini File API
  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-Goog-Upload-Command': 'start, upload, finalize',
        'X-Goog-Upload-Header-Content-Length': buffer.length.toString(),
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      },
      body: new Uint8Array(buffer).buffer as ArrayBuffer,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Gemini File upload failed: ${err.slice(0, 300)}`);
  }

  const uploadData = await uploadRes.json();
  const fileUri = uploadData?.file?.uri;
  const fileName = uploadData?.file?.name;

  if (!fileUri) {
    throw new Error('Gemini File API did not return a file URI');
  }

  console.log(`[OCR] File uploaded: ${fileUri}. Running OCR...`);

  try {
    // Step 2: Send to Gemini Vision to extract text
    const ocrRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                fileData: {
                  mimeType: 'application/pdf',
                  fileUri: fileUri,
                },
              },
              {
                text: 'Hãy trích xuất TOÀN BỘ văn bản từ tài liệu PDF này. Giữ nguyên cấu trúc, tiêu đề, số điều khoản, và nội dung. Không tóm tắt, không bỏ bất kỳ thông tin nào. Chỉ trả về văn bản thuần túy.',
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 65536,
          },
        }),
      }
    );

    if (!ocrRes.ok) {
      const err = await ocrRes.text();
      throw new Error(`Gemini OCR failed: ${err.slice(0, 300)}`);
    }

    const ocrData = await ocrRes.json();
    const extractedText = ocrData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Gemini OCR không trích xuất được text từ tài liệu này');
    }

    console.log(`[OCR] Extracted ${extractedText.length} chars via Gemini Vision`);
    return extractedText;

  } finally {
    // Step 3: Cleanup - delete uploaded file from Gemini
    if (fileName) {
      try {
        await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
          { method: 'DELETE' }
        );
        console.log(`[OCR] Cleaned up Gemini file: ${fileName}`);
      } catch {
        // Non-critical — file will auto-expire after 48h
      }
    }
  }
}

// Extract text from PDF stored in Supabase Storage
async function extractPdfText(storagePath: string): Promise<string> {
  // Download file from Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('knowledge-documents')
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Cannot download PDF from storage: ${error?.message}`);
  }

  // Convert blob to buffer and parse with pdf-parse
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Dynamic import for pdf-parse (types declared in types/pdf-parse.d.ts)
  const pdfParse = (await import('pdf-parse')).default ?? (await import('pdf-parse'));

  const parsed = await pdfParse(buffer);

  // If text is scarce → scanned PDF → use Gemini Vision OCR
  if (!parsed.text || parsed.text.trim().length < 50) {
    console.log(`[process] Detected scanned PDF (${parsed.text?.trim().length || 0} chars). Switching to Gemini OCR...`);
    const filename = storagePath.split('/').pop() || 'document.pdf';
    return await extractTextWithGeminiOCR(buffer, filename);
  }

  return parsed.text;
}


export async function POST(request: NextRequest) {
  let document_id: string | undefined;

  try {
    const body = await request.json();
    document_id = body.document_id;
    const { text_content, storage_path, file_type } = body;

    if (!document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 });
    }

    // Verify document exists
    const { data: doc, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, title')
      .eq('id', document_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Extract text: PDF from storage, or use provided text_content
    let textToProcess: string;
    if (file_type === 'pdf' && storage_path) {
      console.log(`[process] Extracting text from PDF: ${storage_path}`);
      textToProcess = await extractPdfText(storage_path);
    } else if (text_content) {
      textToProcess = text_content;
    } else {
      return NextResponse.json({ error: 'text_content or storage_path required' }, { status: 400 });
    }

    // Chunk the text
    const chunks = chunkText(textToProcess);
    console.log(`[process] Processing ${chunks.length} chunks for doc ${document_id}`);

    if (chunks.length === 0) {
      await supabaseAdmin
        .from('knowledge_documents')
        .update({ status: 'error', error_message: 'Không trích xuất được nội dung văn bản' })
        .eq('id', document_id);
      return NextResponse.json({ error: 'No text content found' }, { status: 400 });
    }

    // Generate embeddings and insert chunks
    const chunkInserts = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await generateEmbedding(chunks[i]);
        chunkInserts.push({
          document_id,
          chunk_index: i,
          content: chunks[i],
          embedding: `[${embedding.join(',')}]`,
          metadata: { chunk_index: i, total_chunks: chunks.length },
        });
      } catch (embErr) {
        console.error(`[process] Embedding error for chunk ${i}:`, embErr);
      }
    }

    // Batch insert chunks
    if (chunkInserts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('knowledge_chunks')
        .insert(chunkInserts);

      if (insertError) {
        throw new Error(`Insert chunks failed: ${insertError.message}`);
      }
    }

    // Update document status to ready
    await supabaseAdmin
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: chunkInserts.length })
      .eq('id', document_id);

    return NextResponse.json({
      success: true,
      chunks_created: chunkInserts.length,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[process] Error:', errMsg);

    // Update document status to error
    if (document_id) {
      try {
        await supabaseAdmin
          .from('knowledge_documents')
          .update({ status: 'error', error_message: errMsg })
          .eq('id', document_id);
      } catch {}
    }

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
