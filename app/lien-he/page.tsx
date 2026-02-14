'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Mail,
  MapPin,
  Clock,
  Send,
  Building2,
  MessageCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChatProvider } from '@/components/chat/chat-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Hỗ trợ',
    value: 'info@luathoachat.vn',
    subtext: 'Phản hồi trong 24h',
  },
  {
    icon: MessageCircle,
    title: 'Zalo OA',
    value: 'LuatHoaChat.vn',
    subtext: 'Chat trực tuyến',
  },
  {
    icon: MapPin,
    title: 'Văn phòng',
    value: '65 N4 KDC Phú Mỹ Hiệp, Tân Đông Hiệp, HCM',
    subtext: 'Liên hệ để hẹn gặp',
  },
];

const inquiryTypes = [
  { value: 'tu_van_luat', label: 'Tư vấn pháp luật hóa chất' },
  { value: 'ho_tro_giay_phep', label: 'Hỗ trợ thủ tục giấy phép' },
  { value: 'dao_tao', label: 'Đăng ký đào tạo ATVSLĐ' },
  { value: 'msds', label: 'Yêu cầu bản MSDS' },
  { value: 'khac', label: 'Vấn đề khác' },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.phone || !formData.inquiryType) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('leads').insert({
        email: formData.email,
        phone_zalo: formData.phone,
        company_name: formData.company || null,
        intent_tag: formData.inquiryType === 'tu_van_luat' ? 'tu_van_luat' :
                    formData.inquiryType === 'ho_tro_giay_phep' ? 'tu_van_luat' :
                    formData.inquiryType === 'msds' ? 'mua_hoa_chat' : 'khac',
        source_page: 'contact',
        query_text: `[${formData.fullName}] ${formData.inquiryType}: ${formData.message}`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Gửi thông tin thành công!');

      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          fullName: '',
          company: '',
          email: '',
          phone: '',
          inquiryType: '',
          message: '',
        });
      }, 3000);

    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Quay lại Trang chủ
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Liên hệ Hỗ trợ
                  </h1>
                  <p className="text-slate-600">
                    Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn 24/7
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {contactInfo.map((info) => (
                <Card key={info.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cyan-100 flex items-center justify-center">
                      <info.icon className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{info.title}</p>
                    <p className="font-semibold text-slate-900">{info.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{info.subtext}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Gửi Yêu cầu Tư vấn</CardTitle>
                    <CardDescription>
                      Điền thông tin để nhận tư vấn từ chuyên gia trong vòng 24h
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSuccess ? (
                      <div className="py-12 text-center animate-fade-in">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          Gửi thành công!
                        </h3>
                        <p className="text-slate-600">
                          Chuyên gia sẽ liên hệ với bạn trong thời gian sớm nhất.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Tên doanh nghiệp</Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              placeholder="Công ty TNHH ABC"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">
                              Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="email@congty.vn"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">
                              Số điện thoại/Zalo <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="0912345678"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="inquiryType">
                            Loại yêu cầu <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.inquiryType}
                            onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại yêu cầu" />
                            </SelectTrigger>
                            <SelectContent>
                              {inquiryTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Nội dung chi tiết</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                            rows={4}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Gửi yêu cầu
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="border-0 shadow-md mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Giờ làm việc</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <div>
                        <p className="text-sm font-medium">Thứ 2 - Thứ 6</p>
                        <p className="text-sm text-slate-500">8:00 - 17:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">Thứ 7</p>
                        <p className="text-sm text-slate-500">8:00 - 12:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">Chủ nhật</p>
                        <p className="text-sm text-slate-500">Nghỉ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-cyan-50">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-cyan-600" />
                    <h3 className="font-semibold text-slate-900 mb-2">Chat với AI ngay</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Trợ lý AI sẵn sàng trả lời mọi thắc mắc về Luật Hóa chất 24/7
                    </p>
                    <Link href="/#chat">
                      <Button variant="outline" className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-100">
                        Mở Chat AI
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ChatProvider>
  );
}
