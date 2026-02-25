'use client';

interface MobileDisclaimerProps {
  disclaimer1: string;
  disclaimer2: string;
}

/**
 * Mobile Disclaimer Component
 * Hiển thị 2 dòng disclaimer dưới chatbox cho mobile
 */
export function MobileDisclaimer({ disclaimer1, disclaimer2 }: MobileDisclaimerProps) {
  return (
    <div
      className="bg-white/95 backdrop-blur-sm border-t border-slate-200"
      style={{
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="px-4 py-2.5 max-w-4xl mx-auto space-y-1">
        {/* Disclaimer 1 */}
        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          {disclaimer1}
        </p>

        {/* Disclaimer 2 */}
        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          {disclaimer2}
        </p>
      </div>
    </div>
  );
}
