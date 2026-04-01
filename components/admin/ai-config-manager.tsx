'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Save, Loader2, Zap, GitBranch, ChevronRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AIConfig {
  key: string;
  value: string;
  description: string;
}

// ─── Processing Flow Diagram ───────────────────────────────────────────────
function FlowDiagram() {
  const steps = [
    { icon: '💬', label: 'Câu hỏi User', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { icon: '🔢', label: 'Gemini Embedding', sub: 'text-embedding-004', color: 'bg-violet-50 border-violet-200 text-violet-700' },
    { icon: '🔍', label: 'Vector Search', sub: 'pgvector', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    { icon: '📄', label: 'Top-N Chunks', sub: 'Similarity ≥ threshold', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { icon: '🧠', label: 'Gemini AI', sub: 'gemini-2.5-pro', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { icon: '✅', label: 'Trả lời User', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center justify-start">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className={`border rounded-xl px-3 py-2 text-center min-w-[90px] ${step.color}`}>
            <div className="text-xl mb-0.5">{step.icon}</div>
            <p className="text-[11px] font-semibold">{step.label}</p>
            {step.sub && <p className="text-[9px] opacity-70 mt-0.5">{step.sub}</p>}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Collapsible Section ────────────────────────────────────────────────────
function CollapsibleSection({
  icon,
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-slate-900 text-sm">{title}</span>
          {badge && (
            <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400" />
          : <ChevronDown className="w-4 h-4 text-slate-400" />
        }
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}



// ─── Main Component ────────────────────────────────────────────────────────
export function AIConfigManager() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-config');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      toast.error('Không thể tải cấu hình AI');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const updateConfig = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  const getValue = (key: string, fallback = '') =>
    configs.find(c => c.key === key)?.value ?? fallback;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      if (!res.ok) throw new Error();
      toast.success('✅ Đã lưu cấu hình AI');
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  );



  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Cấu hình AI</h3>
            <p className="text-xs text-slate-400">Điều chỉnh hành vi và tham số AI chatbot</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Lưu cấu hình
        </Button>
      </div>

      {/* Luồng xử lý — collapsible, closed by default */}
      <CollapsibleSection
        icon={<GitBranch className="w-4 h-4 text-violet-500" />}
        title="Luồng xử lý AI"
        defaultOpen={false}
      >
        <div className="pt-3">
          <FlowDiagram />
          <div className="mt-4 flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-violet-50 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span><b>Knowledge Base</b> — tài liệu Admin upload</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-cyan-50 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span><b>Legal DB</b> — điều luật cố định</span>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* System Prompt — collapsible */}
      <CollapsibleSection
        icon={<Zap className="w-4 h-4 text-orange-500" />}
        title="System Prompt"
        badge="Quan trọng"
        defaultOpen={false}
      >
        <p className="text-xs text-slate-400 mb-3 mt-2">
          Hướng dẫn cho AI về vai trò và cách trả lời. Thay đổi sẽ áp dụng ngay cho các cuộc hội thoại mới.
        </p>
        <textarea
          value={getValue('ai_system_prompt')}
          onChange={e => updateConfig('ai_system_prompt', e.target.value)}
          rows={6}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-violet-300 bg-slate-50"
          placeholder="Nhập system prompt cho AI..."
        />
      </CollapsibleSection>


      {/* Info */}
      <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 space-y-0.5">
          <p className="font-medium">Lưu ý</p>
          <p>• Thay đổi áp dụng ngay cho các câu hỏi tiếp theo</p>
          <p>• System Prompt lưu trong DB, Edge Function đọc khi xử lý</p>
          <p>• Tham số RAG ảnh hưởng trực tiếp đến chất lượng và tốc độ</p>
        </div>
      </div>
    </div>
  );
}
