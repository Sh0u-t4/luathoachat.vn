'use client';

import { Info, AlertCircle } from 'lucide-react';

interface MobileDisclaimerProps {
  disclaimer1: string;
  disclaimer2: string;
}

/**
 * Mobile Disclaimer Component
 * Hiển thị 2 dòng disclaimer dưới chatbox cho mobile
 * Luôn visible để đảm bảo khi screenshot vẫn có disclaimer
 */
export function MobileDisclaimer({ disclaimer1, disclaimer2 }: MobileDisclaimerProps) {
  return (
    <div
      className="border-t border-slate-200 bg-white/95 backdrop-blur-sm"
      style={{
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="px-4 py-3 space-y-1.5 max-w-4xl mx-auto">
        {/* Disclaimer 1 */}
        <div className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-cyan-600" />
          <p>{disclaimer1}</p>
        </div>

        {/* Disclaimer 2 */}
        <div className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
          <p>{disclaimer2}</p>
        </div>
      </div>
    </div>
  );
}
