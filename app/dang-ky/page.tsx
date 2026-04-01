'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FlaskConical,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Briefcase,
  Shield,
  Sparkles,
  BookOpen,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { useGoogleConversion, CONVERSION_LABELS } from '@/components/google-conversion-tracker';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { trackConversion } = useGoogleConversion();

  // Get email and source from URL params
  const prefilledEmail = searchParams.get('email');
  const registrationSource = searchParams.get('source');
  const isFromChatbotGate = registrationSource === 'chatbot_gate';

  const [formData, setFormData] = useState({
    fullName: '',
    email: prefilledEmail || '',
    phone: '',
    companyName: '',
    position: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update email when prefilled email changes
  useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = t.auth.errorNameRequired;
    if (!formData.email.trim()) newErrors.email = t.auth.errorEmailRequired;
    if (!formData.phone.trim()) newErrors.phone = t.auth.errorPhoneRequired;
    if (!formData.password) newErrors.password = t.auth.errorPasswordRequired;
    else if (formData.password.length < 6) newErrors.password = t.auth.errorPasswordMin;
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t.auth.errorPasswordMatch;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
      });

      if (error) {
        toast.error(error);
      } else {
        // Track Google Ads conversion for successful registration
        trackConversion(CONVERSION_LABELS.SIGN_UP, 1.0, 'VND');

        toast.success(t.auth.registerSuccess, {
          description: t.auth.registerSuccessDesc,
        });
        router.push('/dang-nhap');
      }
    } catch {
      toast.error('Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    if (field === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const benefits = [
    { icon: Sparkles, text: t.auth.registerBenefit1 },
    { icon: BookOpen, text: t.auth.registerBenefit2 },
    { icon: Shield, text: t.auth.registerBenefit3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex">
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xl font-bold text-white">LuatHoaChat.vn</span>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
            {t.auth.registerPanelTitle}
          </h2>

          <p className="text-slate-400 text-base mb-10 leading-relaxed max-w-md">
            {t.auth.registerPanelSubtitle}
          </p>

          <div className="space-y-5">
            {benefits.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>


        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-lg font-bold text-slate-900">LuatHoaChat.vn</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {t.auth.registerTitle}
            </h1>
            <p className="text-slate-500">{t.auth.registerSubtitle}</p>
          </div>

          {isFromChatbotGate && prefilledEmail && (
            <Alert className="mb-6 border-cyan-200 bg-cyan-50">
              <Info className="w-4 h-4 text-cyan-600" />
              <AlertTitle className="text-cyan-900">
                {t.auth.registerChatbotTitle.replace('{email}', prefilledEmail)}
              </AlertTitle>
              <AlertDescription className="text-cyan-700">
                {t.auth.registerChatbotDesc}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                  {t.auth.fullName} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder={t.auth.fullNamePlaceholder}
                    className={`pl-10 h-11 ${errors.fullName ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  {t.auth.phone} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    className={`pl-10 h-11 ${errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t.auth.email} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  disabled={!!prefilledEmail}
                  className={`pl-10 h-11 ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''} ${prefilledEmail ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              {prefilledEmail && (
                <p className="text-xs text-slate-500">{t.auth.registerChatbotEmailNote}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                  {t.auth.companyName}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder={t.auth.companyNamePlaceholder}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-sm font-medium text-slate-700">
                  {t.auth.position}
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => updateField('position', e.target.value)}
                    placeholder={t.auth.positionPlaceholder}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t.auth.password} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className={`pl-10 pr-10 h-11 ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  {t.auth.confirmPassword} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white text-base font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30"
            >
              {isSubmitting ? t.auth.registering : t.auth.registerButton}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t.auth.hasAccount}{' '}
            <Link
              href="/dang-nhap"
              className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              {t.auth.loginButton}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
