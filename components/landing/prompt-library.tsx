'use client';

import { useState } from 'react';
import { MessageSquare, Send, Sparkles, AlertCircle, FileCheck, Building2, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';
import { useLanguage } from '@/lib/i18n/context';

interface PromptLibraryProps {
  onPromptSelect: (prompt: string) => void;
}

export function PromptLibrary({ onPromptSelect }: PromptLibraryProps) {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  const PROMPT_LIBRARY = [
    {
      id: 'classification',
      icon: AlertCircle,
      category: t.promptLibrary.card1Category,
      question: t.promptLibrary.card1Question,
      preview: t.promptLibrary.card1Preview,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'declaration',
      icon: FileCheck,
      category: t.promptLibrary.card2Category,
      question: t.promptLibrary.card2Question,
      preview: t.promptLibrary.card2Preview,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'license',
      icon: Scale,
      category: t.promptLibrary.card3Category,
      question: t.promptLibrary.card3Question,
      preview: t.promptLibrary.card3Preview,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'storage',
      icon: Building2,
      category: t.promptLibrary.card4Category,
      question: t.promptLibrary.card4Question,
      preview: t.promptLibrary.card4Preview,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'transition',
      icon: Sparkles,
      category: t.promptLibrary.card5Category,
      question: t.promptLibrary.card5Question,
      preview: t.promptLibrary.card5Preview,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    },
    {
      id: 'penalty',
      icon: AlertCircle,
      category: t.promptLibrary.card6Category,
      question: t.promptLibrary.card6Question,
      preview: t.promptLibrary.card6Preview,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];

  const handlePromptClick = (prompt: typeof PROMPT_LIBRARY[0]) => {
    hapticFeedback(HapticPatterns.medium);

    setClickedId(prompt.id);
    setTimeout(() => setClickedId(null), 300);

    onPromptSelect(prompt.question);

    toast.success(t.promptLibrary.sentToast, {
      description: t.promptLibrary.sentToastDesc,
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
            <span>{t.promptLibrary.sectionBadge}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {t.promptLibrary.title}
          </h2>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {t.promptLibrary.subtitle}{' '}
            <span className="font-semibold text-slate-900">{t.promptLibrary.subtitleLaw}</span>{' '}
            {t.promptLibrary.subtitleDecrees !== t.promptLibrary.subtitleLaw && (
              <>
                {'và '}
                <span className="font-semibold text-slate-900">{t.promptLibrary.subtitleDecrees}</span>
              </>
            )}
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

                {/* Question */}
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
                    <span>{t.promptLibrary.askNow}</span>
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
            {t.promptLibrary.ctaText}{' '}
            <button
              onClick={() => {
                hapticFeedback(HapticPatterns.light);
                onPromptSelect('');
              }}
              className="text-cyan-600 font-semibold hover:text-cyan-700 hover:underline transition-colors cursor-pointer inline"
            >
              {t.promptLibrary.ctaLink}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
