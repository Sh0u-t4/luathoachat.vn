'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle, Gift, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, getSessionToken } from '@/lib/supabase';
import { useChat } from '@/components/chat/chat-context';

const leadSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  phone_zalo: z
    .string()
    .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)'),
  company_name: z.string().optional(),
  intent_tag: z.string().min(1, 'Vui lòng chọn nhu cầu'),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryContext?: string;
  sourcePage?: string;
}

const INTENT_OPTIONS = [
  { value: 'tu_van_luat', label: 'Tư vấn pháp luật hóa chất' },
  { value: 'mua_hoa_chat', label: 'Mua hóa chất công nghiệp' },
  { value: 'xu_ly_moi_truong', label: 'Xử lý môi trường' },
  { value: 'khac', label: 'Nhu cầu khác' },
];

export function LeadCaptureModal({
  open,
  onOpenChange,
  queryContext,
  sourcePage = 'homepage',
}: LeadCaptureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { unlockContent } = useChat();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      email: '',
      phone_zalo: '',
      company_name: '',
      intent_tag: '',
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('leads').insert({
        email: data.email,
        phone_zalo: data.phone_zalo,
        company_name: data.company_name || null,
        intent_tag: data.intent_tag,
        source_page: sourcePage,
        query_text: queryContext || null,
      });

      if (error) throw error;

      const sessionToken = getSessionToken();
      await supabase
        .from('chat_sessions')
        .update({ is_converted: true })
        .eq('session_token', sessionToken);

      setIsSuccess(true);
      unlockContent();
      toast.success('Đăng ký thành công! Nội dung đã được mở khóa.');

      setTimeout(() => {
        reset();
        setIsSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="py-8 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Đăng ký thành công!</DialogTitle>
            <DialogDescription>
              Nội dung chi tiết đã được mở khóa. Cảm ơn bạn đã sử dụng dịch vụ.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">
                Mở khóa Nội dung Chi tiết
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Đăng ký miễn phí để xem toàn bộ trích dẫn luật và mức phạt chi tiết.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 py-4">
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <FileText className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600">Trích dẫn luật</span>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <Gift className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600">Mẫu văn bản</span>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <Shield className="w-5 h-5 mx-auto mb-1 text-cyan-600" />
                <span className="text-xs text-slate-600">Tư vấn miễn phí</span>
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
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_zalo">
                  Số Zalo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone_zalo"
                  type="tel"
                  placeholder="0912345678"
                  {...register('phone_zalo')}
                  className={errors.phone_zalo ? 'border-red-500' : ''}
                />
                {errors.phone_zalo && (
                  <p className="text-sm text-red-500">{errors.phone_zalo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Tên doanh nghiệp</Label>
                <Input
                  id="company_name"
                  placeholder="Công ty TNHH ABC"
                  {...register('company_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intent_tag">
                  Nhu cầu của bạn <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value) => setValue('intent_tag', value)}>
                  <SelectTrigger className={errors.intent_tag ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Chọn nhu cầu" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.intent_tag && (
                  <p className="text-sm text-red-500">{errors.intent_tag.message}</p>
                )}
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
                  'Mở khóa nội dung'
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                Thông tin của bạn được bảo mật tuyệt đối theo chính sách bảo mật.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
