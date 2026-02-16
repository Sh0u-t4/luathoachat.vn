'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { useGoogleConversion, CONVERSION_LABELS } from '@/components/google-conversion-tracker';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const { trackConversion } = useGoogleConversion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = t.auth.errorEmailRequired;
    if (!password) newErrors.password = t.auth.errorPasswordRequired;
    else if (password.length < 6) newErrors.password = t.auth.errorPasswordMin;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        // Track Google Ads conversion for successful login
        trackConversion(CONVERSION_LABELS.LOGIN, 1.0, 'VND');

        toast.success(t.auth.welcomeBack);
        router.push('/');
      }
    } catch {
      toast.error('Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Trợ lý AI
            <br />
            <span className="text-cyan-400">tư vấn pháp luật</span>
            <br />
            hóa chất & môi trường
          </h2>

          <p className="text-slate-400 text-base mb-10 leading-relaxed max-w-md">
            Đăng nhập để tiếp tục sử dụng các tính năng tra cứu, AI tư vấn và hỗ trợ tuân thủ quy
            định pháp luật hóa chất Việt Nam.
          </p>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  &quot;Hệ thống giúp chúng tôi giảm 80% thời gian tra cứu văn bản pháp luật và đảm bảo
                  tuân thủ đúng quy định.&quot;
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  -- Trưởng phòng ATMT, Công ty Hóa chất Miền Nam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
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
              {t.auth.loginTitle}
            </h1>
            <p className="text-slate-500">{t.auth.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t.auth.email}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder={t.auth.emailPlaceholder}
                  className={`pl-10 h-12 text-base ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  {t.auth.password}
                </Label>
                <Link
                  href="/quen-mat-khau"
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder={t.auth.passwordPlaceholder}
                  className={`pl-10 pr-10 h-12 text-base ${errors.password ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
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

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white text-base font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 group"
            >
              {isSubmitting ? (
                t.auth.loggingIn
              ) : (
                <span className="flex items-center gap-2">
                  {t.auth.loginButton}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-slate-400">{t.auth.orContinueWith}</span>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t.auth.noAccount}{' '}
            <Link
              href="/dang-ky"
              className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
            >
              {t.auth.registerButton}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
