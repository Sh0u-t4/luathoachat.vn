'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Database } from 'lucide-react';

interface OfflineBannerProps {
  isVisible: boolean;
  cachedFAQCount: number;
}

export function OfflineBanner({ isVisible, cachedFAQCount }: OfflineBannerProps) {
  if (!isVisible) return null;

  return (
    <Alert className="mb-4 border-amber-300 bg-amber-50">
      <WifiOff className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold">Chế độ Offline</AlertTitle>
      <AlertDescription className="text-amber-800">
        <div className="space-y-2">
          <p>
            Bạn đang mất kết nối Internet. Hệ thống sẽ trả lời dựa trên{' '}
            <span className="font-semibold">{cachedFAQCount} câu hỏi thường gặp</span> đã được lưu
            sẵn.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-3.5 w-3.5" />
            <span>Dữ liệu FAQ được cập nhật định kỳ mỗi 24 giờ</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
