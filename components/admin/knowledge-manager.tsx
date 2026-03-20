'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Brain, RefreshCw, Eye, X, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/context';
import { toast } from 'sonner';

interface KnowledgeDocument {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: 'processing' | 'ready' | 'error';
  chunk_count: number;
  error_message?: string;
  created_at: string;
}

interface KnowledgeChunk {
  id: string;
  chunk_index: number;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') return (
    <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Sẵn sàng
    </Badge>
  );
  if (status === 'processing') return (
    <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
      <Loader2 className="w-3 h-3 animate-spin" /> Đang xử lý
    </Badge>
  );
  return (
    <Badge className="gap-1 bg-red-100 text-red-700 border-red-200">
      <AlertCircle className="w-3 h-3" /> Lỗi
    </Badge>
  );
}

// ─── Document Detail Modal ────────────────────────────────────────────────────
function DocumentDetailModal({
  doc,
  onClose,
}: {
  doc: KnowledgeDocument;
  onClose: () => void;
}) {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/knowledge/documents/${doc.id}/chunks`);
        const data = await res.json();
        setChunks(data.chunks || []);
      } catch {
        toast.error('Không thể tải nội dung chunks');
      } finally {
        setLoading(false);
      }
    })();
  }, [doc.id]);

  const filtered = chunks.filter(c =>
    !search || c.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative z-10 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            doc.file_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <FileText className={`w-5 h-5 ${doc.file_type === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg leading-tight truncate">{doc.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{doc.file_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
          {[
            { label: 'Loại file', value: doc.file_type.toUpperCase() },
            { label: 'Kích thước', value: formatBytes(doc.file_size) },
            { label: 'Số Chunks', value: doc.chunk_count?.toString() ?? '—' },
            { label: 'Upload lúc', value: new Date(doc.created_at).toLocaleString('vi-VN') },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg px-3 py-2 border border-slate-100">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
            </div>
          ))}
          <div className="col-span-2 bg-white rounded-lg px-3 py-2 border border-slate-100 flex items-center gap-3">
            <p className="text-xs text-slate-400 flex-shrink-0">Trạng thái</p>
            <StatusBadge status={doc.status} />
            {doc.error_message && (
              <p className="text-xs text-red-400 truncate">{doc.error_message}</p>
            )}
          </div>
        </div>

        {/* Chunks section */}
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Nội dung chunks ({filtered.length})</h3>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm trong chunks..."
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {search ? 'Không tìm thấy kết quả' : 'Chưa có chunk nào'}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filtered.map((chunk) => {
                const isExpanded = expandedIdx === chunk.chunk_index;
                const preview = chunk.content.slice(0, 180);
                const hasMore = chunk.content.length > 180;
                return (
                  <div
                    key={chunk.id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-violet-200 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 cursor-pointer select-none"
                      onClick={() => setExpandedIdx(isExpanded ? null : chunk.chunk_index)}
                    >
                      <span className="text-xs font-mono bg-violet-100 text-violet-600 px-2 py-0.5 rounded-md flex-shrink-0">
                        #{chunk.chunk_index + 1}
                      </span>
                      <p className="text-xs text-slate-500 flex-1 truncate">{preview}…</p>
                      {hasMore && (
                        isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-white border-t border-slate-100">
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
                        <p className="text-[10px] text-slate-300 mt-2">{chunk.content.length} ký tự</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function KnowledgeManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [reprocessingAll, setReprocessingAll] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [submittingText, setSubmittingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReprocessAll = async () => {
    if (!confirm('Xử lý lại tất cả tài liệu bị lỗi hoặc 0 chunks? Quá trình này có thể mất vài phút.')) return;
    setReprocessingAll(true);
    try {
      const res = await fetch('/api/knowledge/reprocess-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ Đã xử lý lại ${data.succeeded}/${data.processed} tài liệu, tổng ${data.total_chunks_created} chunks`);
      await fetchDocuments();
    } catch (err) {
      toast.error('Lỗi: ' + (err as Error).message);
    } finally {
      setReprocessingAll(false);
    }
  };

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmitText = async () => {
    if (!textTitle.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!textContent.trim() || textContent.trim().length < 20) { toast.error('Nội dung quá ngắn (tối thiểu 20 ký tự)'); return; }

    setSubmittingText(true);
    try {
      // Tạo document record không có file upload
      const res = await fetch('/api/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: textTitle.trim(),
          file_name: `${textTitle.trim()}.txt`,
          file_type: 'txt',
          file_size: new Blob([textContent]).size,
          uploaded_by: user?.id,
          storage_path: '',
        }),
      });
      const docData = await res.json();
      if (!res.ok) throw new Error(docData.error);

      setShowTextInput(false);
      setTextTitle('');
      setTextContent('');
      toast.info('Ðang tạo embeddings...');
      await processDocument(docData.document.id, textContent.trim(), '', 'txt');
    } catch (err) {
      toast.error('Lỗi: ' + (err as Error).message);
    } finally {
      setSubmittingText(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const processDocument = async (documentId: string, textContent: string, storagePath = '', fileType = 'txt') => {
    setProcessingId(documentId);
    try {
      const res = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: documentId,
          text_content: textContent || undefined,
          storage_path: storagePath || undefined,
          file_type: fileType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ Đã tạo ${data.chunks_created} chunks từ tài liệu`);
      await fetchDocuments();
    } catch (err) {
      toast.error('Lỗi xử lý tài liệu: ' + (err as Error).message);
      await fetchDocuments();
    } finally {
      setProcessingId(null);
    }
  };

  const handleFile = async (file: File) => {
    const allowedTypes = ['text/plain', 'application/pdf'];
    const allowedExts = ['.txt', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast.error('Chỉ hỗ trợ file TXT và PDF');
      return;
    }

    const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'txt';
    const title = file.name.replace(/\.[^.]+$/, '');

    setUploading(true);
    try {
      // Use UUID-based storage path to avoid any filename encoding issues
      // The original filename is preserved in the database record
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const storagePath = `${user?.id}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Upload file to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-documents')
        .upload(storagePath, file);

      if (storageError) throw new Error(storageError.message);

      // 2. Create document record
      const res = await fetch('/api/knowledge/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          uploaded_by: user?.id,
          storage_path: storagePath,
        }),
      });
      const docData = await res.json();
      if (!res.ok) throw new Error(docData.error);

      toast.info('📤 Đang xử lý và tạo embeddings...');

      // 3. Process: TXT = read client-side, PDF = extract server-side
      if (fileType === 'pdf') {
        // Server downloads from storage and uses pdf-parse
        await processDocument(docData.document.id, '', storagePath, 'pdf');
      } else {
        // TXT: đọc client-side với fallback encoding cho file Windows-ANSI tiếng Việt
        const arrayBuffer = await file.arrayBuffer();

        // Thử UTF-8 trước
        let text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);

        // Nếu có ký tự lỗi (U+FFFD) → file là ANSI/Windows-1252
        if (text.includes('\uFFFD')) {
          text = new TextDecoder('windows-1252', { fatal: false }).decode(arrayBuffer);
        }

        // Nếu vẫn rỗng sau 2 lần thử
        if (!text || text.trim().length < 5) {
          toast.error('Không đọc được nội dung file TXT. Hãy lưu file với encoding UTF-8 và thử lại.');
          return;
        }

        await processDocument(docData.document.id, text, '', 'txt');
      }

    } catch (err) {
      toast.error('Lỗi upload: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      await handleFile(file);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xóa tài liệu "${title}"?\nToàn bộ dữ liệu embedding sẽ bị xóa.`)) return;
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xóa tài liệu');
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch {
      toast.error('Không thể xóa tài liệu');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  };

  const stats = {
    total: documents.length,
    ready: documents.filter(d => d.status === 'ready').length,
    chunks: documents.filter(d => d.status === 'ready').reduce((s, d) => s + (d.chunk_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Detail modal */}
      {selectedDoc && (
        <DocumentDetailModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      {/* Direct text input modal */}
      {showTextInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTextInput(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Nhập văn bản trực tiếp</h3>
              <button onClick={() => setShowTextInput(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-400">Dán nội dung điều luật trực tiếp — không cần tạo file. Hệ thống sẽ tự động chia chunks và tạo embeddings.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tiêu đề tài liệu</label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={e => setTextTitle(e.target.value)}
                  placeholder="Ví dụ: Điều 18 NĐ 25/2026 - Thời hạn chứng chỉ tư vấn"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Nội dung văn bản</label>
                <textarea
                  value={textContent}
                  onChange={e => setTextContent(e.target.value)}
                  rows={12}
                  placeholder="Dán nội dung điều luật vào đây..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">{textContent.length} ký tự</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowTextInput(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Hủy</button>
              <button
                onClick={handleSubmitText}
                disabled={submittingText}
                className="px-5 py-2 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-60 flex items-center gap-2"
              >
                {submittingText ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><Brain className="w-4 h-4" /> Tạo Embedding</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Knowledge Base</h2>
            <p className="text-sm text-slate-500">Quản lý tài liệu cho AI chatbot</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocuments} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTextInput(true)}
            className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <FileText className="w-4 h-4" /> Nhập text
          </Button>
          <Button
            size="sm"
            onClick={handleReprocessAll}
            disabled={reprocessingAll}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {reprocessingAll
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
              : <><Brain className="w-4 h-4" /> Xử lý lại tất cả</>}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng tài liệu', value: stats.total, color: 'text-slate-900' },
          { label: 'Sẵn sàng', value: stats.ready, color: 'text-emerald-600' },
          { label: 'Tổng Chunks', value: stats.chunks.toLocaleString(), color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${dragging ? 'border-violet-400 bg-violet-50 scale-[1.01]' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.pdf"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) handleFiles(files);
            e.target.value = '';
          }}
        />
        {uploading || processingId ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
            <p className="text-sm font-medium text-violet-700">
              {uploading ? 'Đang upload...' : 'Đang xử lý và tạo embeddings...'}
            </p>
            <p className="text-xs text-slate-400">Quá trình này có thể mất 30-60 giây</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Kéo thả file vào đây</p>
              <p className="text-sm text-slate-400 mt-1">hoặc click để chọn file (có thể chọn nhiều)</p>
            </div>
            <div className="flex gap-2 mt-1">
              {['TXT', 'PDF'].map(t => (
                <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Tài liệu đã upload</h3>
          <span className="text-xs text-slate-400">{documents.length} tài liệu</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Chưa có tài liệu nào</p>
            <p className="text-xs text-slate-300 mt-1">Upload PDF hoặc TXT để bắt đầu</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                {/* File icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc.file_type === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                  <FileText className={`w-5 h-5 ${doc.file_type === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400">{doc.file_name}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{formatBytes(doc.file_size)}</span>
                    {doc.status === 'ready' && (
                      <>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-violet-500">{doc.chunk_count} chunks</span>
                      </>
                    )}
                    {doc.status === 'error' && doc.error_message && (
                      <span className="text-xs text-red-400 truncate max-w-[200px]" title={doc.error_message}>
                        {doc.error_message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <StatusBadge status={doc.status} />

                {/* Date */}
                <span className="text-xs text-slate-400 hidden sm:block">
                  {new Date(doc.created_at).toLocaleDateString('vi-VN')}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                    className="text-violet-400 hover:text-violet-600 hover:bg-violet-50 p-2 h-8 w-8"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.title); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl">
        <Brain className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-violet-700">
          <p className="font-medium mb-1">Cách hoạt động</p>
          <ul className="space-y-1 text-violet-600 text-xs">
            <li>• Tài liệu được chia thành các đoạn nhỏ (chunks) và chuyển thành vector embedding</li>
            <li>• Khi user chat, AI tự động tìm các đoạn liên quan nhất để trả lời</li>
            <li>• Click vào tài liệu để xem chi tiết nội dung đã được trích xuất</li>
            <li>• Chỉ Admin mới có thể upload/xóa tài liệu</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
