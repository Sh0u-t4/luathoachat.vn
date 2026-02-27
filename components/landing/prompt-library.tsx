'use client';

import { useState } from 'react';
import { MessageSquare, Copy, Send, Sparkles, AlertCircle, FileCheck, Building2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface PromptLibraryProps {
  onPromptSelect: (prompt: string) => void;
}

interface PromptCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  question: string;
  preview: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PROMPT_LIBRARY: PromptCard[] = [
  {
    id: 'classification',
    icon: AlertCircle,
    category: 'Phân loại',
    question: 'Hóa chất của tôi có thuộc Phụ lục I, II, III, IV không? Cách xác định theo Nghị định 24/2026?',
    preview: 'Phân loại hóa chất theo 4 phụ lục',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'declaration',
    icon: FileCheck,
    category: 'Khai báo',
    question: 'Doanh nghiệp tôi có phải khai báo hóa chất không? Thủ tục và hồ sơ cần chuẩn bị gì?',
    preview: 'Quy trình khai báo và hồ sơ',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'license',
    icon: Scale,
    category: 'Giấy phép',
    question: 'Kinh doanh hóa chất nào cần Giấy phép? Điều kiện cấp phép theo Nghị định 25/2026?',
    preview: 'Điều kiện cấp giấy phép kinh doanh',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'storage',
    icon: Building2,
    category: 'Lưu kho',
    question: 'Quy định lưu trữ hóa chất nguy hiểm theo Nghị định 26/2026? Kho cần đạt tiêu chuẩn gì?',
    preview: 'Tiêu chuẩn kho và lưu trữ an toàn',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'transition',
    icon: Sparkles,
    category: 'Chuyển tiếp',
    question: 'Doanh nghiệp đang hoạt động có được miễn giấy phép trong thời gian chuyển tiếp không?',
    preview: 'Chính sách chuyển tiếp 2026-2027',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  {
    id: 'penalty',
    icon: AlertCircle,
    category: 'Xử phạt',
    question: 'Mức phạt cho hành vi vi phạm về hóa chất? Tôi có thể bị phạt bao nhiêu nếu không khai báo?',
    preview: 'Mức xử phạt hành chính',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
];

/**
 * Prompt Library - Thư viện câu hỏi mẫu
 * Thay thế Stats Section với thiết kế chat bubble
 */
export function PromptLibrary({ onPromptSelect }: PromptLibraryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  const handlePromptClick = (prompt: PromptCard) => {
    hapticFeedback(HapticPatterns.medium);

    // Animation feedback
    setClickedId(prompt.id);
    setTimeout(() => setClickedId(null), 300);

    // Trigger chat with prompt
    onPromptSelect(prompt.question);

    // Success toast
    toast.success('Đã gửi câu hỏi!', {
      description: 'AI đang xử lý câu hỏi của bạn...',
      duration: 2000,
    });
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <MessageSquare className="w-4 h-4" />
            <span>Prompt Library</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Thư viện câu hỏi mẫu
          </h2>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Click vào bất kỳ câu hỏi nào để AI trả lời ngay lập tức dựa trên{' '}
            <span className="font-semibold text-slate-900">Luật 69/2025</span> và{' '}
            <span className="font-semibold text-slate-900">Nghị định 24, 25, 26/2026</span>
          </p>
        </div>

        {/* Prompt Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMPT_LIBRARY.map((prompt) => {
            const Icon = prompt.icon;
            const isHovered = hoveredId === prompt.id;
            const isClicked = clickedId === prompt.id;

            return (
              <button
                key={prompt.id}
                onClick={() => handlePromptClick(prompt)}
                onMouseEnter={() => setHoveredId(prompt.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  group relative
                  p-6 rounded-2xl
                  border-2 ${prompt.borderColor}
                  ${prompt.bgColor}
                  text-left
                  transition-all duration-300
                  hover:shadow-2xl hover:scale-105 hover:-translate-y-2
                  active:scale-95
                  ${isClicked ? 'scale-95' : ''}
                `}
                style={{
                  transform: isHovered ? 'translateY(-8px) scale(1.05)' : undefined,
                }}
              >
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${prompt.bgColor} flex items-center justify-center border ${prompt.borderColor}`}>
                    <Icon className={`w-5 h-5 ${prompt.color}`} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${prompt.color}`}>
                    {prompt.category}
                  </span>
                </div>

                {/* Question (Chat Bubble Style) */}
                <div className="mb-4">
                  <p className="text-sm md:text-base font-medium text-slate-900 leading-relaxed">
                    {prompt.question}
                  </p>
                </div>

                {/* Preview Tag */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 italic">
                    {prompt.preview}
                  </span>

                  {/* Hover: Show Send Icon */}
                  <div
                    className={`
                      flex items-center gap-1 text-xs font-semibold ${prompt.color}
                      transition-all duration-300
                      ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                    `}
                  >
                    <Send className="w-4 h-4" />
                    <span>Hỏi ngay</span>
                  </div>
                </div>

                {/* Decorative Corner */}
                <div
                  className={`
                    absolute top-3 right-3 w-2 h-2 rounded-full ${prompt.bgColor} border-2 ${prompt.borderColor}
                    transition-all duration-300
                    ${isHovered ? 'scale-150' : 'scale-100'}
                  `}
                />

                {/* Glow Effect on Hover */}
                <div
                  className={`
                    absolute inset-0 rounded-2xl
                    bg-gradient-to-br from-white/50 to-transparent
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                    pointer-events-none
                  `}
                />
              </button>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-500">
            Không tìm thấy câu hỏi phù hợp?{' '}
            <button
              onClick={() => {
                hapticFeedback(HapticPatterns.light);
                onPromptSelect('');
              }}
              className="text-cyan-600 font-semibold hover:text-cyan-700 hover:underline transition-colors cursor-pointer inline"
            >
              Hỏi AI bất kỳ điều gì ở khung chat bên dưới
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
