'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, AlertCircle, ExternalLink, Loader2, ChevronDown, ChevronUp, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DOC_KEYS = ['Luật 69', 'NĐ 24', 'NĐ 25', 'NĐ 26'];

const STATUS_LABELS: Record<string, string> = {
  missing_in_index: '❌ Thiếu trong index (có ở nguồn chính thức)',
  mismatch: '⚠️ Nội dung khác biệt',
  extra_in_index: '➕ Có trong index nhưng không thấy ở nguồn chính thức',
};

interface VerifyResult {
  doc_key: string;
  document_title: string;
  fetch_url: string;
  summary: {
    official_articles_found: number;
    indexed_chunks: number;
    match_count: number;
    mismatch_count: number;
    missing_in_index: number;
    verification_score: number;
    status: 'verified' | 'partial' | 'needs_review';
  };
  discrepancies: Array<{
    article: number;
    status: string;
    similarity?: number;
    official_preview?: string;
    indexed_preview?: string;
  }>;
  verified_at: string;
  note: string;
}

function ScoreBadge({ score, status }: { score: number; status: string }) {
  const color = status === 'verified' ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
    : status === 'partial' ? 'text-amber-700 bg-amber-50 border-amber-300'
    : 'text-red-700 bg-red-50 border-red-300';
  const label = status === 'verified' ? '✅ Đã xác minh'
    : status === 'partial' ? '⚠️ Cần bổ sung'
    : '❌ Cần xem lại';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${color}`}>
      <span className="text-lg">{score}%</span>
      <span>{label}</span>
    </div>
  );
}

export function ContentVerifyPanel() {
  const [docKey, setDocKey] = useState('NĐ 26');
  const [customUrl, setCustomUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandDiscrepancies, setExpandDiscrepancies] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let res: Response;
      if (mode === 'manual') {
        res = await fetch('/api/admin/content-verify', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc_key: docKey, official_text: manualText }),
        });
      } else {
        res = await fetch('/api/admin/content-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc_key: docKey, custom_url: customUrl || undefined }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.suggestion || 'Không thể xác minh. Thử chế độ Paste thủ công.');
      } else {
        setResult(data);
      }
    } catch (e) {
      setError('Lỗi kết nối: ' + String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Xác minh nội dung từ nguồn chính thức
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          So sánh nội dung đã index (từ PDF) với nguồn pháp luật chính thức — phương pháp
          <strong className="text-blue-600"> bổ sung</strong>, không thay thế dữ liệu PDF
        </p>
      </div>

      {/* Architecture note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <strong>Kiến trúc xác minh:</strong>
        <div className="mt-1.5 flex flex-wrap items-center gap-1 font-mono">
          <span className="bg-blue-100 px-2 py-0.5 rounded">PDF → Index</span>
          <span className="text-blue-400">(nguồn chính)</span>
          <span className="text-blue-500 mx-1">⟷ cross-check ⟷</span>
          <span className="bg-blue-100 px-2 py-0.5 rounded">Nguồn chính thức</span>
          <span className="text-blue-400">(xác minh)</span>
          <span className="text-blue-500 mx-1">→</span>
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Phát hiện sai lệch</span>
          <span className="text-blue-500 mx-1">→</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">Admin review</span>
        </div>
      </div>

      {/* Config */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {/* Document selector */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Văn bản cần xác minh</label>
          <div className="flex flex-wrap gap-2">
            {DOC_KEYS.map(k => (
              <button key={k}
                onClick={() => setDocKey(k)}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                  docKey === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                }`}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nguồn xác minh</label>
          <div className="flex gap-2">
            <button onClick={() => setMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                mode === 'auto' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-500'
              }`}>
              <ExternalLink className="w-3.5 h-3.5" />
              Tự động fetch URL
            </button>
            <button onClick={() => setMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                mode === 'manual' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-500'
              }`}>
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste text thủ công
            </button>
          </div>
        </div>

        {/* Custom URL or Manual text */}
        {mode === 'auto' && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              URL tùy chỉnh (để trống để dùng URL mặc định của {docKey})
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              placeholder="https://vbpl.vn/... hoặc https://thuvienphapluat.vn/..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Hỗ trợ: vbpl.vn, thuvienphapluat.vn, chinhphu.vn. Một số trang có thể chặn crawler.
            </p>
          </div>
        )}

        {mode === 'manual' && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Paste toàn văn chính thức của {docKey} (copy từ trình duyệt hoặc PDF đã convert sang text)
            </label>
            <textarea
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              rows={6}
              placeholder={`Điều 1. Phạm vi điều chỉnh\nNghị định này quy định...\n\nĐiều 2. Đối tượng áp dụng\n...`}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Đây là cách chính xác nhất — trực tiếp paste text gốc từ văn bản pháp lý.
            </p>
          </div>
        )}

        <Button onClick={run} disabled={loading || (mode === 'manual' && !manualText.trim())}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? 'Đang xác minh...' : `Xác minh ${docKey}`}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Không thể fetch tự động:</strong> {error}
              {mode === 'auto' && (
                <p className="mt-1 text-xs">→ Thử chuyển sang <strong>Paste text thủ công</strong> để tránh bị chặn.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Score summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">{result.document_title || result.doc_key}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {result.summary.official_articles_found} Điều từ nguồn chính thức •
                  {result.summary.indexed_chunks} chunks đã index •
                  {result.summary.match_count} khớp
                </div>
              </div>
              <ScoreBadge score={result.summary.verification_score} status={result.summary.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                <div className="text-xl font-bold text-emerald-700">{result.summary.match_count}</div>
                <div className="text-xs text-emerald-600">Điều khớp</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                <div className="text-xl font-bold text-amber-700">{result.summary.mismatch_count}</div>
                <div className="text-xs text-amber-600">Khác biệt</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                <div className="text-xl font-bold text-red-700">{result.summary.missing_in_index}</div>
                <div className="text-xs text-red-600">Thiếu trong index</div>
              </div>
            </div>
          </div>

          {/* Discrepancies */}
          {result.discrepancies.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandDiscrepancies(p => !p)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
              >
                <span className="font-semibold text-sm text-slate-800">
                  Sai lệch phát hiện ({result.discrepancies.length})
                </span>
                {expandDiscrepancies ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {expandDiscrepancies && (
                <div className="divide-y border-t">
                  {result.discrepancies.map((d, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">Điều {d.article}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          d.status === 'missing_in_index' ? 'bg-red-100 text-red-700'
                            : d.status === 'mismatch' ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {STATUS_LABELS[d.status] || d.status}
                        </span>
                        {d.similarity !== undefined && (
                          <span className="text-xs text-slate-400">tương đồng: {Math.round(d.similarity * 100)}%</span>
                        )}
                      </div>
                      {d.official_preview && (
                        <div className="text-xs bg-blue-50 border border-blue-100 rounded p-2 text-slate-700">
                          <span className="font-semibold text-blue-600">Nguồn chính thức: </span>{d.official_preview}
                        </div>
                      )}
                      {d.indexed_preview && (
                        <div className="text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-600">
                          <span className="font-semibold text-slate-500">Đã index (PDF): </span>{d.indexed_preview}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div className="text-xs text-slate-400 italic border-t pt-3">
            ℹ️ {result.note}
          </div>
        </div>
      )}
    </div>
  );
}
