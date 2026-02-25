'use client';

interface MobileDisclaimerProps {
  disclaimer1: string;
  disclaimer2: string;
}

/**
 * Mobile Disclaimer Component
 * Hiển thị disclaimer dưới chatbox cho mobile theo thiết kế mẫu
 */
export function MobileDisclaimer({ disclaimer1, disclaimer2 }: MobileDisclaimerProps) {
  return (
    <div
      className="bg-white border-t border-slate-200"
      style={{
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="px-4 py-3 max-w-4xl mx-auto">
        {/* Title */}
        <h3 className="text-center text-sm font-semibold text-slate-900 mb-2">
          Dữ liệu sẵn sàng
        </h3>

        {/* Description */}
        <p className="text-center text-xs text-slate-600 leading-relaxed">
          Cập nhật theo <span className="font-medium text-cyan-600">Luật Hóa chất 69/2025</span> và các{' '}
          <span className="font-medium text-cyan-600">Nghị định hướng dẫn 2026</span>
        </p>
      </div>
    </div>
  );
}
