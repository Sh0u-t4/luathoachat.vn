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
import { useLanguage } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Vietnamese phone number regex: 0[3|5|7|8|9][0-9]{8} or +84[3|5|7|8|9][0-9]{8}
const PHONE_REGEX = /^(\+84|0)(3[2-9]|5[2689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;

export default function ContactPage() {
  const { t } = useLanguage();
  const tc = t.contact;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: '',
  });

  const validatePhone = (phone: string) => {
    if (!phone) return tc.errorRequired;
    if (!PHONE_REGEX.test(phone.replace(/[\s\-\.]/g, ''))) return tc.errorPhoneFormat;
    return '';
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    if (phoneError) setPhoneError(validatePhone(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneErr = validatePhone(formData.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    if (!formData.email || !formData.phone || !formData.inquiryType) {
      toast.error(tc.errorRequired);
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
      toast.success(tc.toastSuccess);

      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ fullName: '', company: '', email: '', phone: '', inquiryType: '', message: '' });
      }, 3000);

    } catch (err) {
      console.error('Contact form error:', err);
      toast.error(tc.errorSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: tc.emailTitle,
      value: 'info@luathoachat.vn',
      href: 'mailto:info@luathoachat.vn',
      subtext: tc.emailSubtext,
    },
    {
      icon: MessageCircle,
      title: tc.zaloTitle,
      value: 'LuatHoaChat.vn',
      href: 'https://zalo.me/luathoachat',
      subtext: tc.zaloSubtext,
    },
    {
      icon: MapPin,
      title: tc.officeTitle,
      value: '65 N4 KDC Phú Mỹ Hiệp, Tân Đông Hiệp, HCM',
      href: 'https://maps.google.com/?q=65+N4+KDC+Phu+My+Hiep+Tan+Dong+Hiep+HCM',
      subtext: tc.officeSubtext,
    },
  ];

  const inquiryTypes = [
    { value: 'tu_van_luat', label: tc.inquiryTypes.legal },
    { value: 'ho_tro_giay_phep', label: tc.inquiryTypes.permit },
    { value: 'dao_tao', label: tc.inquiryTypes.training },
    { value: 'msds', label: tc.inquiryTypes.msds },
    { value: 'khac', label: tc.inquiryTypes.other },
  ];

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
                {tc.backHome}
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {tc.pageTitle}
                  </h1>
                  <p className="text-slate-600">{tc.pageSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {contactInfo.map((info) => (
                <a
                  key={info.title}
                  href={info.href}
                  target={info.href.startsWith('http') ? '_blank' : undefined}
                  rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block group"
                >
                  <Card className="shadow-sm hover:shadow-md transition-shadow group-hover:border-cyan-200 border border-slate-100">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-cyan-100 group-hover:bg-cyan-200 transition-colors flex items-center justify-center">
                        <info.icon className="w-5 h-5 text-cyan-600" />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{info.title}</p>
                      <p className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">{info.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{info.subtext}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>{tc.formTitle}</CardTitle>
                    <CardDescription>{tc.formSubtitle}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSuccess ? (
                      <div className="py-12 text-center animate-fade-in">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          {tc.successTitle}
                        </h3>
                        <p className="text-slate-600">{tc.successMessage}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">{tc.fullName}</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">{tc.company}</Label>
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
                              {tc.email} <span className="text-red-500">*</span>
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
                              {tc.phone} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              onBlur={() => setPhoneError(validatePhone(formData.phone))}
                              placeholder="0912345678"
                              className={phoneError ? 'border-red-400 focus-visible:ring-red-400' : ''}
                              required
                            />
                            {phoneError && (
                              <p className="text-xs text-red-500">{phoneError}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="inquiryType">
                            {tc.inquiryType} <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.inquiryType}
                            onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={tc.inquiryPlaceholder} />
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
                          <Label htmlFor="message">{tc.message}</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder={tc.messagePlaceholder}
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
                              {tc.submitting}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {tc.submit}
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
                    <CardTitle className="text-lg">{tc.workingHoursTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <div>
                        <p className="text-sm font-medium">{tc.weekdays}</p>
                        <p className="text-sm text-slate-500">8:00 - 17:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{tc.saturday}</p>
                        <p className="text-sm text-slate-500">8:00 - 12:00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium">{tc.sunday}</p>
                        <p className="text-sm text-slate-500">{tc.sundayClosed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-cyan-50">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-cyan-600" />
                    <h3 className="font-semibold text-slate-900 mb-2">{tc.aiChatTitle}</h3>
                    <p className="text-sm text-slate-600 mb-4">{tc.aiChatDesc}</p>
                    <Link href="/#chat">
                      <Button variant="outline" className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-100">
                        {tc.openChat}
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
