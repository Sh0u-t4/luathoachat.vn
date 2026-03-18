'use client';

import { useState } from 'react';
import { FileText, Scale, ChevronDown, ChevronUp } from 'lucide-react';
import type { Citation } from '@/types';

interface LegalCitationProps {
  citations: Citation[];
}

export function LegalCitation({ citations }: LegalCitationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  // Show only first 2 citations collapsed, expand to show all
  const PREVIEW_COUNT = 2;
  const hasMore = citations.length > PREVIEW_COUNT;
  const visible = expanded ? citations : citations.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-600" />
          <span className="text-sm font-semibold text-slate-700">
            Căn cứ pháp lý
            <span className="ml-2 text-xs font-normal text-slate-500">({citations.length} điều luật)</span>
          </span>
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                Xem thêm {citations.length - PREVIEW_COUNT} nguồn
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((citation, index) => {
          const citationText = formatCitationText(citation);
          return (
            <div
              key={index}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-cyan-700 mb-1">{citationText}</p>
                  {citation.content && (
                    <p className="text-xs text-slate-600 leading-relaxed">{citation.content}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 w-full text-xs text-center text-cyan-700 hover:text-cyan-800 py-1.5 border border-dashed border-cyan-300 rounded-lg hover:bg-cyan-50/40 transition-colors"
        >
          + Xem {citations.length - PREVIEW_COUNT} nguồn trích dẫn khác
        </button>
      )}
    </div>
  );
}

function formatCitationText(citation: Citation): string {
  let text = citation.document;

  if (citation.article && !String(citation.article).includes('chưa xác định') && !String(citation.article).includes('không rõ')) {
    text += `, Điều ${citation.article}`;
    if (citation.clause) text += `, Khoản ${citation.clause}`;
    if (citation.point) text += `, Điểm ${citation.point}`;
  }

  return text;
}
