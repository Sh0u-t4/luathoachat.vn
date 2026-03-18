'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, TrendingUp, MessageSquare, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  period_days: number;
  total_responses: number;
  avg_latency_ms: number;
  response_complete_rate: number;
  response_truncated_count: number;
  feedback: { like: number; dislike: number; positive_rate: number | null };
  question_types: Record<string, number>;
  response_formats: Record<string, number>;
  citations: { avg_per_response: number; zero_citation_rate: number };
  daily_activity: Array<{ date: string; count: number }>;
  alerts: Array<{ level: 'critical' | 'warning'; message: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  tra_cuu_don: 'Tra cứu đơn',
  liet_ke: 'Liệt kê',
  so_sanh: 'So sánh',
  phuc_hop: 'Phức hợp',
  quy_trinh: 'Quy trình',
  off_topic: 'Ngoài chủ đề',
  unknown: 'Chưa phân loại',
};

const FORMAT_LABELS: Record<string, string> = {
  table: 'Bảng', list: 'Danh sách', structured: 'Có cấu trúc', text: 'Văn xuôi',
};

const TYPE_COLORS: Record<string, string> = {
  tra_cuu_don: 'bg-cyan-500', liet_ke: 'bg-blue-500', so_sanh: 'bg-violet-500',
  phuc_hop: 'bg-orange-500', quy_trinh: 'bg-emerald-500', off_topic: 'bg-rose-500', unknown: 'bg-slate-500',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-cyan-600' }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-slate-600 text-right shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-14 text-xs text-slate-500 text-right">{count} ({pct}%)</div>
    </div>
  );
}

function ActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (!data || data.length === 0) return <div className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.slice(-14).map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-cyan-500 rounded-t-sm min-h-[2px] transition-all"
            style={{ height: `${Math.max(2, Math.round(d.count / max * 56))}px` }}
            title={`${d.date}: ${d.count} câu`}
          />
          <div className="text-[9px] text-slate-400">{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

export function AIAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const totalTypes = data ? Object.values(data.question_types).reduce((s, c) => s + c, 0) : 0;
  const totalFormats = data ? Object.values(data.response_formats).reduce((s, c) => s + c, 0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            AI Analytics Dashboard
          </h2>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-0.5">
              Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')} · Tự động refresh mỗi 5 phút
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map(d => (
            <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'}
              className={days === d ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : ''}
              onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              alert.level === 'critical' ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}
      {data && data.alerts.length === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Hệ thống hoạt động bình thường. Không có cảnh báo.</span>
        </div>
      )}

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={MessageSquare} label="Tổng câu trả lời" value={data.total_responses}
            sub={`${days} ngày qua`} />
          <StatCard icon={CheckCircle} label="Response hoàn chỉnh" value={`${data.response_complete_rate}%`}
            sub={`Target: >95%`}
            color={data.response_complete_rate >= 95 ? 'text-emerald-600' : 'text-red-600'} />
          <StatCard icon={TrendingUp} label="Feedback tích cực"
            value={data.feedback.positive_rate !== null ? `${data.feedback.positive_rate}%` : 'N/A'}
            sub={`${data.feedback.like}👍 ${data.feedback.dislike}👎`}
            color={data.feedback.positive_rate !== null && data.feedback.positive_rate >= 85 ? 'text-emerald-600' : 'text-amber-600'} />
          <StatCard icon={Clock} label="Latency trung bình"
            value={`${Math.round(data.avg_latency_ms / 1000)}s`}
            sub={`Target: <10s`}
            color={data.avg_latency_ms < 10000 ? 'text-emerald-600' : 'text-amber-600'} />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Citation stats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-semibold text-slate-700">Citation Quality</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Avg per response</span>
                <span className="font-semibold">{data.citations.avg_per_response}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thiếu citation</span>
                <span className={`font-semibold ${data.citations.zero_citation_rate > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {data.citations.zero_citation_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Response bị cắt</span>
                <span className={`font-semibold ${data.response_truncated_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {data.response_truncated_count}
                </span>
              </div>
            </div>
          </div>

          {/* Question types */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Loại câu hỏi</h3>
            <div className="space-y-1.5">
              {Object.entries(data.question_types).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <BarRow key={type} label={TYPE_LABELS[type] || type}
                  count={count} total={totalTypes} color={TYPE_COLORS[type] || 'bg-slate-400'} />
              ))}
            </div>
          </div>

          {/* Response formats */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Format trả lời</h3>
            <div className="space-y-1.5">
              {Object.entries(data.response_formats).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => (
                <BarRow key={fmt} label={FORMAT_LABELS[fmt] || fmt}
                  count={count} total={totalFormats} color="bg-blue-400" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily activity */}
      {data && data.daily_activity.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Hoạt động theo ngày</h3>
          <ActivityChart data={data.daily_activity} />
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-12 text-slate-400">Đang tải analytics...</div>
      )}
    </div>
  );
}
