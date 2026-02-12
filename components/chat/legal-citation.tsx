import { FileText, Scale } from 'lucide-react';
import type { Citation } from '@/types';

interface LegalCitationProps {
  citations: Citation[];
}

export function LegalCitation({ citations }: LegalCitationProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-4 h-4 text-cyan-600" />
        <span className="text-sm font-semibold text-slate-700">
          Căn cứ pháp lý
        </span>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => {
          const citationText = formatCitationText(citation);

          return (
            <div
              key={index}
              className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-cyan-700 mb-1">
                    {citationText}
                  </p>
                  {citation.content && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {citation.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatCitationText(citation: Citation): string {
  let text = `${citation.document}, Điều ${citation.article}`;

  if (citation.clause) {
    text += `, Khoản ${citation.clause}`;
  }

  if (citation.point) {
    text += `, Điểm ${citation.point}`;
  }

  return text;
}
