'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Save, RotateCcw, Loader2, Settings2, Zap, GitBranch, ChevronRight, Info } from 'lucide-react';
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
    { icon: '🔢', label: 'Gemini Embedding', sub: 'text-embedding-004 (768-dim)', color: 'bg-violet-50 border-violet-200 text-violet-700' },
    { icon: '🔍', label: 'Vector Search', sub: 'Supabase pgvector', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    { icon: '📄', label: 'Top-N Chunks', sub: 'Similarity ≥ threshold', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { icon: '🧠', label: 'Gemini AI', sub: 'gemini-2.5-pro', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { icon: '✅', label: 'Trả lời User', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-slate-900">Luồng xử lý AI</h3>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className={`border rounded-xl px-4 py-3 text-center min-w-[110px] ${step.color}`}>
              <div className="text-2xl mb-1">{step.icon}</div>
              <p className="text-xs font-semibold">{step.label}</p>
              {step.sub && <p className="text-[10px] opacity-70 mt-0.5">{step.sub}</p>}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Two source labels */}
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
  );
}

// ─── Slider component ──────────────────────────────────────────────────────
function SliderField({ label, description, value, min, max, step, onChange }: {
  label: string; description: string; value: number;
  min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
      />
      <p className="text-xs text-slate-400">{description}</p>
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
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  );

  const threshold = parseFloat(getValue('ai_match_threshold', '0.6'));
  const matchCount = parseInt(getValue('ai_match_count', '5'));
  const temperature = parseFloat(getValue('ai_temperature', '0.3'));
  const maxTokens = parseInt(getValue('ai_max_tokens', '2000'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cấu hình AI</h2>
            <p className="text-sm text-slate-500">Điều chỉnh hành vi và tham số AI chatbot</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu cấu hình
        </Button>
      </div>

      {/* Flow Diagram */}
      <FlowDiagram />

      {/* System Prompt */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-900">System Prompt</h3>
        </div>
        <p className="text-xs text-slate-400">Hướng dẫn cho AI về vai trò và cách trả lời. Thay đổi sẽ áp dụng ngay cho các cuộc hội thoại mới.</p>
        <textarea
          value={getValue('ai_system_prompt')}
          onChange={e => updateConfig('ai_system_prompt', e.target.value)}
          rows={6}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-violet-300 bg-slate-50"
          placeholder="Nhập system prompt cho AI..."
        />
      </div>

      {/* Parameters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Settings2 className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-900">Tham số RAG & Sinh text</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SliderField
            label="Ngưỡng Similarity"
            description={`Chunk có độ tương đồng < ${threshold} sẽ bị bỏ qua. Tăng = chính xác hơn nhưng ít kết quả hơn.`}
            value={threshold} min={0.1} max={0.99} step={0.05}
            onChange={v => updateConfig('ai_match_threshold', v.toFixed(2))}
          />
          <SliderField
            label="Số Chunks lấy"
            description="Số đoạn văn bản liên quan tối đa đưa vào context AI. Nhiều hơn = đầy đủ hơn nhưng chậm hơn."
            value={matchCount} min={1} max={15} step={1}
            onChange={v => updateConfig('ai_match_count', v.toString())}
          />
          <SliderField
            label="Nhiệt độ (Temperature)"
            description="0 = trả lời chính xác, nhất quán. 1 = sáng tạo, đa dạng hơn. Khuyến nghị: 0.2 - 0.4 cho pháp lý."
            value={temperature} min={0} max={1} step={0.1}
            onChange={v => updateConfig('ai_temperature', v.toFixed(1))}
          />
          <SliderField
            label="Max Tokens"
            description="Độ dài tối đa câu trả lời. 1000 ≈ ngắn gọn, 3000 ≈ rất chi tiết."
            value={maxTokens} min={500} max={4000} step={100}
            onChange={v => updateConfig('ai_max_tokens', v.toString())}
          />
        </div>

        {/* Model selector */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Model AI</label>
          <div className="flex gap-3 flex-wrap">
            {['gemini-3-pro', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'].map(model => (
              <button
                key={model}
                onClick={() => updateConfig('ai_model', model)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  getValue('ai_model') === model
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                }`}
              >
                {model}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">gemini-3-pro: mới nhất | gemini-2.5-pro: chính xác | gemini-2.0-flash: nhanh hơn, rẻ hơn</p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
        <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium mb-1">Lưu ý</p>
          <ul className="space-y-1 text-amber-600 text-xs">
            <li>• Thay đổi cấu hình áp dụng ngay cho các câu hỏi tiếp theo</li>
            <li>• System Prompt được lưu trong database, Edge Function đọc khi xử lý</li>
            <li>• Các tham số RAG ảnh hưởng trực tiếp đến chất lượng và tốc độ trả lời</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
