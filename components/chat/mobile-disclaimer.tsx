'use client';

interface MobileDisclaimerProps {
  disclaimer1: string;
}

/**
 * Mobile Disclaimer Component
 * Hiển thị disclaimer dưới chatbox cho mobile
 */
export function MobileDisclaimer({ disclaimer1 }: MobileDisclaimerProps) {
  return (
    <div
      className="bg-white/95 backdrop-blur-sm border-t border-slate-200"
      style={{
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="px-4 py-2.5 max-w-4xl mx-auto">
        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          {disclaimer1}
        </p>
      </div>
    </div>
  );
}
