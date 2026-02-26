'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SUGGESTED_TOPICS = [
  { icon: FileText, text: 'Nghị định 24/2026/NĐ-CP - Phân loại hóa chất', category: 'Phân loại' },
  { icon: FileText, text: 'Nghị định 25/2026/NĐ-CP - Sản xuất, kinh doanh', category: 'Kinh doanh' },
  { icon: FileText, text: 'Nghị định 26/2026/NĐ-CP - Quản lý hóa chất nguy hiểm', category: 'Quản lý' },
  { icon: Scale, text: 'Luật Hóa chất số 69/2025/QH15', category: 'Luật' },
  { icon: FileText, text: 'Thông tư 01/2026/TT-BCT - Hướng dẫn luật hóa chất', category: 'Thông tư' },
  { icon: FileText, text: 'Thông tư 02/2026/TT-BCT - Quy định mới', category: 'Thông tư' },
  { icon: Scale, text: 'Hóa chất nào cần giấy phép kinh doanh?', category: 'Câu hỏi' },
  { icon: Scale, text: 'Quy trình cấp phép sản xuất hóa chất', category: 'Câu hỏi' },
  { icon: Scale, text: 'Hóa chất tiền chất là gì?', category: 'Câu hỏi' },
  { icon: Scale, text: 'Mức phạt vi phạm về hóa chất', category: 'Câu hỏi' },
];

/**
 * Smart Search Bar - Thanh tìm kiếm thông minh cho Hero Section
 * Hiển thị suggestions, trending topics
 * Khi Enter -> Mở chat window với query
 */
export function SmartSearchBar({ onSearch, placeholder }: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (mounted) {
      setShowSuggestions(isFocused && query.length === 0);
    }
  }, [isFocused, query, mounted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    hapticFeedback(HapticPatterns.success);
    onSearch(query);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (text: string) => {
    hapticFeedback(HapticPatterns.light);
    onSearch(text);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Main Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative flex items-center gap-3
            bg-white rounded-2xl shadow-2xl
            border-2 transition-all duration-300
            ${isFocused
              ? 'border-cyan-500 shadow-cyan-500/30 scale-[1.02]'
              : 'border-slate-200 hover:border-slate-300'
            }
          `}
        >
          {/* Search Icon */}
          <div className="pl-4 md:pl-6 flex-shrink-0">
            <Search className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isFocused ? 'text-cyan-600' : 'text-slate-400'}`} />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={
              placeholder ||
              (isMobile ? 'Hỏi chuyên gia AI về Nghị định...' : 'Hỏi chuyên gia AI về Nghị định 24, 25, 26/2026/NĐ-CP...')
            }
            className="flex-1 py-4 md:py-5 pr-24 md:pr-40 text-base md:text-lg text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />

          {/* Submit Button - Position absolute */}
          <Button
            type="submit"
            disabled={!query.trim()}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              h-10 md:h-12 px-3 md:px-6 rounded-xl
              bg-gradient-to-r from-cyan-600 to-blue-600
              hover:from-cyan-700 hover:to-blue-700
              text-white font-semibold text-sm md:text-base
              disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400
              shadow-lg hover:shadow-xl
              transition-all duration-200
              flex items-center gap-1 md:gap-2
            "
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Tư vấn ngay</span>
            <span className="sm:hidden">Hỏi</span>
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {mounted && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-700">Chủ đề phổ biến</span>
          </div>

          {/* Suggestions List - Scrollable */}
          <div className="py-2 overflow-y-auto">
            {SUGGESTED_TOPICS.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(topic.text)}
                className="w-full px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center group-hover:from-cyan-100 group-hover:to-blue-100 transition-colors flex-shrink-0">
                  <topic.icon className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                    {topic.text}
                  </div>
                  <div className="text-xs text-slate-500">{topic.category}</div>
                </div>
                <Search className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
