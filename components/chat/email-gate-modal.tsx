'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, MessageSquare, History, Bell, Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  subscribe: z.boolean().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface EmailGateModalProps {
  open: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string, currentQuestion: string) => Promise<void>;
  currentQuestion: string;
}

export function EmailGateModal({
  open,
  onClose,
  onEmailSubmit,
  currentQuestion,
}: EmailGateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      subscribe: true,
    },
  });

  const onSubmit = async (data: EmailFormValues) => {
    setIsSubmitting(true);

    try {
      await onEmailSubmit(data.email, currentQuestion);

      // Show success state
      setShowSuccess(true);

      // Auto close after showing success
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Email submission error:', error);
      // Still close on error (better UX)
      setTimeout(() => {
        reset();
        onClose();
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        {showSuccess ? (
          <div className="py-8 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-cyan-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Email đã được lưu!</DialogTitle>
            <DialogDescription>
              Bạn có thể tiếp tục hỏi thêm 3 câu nữa.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-cyan-600" />
              </div>
              <DialogTitle className="text-xl text-slate-900 text-center">
                Tiếp tục trải nghiệm miễn phí
              </DialogTitle>
              <DialogDescription className="text-slate-600 text-center">
                Nhập email để hỏi thêm 3 câu nữa
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 py-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <MessageSquare className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600 font-medium">Hỏi thêm 3 câu</span>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <History className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600 font-medium">Lưu lịch sử</span>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-100">
                <Bell className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600 font-medium">Nhận tin mới</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@congty.vn"
                  autoFocus
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="subscribe" defaultChecked {...register('subscribe')} />
                <label
                  htmlFor="subscribe"
                  className="text-sm text-slate-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Nhận bản tin pháp luật hóa chất
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Tiếp tục hỏi'
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                Email chỉ để lưu lịch sử câu hỏi. Không cần mật khẩu.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
