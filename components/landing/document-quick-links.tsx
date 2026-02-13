'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LegalDocument {
  id: string;
  document_code: string;
  document_name: string;
  document_type: 'law' | 'decree' | 'circular';
  full_text_url: string;
  file_path: string;
}

export function DocumentQuickLinks() {
  const { language } = useLanguage();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents_2026')
        .select('id, document_code, document_name, document_type, full_text_url, file_path')
        .order('document_type', { ascending: true })
        .order('document_code', { ascending: true });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const getDownloadUrl = (doc: LegalDocument) => {
    const sanitizedCode = doc.document_code.replace(/\//g, '-');
    const params = new URLSearchParams({
      path: doc.full_text_url,
      name: `${sanitizedCode}.pdf`,
    });
    return `/api/download-document?${params.toString()}`;
  };

  const handleDownloadClick = async (doc: LegalDocument) => {
    const toastId = toast.loading(`Đang tải xuống: ${doc.document_name}`);

    try {
      const downloadUrl = getDownloadUrl(doc);
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.document_code.replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await fetch('/api/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: doc.id,
          session_id: typeof window !== 'undefined'
            ? localStorage.getItem('chat_session_id') || 'anonymous'
            : 'anonymous'
        })
      });

      toast.success('Tải xuống thành công!', { id: toastId });
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(`Lỗi tải xuống: ${error.message}`, { id: toastId });
    }
  };

  const lawDocs = documents.filter(d => d.document_type === 'law');
  const decreeDocs = documents.filter(d => d.document_type === 'decree');

  return (
    <div className="relative z-10 flex flex-wrap justify-center gap-3">
      {lawDocs.length > 0 && lawDocs.map((doc) => (
        <Button
          key={doc.id}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDownloadClick(doc);
          }}
          variant="outline"
          className="group cursor-pointer pointer-events-auto bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
        >
          <FileText className="w-4 h-4 mr-2" />
          {language === 'vi' ? `Luật ${doc.document_code.split('/')[0]}/${doc.document_code.split('/')[1]}` : `Law ${doc.document_code.split('/')[0]}/${doc.document_code.split('/')[1]}`}
          <Download className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100" />
        </Button>
      ))}

      {decreeDocs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="group cursor-pointer pointer-events-auto bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
            >
              <FileText className="w-4 h-4 mr-2" />
              {language === 'vi' ? 'Nghị định 24, 25, 26/2026' : 'Decrees 24, 25, 26/2026'}
              <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="bg-slate-900/95 backdrop-blur border-slate-700/50 text-slate-200"
          >
            {decreeDocs.map((doc) => (
              <DropdownMenuItem
                key={doc.id}
                onClick={() => handleDownloadClick(doc)}
                className="cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-300"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                {language === 'vi'
                  ? `Nghị định ${doc.document_code.split('/')[0]}/${doc.document_code.split('/')[1]}`
                  : `Decree ${doc.document_code.split('/')[0]}/${doc.document_code.split('/')[1]}`
                }
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
