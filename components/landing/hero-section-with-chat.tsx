'use client';

import { useState, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';

interface HeroSectionWithChatProps {
  onSearch: (query: string) => void;
}

export function HeroSectionWithChat({ onSearch }: HeroSectionWithChatProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      onSearch(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Curved Light Effect (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-40">
        <svg
          viewBox="0 0 1440 120"
          className="absolute bottom-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q360,0 720,60 T1440,60 L1440,120 L0,120 Z"
            fill="url(#curveGradient)"
          />
        </svg>
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDE0di0yaDIyem0wLTR2Mkg2di0yaDMweiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center w-full">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight tracking-tight">
          Bạn muốn tư vấn{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient">
            Luật Hóa chất
          </span>{' '}
          hôm nay?
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Trợ lý AI thông minh giúp doanh nghiệp tuân thủ Luật Hóa chất 69/2025 và các Nghị định 2026.
        </p>

        {/* Token Counter (Mock) */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <p className="text-sm text-slate-400">
            85.6M câu hỏi đã được trả lời.
          </p>
          <a
            href="/dang-ky"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Dùng thử Miễn phí →
          </a>
        </div>

        {/* Chat Input Box (Centered) */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />

            <div className="relative flex items-center gap-3 bg-slate-800/90 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50 shadow-2xl">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về Luật Hóa chất, khai báo, giấy phép..."
                className="flex-1 bg-transparent text-white placeholder:text-slate-500 px-4 py-3 text-base focus:outline-none"
              />

              <Button
                type="submit"
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <span className="hidden sm:inline">Tư vấn ngay</span>
                <span className="sm:hidden">Gửi</span>
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Actions / Alternative Start Points */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
          <span>hoặc bắt đầu từ</span>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/50 transition-colors">
            <Sparkles className="w-4 h-4" />
            Câu hỏi thông minh
          </button>
        </div>
      </div>

      {/* Custom Gradient Animation */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
