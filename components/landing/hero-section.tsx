'use client';

import { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

interface LegalDocument {
  id: string;
  document_code: string;
  document_name: string;
  document_type: 'law' | 'decree' | 'circular';
  full_text_url: string;
  summary: string;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendMessage } = useChat();
  const { t } = useLanguage();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents_2026')
        .select('id, document_code, document_name, document_type, full_text_url, summary')
        .order('document_type', { ascending: false })
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getDownloadUrl = (doc: LegalDocument) => {
    const sanitizedCode = doc.document_code.replace(/\//g, '-');
    const params = new URLSearchParams({
      path: doc.full_text_url,
      name: `${sanitizedCode}.pdf`,
    });
    return `/api/download-document?${params.toString()}`;
  };

  const handleDownloadClick = async (e: React.MouseEvent, doc: LegalDocument) => {
    e.preventDefault();

    const sessionId = typeof window !== 'undefined'
      ? localStorage.getItem('chat_session_id') || 'anonymous'
      : 'anonymous';

    toast.loading(`Đang tải xuống: ${doc.document_name}`);

    try {
      const downloadUrl = getDownloadUrl(doc);
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.document_code.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      fetch('/api/track-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: doc.id,
          sessionId,
        }),
      }).catch((err) => console.error('Track download error:', err));

      toast.dismiss();
      toast.success(`Tải xuống thành công: ${doc.document_name}`);
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.dismiss();
      toast.error(`Không thể tải xuống file: ${error.message}`);
    }
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
          {loading ? (
            <div className="text-slate-400">Đang tải văn bản...</div>
          ) : (
            <>
              {documents
                .filter((doc) => doc.document_type === 'law')
                .map((doc) => (
                  <a
                    key={doc.id}
                    href={getDownloadUrl(doc)}
                    onClick={(e) => handleDownloadClick(e, doc)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{doc.document_name}</span>
                    <Download className="w-4 h-4" />
                  </a>
                ))}

              {documents.filter((doc) => doc.document_type === 'decree').length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/50">
                      <FileText className="w-4 h-4" />
                      <span>Nghị định 24, 25, 26/2026</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700">
                    {documents
                      .filter((doc) => doc.document_type === 'decree')
                      .map((doc) => (
                        <DropdownMenuItem key={doc.id} asChild>
                          <a
                            href={getDownloadUrl(doc)}
                            onClick={(e) => handleDownloadClick(e, doc)}
                            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-700 cursor-pointer w-full"
                            title={doc.summary}
                          >
                            <FileText className="w-4 h-4 text-green-400" />
                            <span className="flex-1">{doc.document_code}</span>
                            <Download className="w-4 h-4 text-slate-400" />
                          </a>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {documents.filter((doc) => doc.document_type === 'circular').length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-amber-500/50">
                      <FileText className="w-4 h-4" />
                      <span>Thông tư 02/2026</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700">
                    {documents
                      .filter((doc) => doc.document_type === 'circular')
                      .map((doc) => (
                        <DropdownMenuItem key={doc.id} asChild>
                          <a
                            href={getDownloadUrl(doc)}
                            onClick={(e) => handleDownloadClick(e, doc)}
                            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-slate-700 cursor-pointer w-full"
                            title={doc.summary}
                          >
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span className="flex-1">{doc.document_code}</span>
                            <Download className="w-4 h-4 text-slate-400" />
                          </a>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
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
