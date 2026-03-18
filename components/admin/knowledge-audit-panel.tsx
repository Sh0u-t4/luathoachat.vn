'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, AlertTriangle, CheckCircle, AlertCircle, RefreshCw, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocAudit {
  document_id: string;
  title: string;
  status: string;
  doc_key: string | null;
  chunk_count: number;
  avg_chunk_size: number;
  articles_found_count: number;
  expected_range: string;
  missing_articles: number[];
  missing_count: number;
  coverage_rate: number | null;
  quality_issues: Array<{ chunk_index: number; issues: string[] }>;
  quality_issue_count: number;
  encoding_errors: number;
  health: 'good' | 'warning' | 'error';
}

interface AuditData {
  summary: {
    total_documents: number;
    total_chunks: number;
    docs_with_issues: number;
    avg_coverage_rate: number;
    overall_health: string;
  };
  documents: DocAudit[];
  top_missing_articles: string[];
  audited_at: string;
}

const QUALITY_ISSUE_LABELS: Record<string, string> = {
  chunk_too_short: 'Chunk quá ngắn (<150 ký tự)',
  chunk_too_long: 'Chunk quá dài (>3000 ký tự)',
  encoding_error: '🚨 Lỗi encoding (ký tự lạ)',
  cut_mid_article: '✂️ Bị cắt giữa Điều/Khoản',
  too_many_articles_in_chunk: 'Quá nhiều Điều trong 1 chunk (>8)',
};

function HealthBadge({ health }: { health: string }) {
  if (health === 'good') return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> Tốt
    </span>
  );
  if (health === 'warning') return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
      <AlertTriangle className="w-3 h-3" /> Cảnh báo
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
      <AlertCircle className="w-3 h-3" /> Lỗi
    </span>
  );
}

function CoverageBar({ rate }: { rate: number | null }) {
  if (rate === null) return <span className="text-xs text-slate-400">Chưa cấu hình</span>;
  const color = rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
        {rate}%
      </span>
    </div>
  );
}

export function KnowledgeAuditPanel() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/knowledge-audit');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Don't auto-run — let user trigger manually (expensive query)

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-violet-600" />
            Knowledge Base Audit
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kiểm tra độ phủ và chất lượng nội dung các văn bản pháp lý đã index
          </p>
        </div>
        <Button onClick={runAudit} disabled={loading}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Đang kiểm tra...' : 'Chạy Audit'}
        </Button>
      </div>

      {/* Not run yet */}
      {!data && !loading && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nhấn &quot;Chạy Audit&quot; để bắt đầu phân tích</p>
          <p className="text-xs text-slate-400 mt-1">Quét tất cả {'>'}chunks, phát hiện điều thiếu và lỗi chất lượng</p>
        </div>
      )}

      {/* Summary */}
      {data && (
        <>
          <div className={`p-4 rounded-xl border-2 ${
            data.summary.overall_health === 'good' ? 'border-emerald-300 bg-emerald-50'
              : data.summary.overall_health === 'warning' ? 'border-amber-300 bg-amber-50'
              : 'border-red-300 bg-red-50'
          }`}>
            <div className="flex items-center gap-3 flex-wrap">
              <HealthBadge health={data.summary.overall_health} />
              <span className="text-sm font-medium text-slate-700">
                {data.summary.total_documents} văn bản | {data.summary.total_chunks.toLocaleString()} chunks |
                Độ phủ TB: <strong>{data.summary.avg_coverage_rate}%</strong> |
                {data.summary.docs_with_issues} văn bản có vấn đề
              </span>
              <span className="text-xs text-slate-400 ml-auto">
                {new Date(data.audited_at).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>

          {/* Top missing articles */}
          {data.top_missing_articles.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Các Điều quan trọng chưa được index ({data.top_missing_articles.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {data.top_missing_articles.map((art, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                    {art}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-document audit */}
          <div className="space-y-3">
            {data.documents.map(doc => (
              <div key={doc.document_id}
                className={`border rounded-xl overflow-hidden ${
                  doc.health === 'error' ? 'border-red-200'
                    : doc.health === 'warning' ? 'border-amber-200'
                    : 'border-slate-200'
                }`}>
                {/* Header row */}
                <button
                  onClick={() => toggle(doc.document_id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{doc.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {doc.chunk_count} chunks · avg {doc.avg_chunk_size} ký tự/chunk ·
                      {doc.articles_found_count} Điều tìm thấy · {doc.expected_range}
                    </div>
                  </div>
                  <div className="w-32 shrink-0">
                    <CoverageBar rate={doc.coverage_rate} />
                  </div>
                  <div className="shrink-0">
                    <HealthBadge health={doc.health} />
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === doc.document_id && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                    {/* Missing articles */}
                    {doc.missing_articles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1.5">
                          ❌ Điều chưa tìm thấy trong knowledge base ({doc.missing_count}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {doc.missing_articles.slice(0, 30).map(a => (
                            <span key={a} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">
                              Điều {a}
                            </span>
                          ))}
                          {doc.missing_articles.length > 30 && (
                            <span className="text-xs text-slate-400">+{doc.missing_articles.length - 30} nữa...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quality issues */}
                    {doc.quality_issues.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-1.5">
                          ⚠️ Vấn đề chất lượng chunk ({doc.quality_issue_count} chunks):
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {doc.quality_issues.slice(0, 20).map((qi, i) => (
                            <div key={i} className="text-xs flex gap-2 items-start">
                              <span className="text-slate-500 font-mono shrink-0">Chunk #{qi.chunk_index}</span>
                              <div className="flex flex-wrap gap-1">
                                {qi.issues.map(issue => (
                                  <span key={issue} className="bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded">
                                    {QUALITY_ISSUE_LABELS[issue] || issue}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg border p-2">
                        <div className="text-lg font-bold text-slate-800">{doc.chunk_count}</div>
                        <div className="text-xs text-slate-400">Tổng chunks</div>
                      </div>
                      <div className="bg-white rounded-lg border p-2">
                        <div className={`text-lg font-bold ${doc.encoding_errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {doc.encoding_errors}
                        </div>
                        <div className="text-xs text-slate-400">Lỗi encoding</div>
                      </div>
                      <div className="bg-white rounded-lg border p-2">
                        <div className="text-lg font-bold text-slate-800">{doc.avg_chunk_size}</div>
                        <div className="text-xs text-slate-400">Avg chars/chunk</div>
                      </div>
                    </div>

                    {/* Action suggestions */}
                    {doc.health !== 'good' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Khuyến nghị:
                        </p>
                        <ul className="text-xs text-blue-700 space-y-0.5 list-disc ml-4">
                          {doc.missing_count > 20 && <li>Upload lại bản đầy đủ của văn bản này</li>}
                          {doc.missing_count > 0 && doc.missing_count <= 20 && <li>Bổ sung các Điều còn thiếu vào knowledge base</li>}
                          {doc.encoding_errors > 0 && <li>Re-upload với encoding UTF-8 để sửa ký tự lỗi</li>}
                          {doc.quality_issues.some(q => q.issues.includes('chunk_too_short')) && <li>Tăng chunk size tối thiểu khi re-index</li>}
                          {doc.quality_issues.some(q => q.issues.includes('cut_mid_article')) && <li>Cấu hình chunking theo cấu trúc Điều/Khoản</li>}
                        </ul>
                      </div>
                    )}

                    {doc.health === 'good' && (
                      <div className="text-center py-2 text-emerald-600 text-sm font-medium">
                        ✅ Văn bản này không phát hiện vấn đề
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
