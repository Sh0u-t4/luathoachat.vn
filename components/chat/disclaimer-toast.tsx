import { Info } from 'lucide-react';

interface DisclaimerToastProps {
  disclaimer1: string;
  disclaimer2: string;
}

export function DisclaimerToast({ disclaimer1, disclaimer2 }: DisclaimerToastProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 mt-0.5">
        <Info className="h-6 w-6 text-cyan-600" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-semibold text-slate-900 text-[17px]">
          Lưu ý quan trọng
        </div>
        <div className="space-y-2 text-slate-700 text-[15px] leading-relaxed">
          <p>{disclaimer1}</p>
          <p>{disclaimer2}</p>
        </div>
      </div>
    </div>
  );
}
