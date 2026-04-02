'use client';

import { useLanguage } from '@/lib/i18n/context';
import { SmartSearchBar } from '@/components/chat/smart-search-bar';

interface HeroSectionSearchProps {
  onSearch: (query: string) => void;
}

/**
 * Hero Section với Smart Search Bar - Fully bilingual (VI/EN)
 */
export function HeroSectionSearch({ onSearch }: HeroSectionSearchProps) {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[72vh] flex items-center justify-center px-4 overflow-hidden">
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center w-full space-y-8">

        {/* Main Heading */}
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-5 leading-tight tracking-tight">
            {t.hero.searchTitle}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient">
              {t.hero.searchTitleHighlight}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-3 font-light">
            {t.hero.searchTagline}
          </p>

          <p className="text-base md:text-lg text-slate-400 max-w-3xl mx-auto">
            {t.hero.searchDescription}
          </p>
        </div>

        {/* Smart Search Bar */}
        <div>
          <SmartSearchBar onSearch={onSearch} />
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
