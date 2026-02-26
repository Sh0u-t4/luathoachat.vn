import { Info } from 'lucide-react';

interface DisclaimerToastProps {
  disclaimer: string;
}

export function DisclaimerToast({ disclaimer }: DisclaimerToastProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 mt-0.5">
        <Info className="h-6 w-6 text-cyan-600" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-slate-900 text-[17px]">
          Lưu ý quan trọng
        </div>
        <div className="text-slate-700 text-[15px] leading-relaxed">
          <p>{disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
