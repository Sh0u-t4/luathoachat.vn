'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FlaskConical, Mail, MapPin, ExternalLink } from 'lucide-react';
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

export function Footer() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents_2026')
        .select('id, document_code, document_name, document_type, full_text_url, file_path')
        .in('document_code', ['69/2025/QH15', '24/2026/NĐ-CP', '25/2026/NĐ-CP', '26/2026/NĐ-CP', '02/2026/TT-BCT'])
        .order('document_type', { ascending: true });

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

  const handleDownloadClick = async (e: React.MouseEvent, doc: LegalDocument) => {
    e.preventDefault();

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

  const serviceLinks = [
    { label: t.nav.compliance, href: '/kiem-tra' },
    { label: t.nav.guidance, href: '/giay-phep' },
    { label: t.nav.declaration, href: '/khai-bao' },
  ];

  const getLegalDocumentLabel = (code: string) => {
    switch (code) {
      case '69/2025/QH15':
        return t.footer.law69;
      case '24/2026/NĐ-CP':
        return t.footer.decree24;
      case '25/2026/NĐ-CP':
        return t.footer.decree25;
      case '26/2026/NĐ-CP':
        return t.footer.decree26;
      case '02/2026/TT-BCT':
        return t.footer.circular02;
      default:
        return code;
    }
  };

  const supportLinks = [
    { label: t.footer.terms, href: '/dieu-khoan' },
    { label: t.footer.privacy, href: '/chinh-sach-bao-mat' },
    { label: t.footer.disclaimer, href: '/mien-tru' },
    { label: t.nav.contact, href: '/lien-he' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl font-bold text-white">LuatHoaChat.vn</span>
            </Link>
            <p className="text-sm text-slate-400 mb-6">
              {t.footer.description}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>info@luathoachat.vn</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>65 N4 KDC Phú Mỹ Hiệp, Tân Đông Hiệp, HCM</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.resources}</h3>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href="#"
                    onClick={(e) => handleDownloadClick(e, doc)}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    {getLegalDocumentLabel(doc.document_code)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              {t.footer.copyright}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/dieu-khoan" className="hover:text-cyan-400 transition-colors">
                {t.footer.terms}
              </Link>
              <Link href="/chinh-sach-bao-mat" className="hover:text-cyan-400 transition-colors">
                {t.footer.privacy}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
