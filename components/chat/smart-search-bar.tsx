'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback, HapticPatterns } from '@/lib/mobile/utils';
import { useLanguage } from '@/lib/i18n/context';

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

interface SuggestedTopic {
  icon: React.ElementType;
  text: string;
  textEn: string;
  category: string;
  categoryEn: string;
}

const SUGGESTED_TOPICS: SuggestedTopic[] = [
  { icon: FileText, text: 'Nghị định 24/2026/NĐ-CP - Phân loại hóa chất', textEn: 'Decree 24/2026/ND-CP - Chemical Classification', category: 'Phân loại', categoryEn: 'Classification' },
  { icon: FileText, text: 'Nghị định 25/2026/NĐ-CP - Sản xuất, kinh doanh', textEn: 'Decree 25/2026/ND-CP - Production & Trading', category: 'Kinh doanh', categoryEn: 'Trading' },
  { icon: FileText, text: 'Nghị định 26/2026/NĐ-CP - Quản lý hóa chất nguy hiểm', textEn: 'Decree 26/2026/ND-CP - Hazardous Chemical Management', category: 'Quản lý', categoryEn: 'Management' },
  { icon: Scale, text: 'Luật Hóa chất số 69/2025/QH15', textEn: 'Chemical Law No. 69/2025/QH15', category: 'Luật', categoryEn: 'Law' },
  { icon: FileText, text: 'Thông tư 01/2026/TT-BCT - Hướng dẫn luật hóa chất', textEn: 'Circular 01/2026/TT-BCT - Chemical Law Guidance', category: 'Thông tư', categoryEn: 'Circular' },
  { icon: FileText, text: 'Thông tư 02/2026/TT-BCT - Quy định mới', textEn: 'Circular 02/2026/TT-BCT - New Regulations', category: 'Thông tư', categoryEn: 'Circular' },
  { icon: Scale, text: 'Hóa chất nào cần giấy phép kinh doanh?', textEn: 'Which chemicals require a business license?', category: 'Câu hỏi', categoryEn: 'Question' },
  { icon: Scale, text: 'Quy trình cấp phép sản xuất hóa chất', textEn: 'Chemical production licensing procedure', category: 'Câu hỏi', categoryEn: 'Question' },
  { icon: Scale, text: 'Hóa chất tiền chất là gì?', textEn: 'What are precursor chemicals?', category: 'Câu hỏi', categoryEn: 'Question' },
  { icon: Scale, text: 'Mức phạt vi phạm về hóa chất', textEn: 'Penalties for chemical violations', category: 'Câu hỏi', categoryEn: 'Question' },
];

/**
 * Smart Search Bar - Bilingual (VI/EN)
 */
export function SmartSearchBar({ onSearch, placeholder }: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    setMounted(true);
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

  const handleSuggestionClick = (topic: SuggestedTopic) => {
    hapticFeedback(HapticPatterns.light);
    const text = language === 'en' ? topic.textEn : topic.text;
    onSearch(text);
    setQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative px-4 sm:px-0">
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
            placeholder={placeholder || t.common.searchPlaceholder}
            className="flex-1 py-4 md:py-5 pr-16 sm:pr-32 md:pr-40 text-base md:text-lg text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!query.trim()}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              h-9 sm:h-10 md:h-12 px-2.5 sm:px-4 md:px-6 rounded-lg md:rounded-xl
              bg-gradient-to-r from-cyan-600 to-blue-600
              hover:from-cyan-700 hover:to-blue-700
              text-white font-semibold text-xs sm:text-sm md:text-base
              disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400
              shadow-lg hover:shadow-xl
              transition-all duration-200
              flex items-center gap-1 md:gap-2
            "
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{language === 'en' ? 'Ask AI' : 'Hỏi AI'}</span>
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {mounted && showSuggestions && (
        <div className="absolute top-full left-4 right-4 sm:left-0 sm:right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] sm:max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-700">
              {language === 'en' ? 'Popular topics' : 'Chủ đề phổ biến'}
            </span>
          </div>

          {/* Suggestions List */}
          <div className="py-2 overflow-y-auto">
            {SUGGESTED_TOPICS.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(topic)}
                className="w-full px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center group-hover:from-cyan-100 group-hover:to-blue-100 transition-colors flex-shrink-0">
                  <topic.icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 sm:truncate">
                    {language === 'en' ? topic.textEn : topic.text}
                  </div>
                  <div className="text-xs text-slate-500">
                    {language === 'en' ? topic.categoryEn : topic.category}
                  </div>
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
