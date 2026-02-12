'use client';

import { FileText, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n/context';

interface SubDoc {
  title: string;
  file: string;
}

interface Document {
  title: string;
  file: string;
  icon: React.ElementType;
  isMultiple?: boolean;
  subDocs?: SubDoc[];
}

export function DocumentQuickLinks() {
  const { language } = useLanguage();

  const documents: Document[] = language === 'vi' ? [
    {
      title: 'Luật Hóa chất 69/2025',
      file: '/documents/luat-hoa-chat-69-2025.pdf',
      icon: FileText,
    },
    {
      title: 'Nghị định 24, 25, 26/2026',
      file: '/documents/nghi-dinh-24-2026.pdf',
      icon: FileText,
      isMultiple: true,
      subDocs: [
        { title: 'Nghị định 24/2026', file: '/documents/nghi-dinh-24-2026.pdf' },
        { title: 'Nghị định 25/2026', file: '/documents/nghi-dinh-25-2026.pdf' },
        { title: 'Nghị định 26/2026', file: '/documents/nghi-dinh-26-2026.pdf' },
      ]
    },
  ] : [
    {
      title: 'Chemical Law 69/2025',
      file: '/documents/luat-hoa-chat-69-2025.pdf',
      icon: FileText,
    },
    {
      title: 'Decrees 24, 25, 26/2026',
      file: '/documents/nghi-dinh-24-2026.pdf',
      icon: FileText,
      isMultiple: true,
      subDocs: [
        { title: 'Decree 24/2026', file: '/documents/nghi-dinh-24-2026.pdf' },
        { title: 'Decree 25/2026', file: '/documents/nghi-dinh-25-2026.pdf' },
        { title: 'Decree 26/2026', file: '/documents/nghi-dinh-26-2026.pdf' },
      ]
    },
  ];

  const handleDownload = (file: string) => {
    console.log('📥 Downloading:', file);
    window.open(file, '_blank');
  };

  return (
    <div className="relative z-10 flex flex-wrap justify-center gap-3">
      {documents.map((doc) => {
        if (doc.isMultiple && doc.subDocs) {
          // Dropdown menu cho nhiều file
          return (
            <DropdownMenu key={doc.title}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="group cursor-pointer pointer-events-auto bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                >
                  <doc.icon className="w-4 h-4 mr-2" />
                  {doc.title}
                  <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="bg-slate-900/95 backdrop-blur border-slate-700/50 text-slate-200"
              >
                {doc.subDocs.map((subDoc) => (
                  <DropdownMenuItem
                    key={subDoc.file}
                    onClick={() => handleDownload(subDoc.file)}
                    className="cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 focus:bg-cyan-500/20 focus:text-cyan-300"
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    {subDoc.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Button đơn cho file đơn lẻ
        return (
          <Button
            key={doc.title}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownload(doc.file);
            }}
            variant="outline"
            className="group cursor-pointer pointer-events-auto bg-slate-900/50 border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-cyan-500/50 hover:text-cyan-300 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
          >
            <doc.icon className="w-4 h-4 mr-2" />
            {doc.title}
            <Download className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100" />
          </Button>
        );
      })}
    </div>
  );
}
