'use client';

import { useRouter } from 'next/navigation';
import { Trophy, CheckCircle2, MessageSquare, History, FileDown, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LoginGateModalProps {
  open: boolean;
  email: string | null;
  questionCount: number;
}

export function LoginGateModal({ open, email, questionCount }: LoginGateModalProps) {
  const router = useRouter();

  const handleSignUp = () => {
    const signupUrl = email
      ? `/dang-ky?email=${encodeURIComponent(email)}&source=chatbot_gate`
      : `/dang-ky?source=chatbot_gate`;
    router.push(signupUrl);
  };

  const handleLogin = () => {
    router.push('/dang-nhap?redirect=/');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl text-slate-900 text-center">
            Bạn đã hỏi {questionCount} câu miễn phí!
          </DialogTitle>
          <div className="flex justify-center mt-2">
            <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
              {questionCount}/5 câu đã sử dụng
            </Badge>
          </div>
          <DialogDescription className="text-slate-600 text-center pt-2">
            Tạo tài khoản để tiếp tục sử dụng không giới hạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-900 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-cyan-600" />
                Hỏi không giới hạn
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Truy vấn pháp luật hóa chất bất kỳ lúc nào
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-900 flex items-center">
                <History className="w-4 h-4 mr-2 text-cyan-600" />
                Lưu lịch sử vĩnh viễn
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Xem lại mọi câu hỏi và trả lời trước đó
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-900 flex items-center">
                <FileDown className="w-4 h-4 mr-2 text-cyan-600" />
                Tải văn bản pháp luật
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Download Nghị định 24, 25, 26/2026 và Luật 69
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-900 flex items-center">
                <Bell className="w-4 h-4 mr-2 text-cyan-600" />
                Nhận cảnh báo luật mới
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Cập nhật sớm nhất các văn bản 2026
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSignUp}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold h-11"
          >
            Đăng ký miễn phí
          </Button>
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-50"
          >
            Đăng nhập
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center pt-2">
          Tài khoản miễn phí, không mất phí
        </p>
      </DialogContent>
    </Dialog>
  );
}
