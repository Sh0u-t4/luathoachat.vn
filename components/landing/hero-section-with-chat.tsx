'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';
import { useGlobalSearchShortcut } from '@/hooks/use-keyboard-shortcut';
import { useRecentSearches } from '@/hooks/use-recent-searches';

interface HeroSectionWithChatProps {
  onSearch: (query: string) => void;
}

const MAX_CHARS = 500;

export function HeroSectionWithChat({ onSearch }: HeroSectionWithChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();
  const { t } = useLanguage();
  const { recentSearches, addSearch, removeSearch } = useRecentSearches();

  // Hydration fix: Only run client-side logic after mount
  useEffect(() => {
    setIsMounted(true);
    // Auto-focus after hydration
    inputRef.current?.focus();
  }, []);

  // Global keyboard shortcut (Cmd/Ctrl + K) - only after mount
  useGlobalSearchShortcut(() => {
    if (isMounted) {
      inputRef.current?.focus();
      setShowRecentSearches(true);
    }
  }, isMounted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const query = inputValue.trim();
      sendMessage(query);
      onSearch(query);
      addSearch(query); // Save to recent searches
      setInputValue('');
      setShowRecentSearches(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Hide recent searches on Escape
    if (e.key === 'Escape') {
      setShowRecentSearches(false);
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setInputValue(query);
    inputRef.current?.focus();
    setShowRecentSearches(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setInputValue(value);
    }
  };

  const charCount = inputValue.length;
  const showCharCounter = charCount > MAX_CHARS * 0.8; // Show when 80% full

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

        {/* Chat Input Box (Centered) */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />

            <div className="relative flex flex-col bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="flex items-center gap-3 p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => isMounted && setShowRecentSearches(true)}
                  onBlur={() => isMounted && setTimeout(() => setShowRecentSearches(false), 200)}
                  placeholder="Hỏi về Luật Hóa chất, khai báo, giấy phép..."
                  maxLength={MAX_CHARS}
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 px-4 py-3 text-base focus:outline-none"
                  aria-label="Search input - Press Cmd/Ctrl+K to focus"
                />

                {/* Character Counter */}
                {showCharCounter && (
                  <span className={`text-xs px-2 ${charCount >= MAX_CHARS ? 'text-red-400' : 'text-slate-400'}`} suppressHydrationWarning>
                    {charCount}/{MAX_CHARS}
                  </span>
                )}

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

              {/* Recent Searches Dropdown - Client-side only */}
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="border-t border-slate-700/50 p-2" suppressHydrationWarning>
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Tìm kiếm gần đây
                    </span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-700/50 rounded-lg cursor-pointer group"
                        onClick={() => handleRecentSearchClick(search.query)}
                      >
                        <span className="text-sm text-slate-300 flex-1 truncate">
                          {search.query}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearch(search.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded"
                        >
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
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
