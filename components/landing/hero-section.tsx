'use client';

import { useState } from 'react';
import { Search, ArrowRight, ListChecks, FileInput, Calendar, Download, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const { sendMessage } = useChat();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      sendMessage(searchValue.trim());
      onSearch(searchValue.trim());
      setSearchValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
    onSearch(suggestion);
  };

  const suggestions = [t.hero.suggestion1, t.hero.suggestion2, t.hero.suggestion3];

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDE0di0yaDIyem0wLTR2Mkg2di0yaDMweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          {t.hero.title1}{' '}
          <span className="gradient-text">{t.hero.title2}</span>
          <br />
          <span className="text-slate-400 text-3xl md:text-4xl lg:text-5xl">
            {t.hero.title3}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <a
            href="/documents/luat-hoa-chat-69-2025.pdf"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
          >
            <FileText className="w-4 h-4" />
            <span>Luật Hóa chất 69/2025</span>
            <Download className="w-4 h-4" />
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/50">
                <FileText className="w-4 h-4" />
                <span>Nghị định 24, 25, 26/2026</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700">
              <DropdownMenuItem asChild>
                <a
                  href="/documents/nghi-dinh-24-2026.pdf"
                  download
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="flex-1">Nghị định 24/2026/NĐ-CP</span>
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="/documents/nghi-dinh-25-2026.pdf"
                  download
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="flex-1">Nghị định 25/2026/NĐ-CP</span>
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="/documents/nghi-dinh-26-2026.pdf"
                  download
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="flex-1">Nghị định 26/2026/NĐ-CP</span>
                  <Download className="w-4 h-4 text-slate-400" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-4">
          <div className="relative search-glow rounded-full bg-white/95 backdrop-blur transition-all duration-300">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t.common.searchPlaceholder}
              className="w-full py-4 pl-14 pr-44 text-lg rounded-full border-0 focus:outline-none focus:ring-0 bg-transparent text-slate-900 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-6"
            >
              {t.hero.searchButton}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>

        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
            <Calendar className="w-3 h-3" />
            <span>{t.common.dataUpdated}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <span className="text-slate-500 text-sm">{t.common.suggestions}:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-sm bg-white/5 text-slate-300 rounded-full border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <FeatureCard
            icon={ListChecks}
            title={t.features.penalties.title}
            description={t.features.penalties.description}
          />
          {/* <FeatureCard
            icon={Ruler}
            title={t.features.msds.title}
            description={t.features.msds.description}
          /> */}
          <FeatureCard
            icon={FileInput}
            title={t.features.ghs.title}
            description={t.features.ghs.description}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-5 bg-white/5 backdrop-blur border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer">
      <div className="w-10 h-10 mb-3 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
