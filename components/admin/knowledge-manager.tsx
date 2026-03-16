'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2, Brain, RefreshCw } from 'lucide-react';
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

export function KnowledgeManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const processDocument = async (documentId: string, text: string) => {
    setProcessingId(documentId);
    try {
      const res = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, text_content: text }),
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
      // 1. Upload file to Supabase Storage
      const storagePath = `${user?.id}/${Date.now()}_${file.name}`;
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

      toast.info('📤 Đang đọc nội dung và tạo embeddings...');

      // 3. Extract text and process
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text || text.trim().length < 10) {
          toast.error('Không đọc được nội dung file. Thử file TXT thuần túy.');
          return;
        }
        await processDocument(docData.document.id, text);
      };
      reader.onerror = () => toast.error('Lỗi đọc file');
      reader.readAsText(file, 'utf-8');

    } catch (err) {
      toast.error('Lỗi upload: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xóa tài liệu "${title}"?\nToàn bộ dữ liệu embedding sẽ bị xóa.`)) return;
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xóa tài liệu');
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch {
      toast.error('Không thể xóa tài liệu');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const stats = {
    total: documents.length,
    ready: documents.filter(d => d.status === 'ready').length,
    chunks: documents.filter(d => d.status === 'ready').reduce((s, d) => s + (d.chunk_count || 0), 0),
  };

  return (
    <div className="space-y-6">
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
        <Button variant="outline" size="sm" onClick={fetchDocuments} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
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
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
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
              <p className="text-sm text-slate-400 mt-1">hoặc click để chọn file</p>
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
              <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
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

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all p-2 h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
            <li>• Chỉ Admin mới có thể upload/xóa tài liệu</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
