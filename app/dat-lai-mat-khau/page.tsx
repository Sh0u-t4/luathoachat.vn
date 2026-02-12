'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setIsChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidSession(true);
        setIsChecking(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = t.auth.errorPasswordRequired;
    else if (password.length < 6) newErrors.password = t.auth.errorPasswordMin;
    if (password !== confirmPassword) newErrors.confirmPassword = t.auth.errorPasswordMatch;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error);
      } else {
        setIsSuccess(true);
        toast.success(t.auth.passwordResetSuccess);
      }
    } catch {
      toast.error('Đã xảy ra lỗi không mong muốn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!isValidSession && !isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Liên kết không hợp lệ
          </h1>
          <p className="text-slate-500 mb-8">
            Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi lại liên kết mới.
          </p>
          <Link href="/quen-mat-khau">
            <Button className="h-12 px-6 bg-cyan-600 hover:bg-cyan-700 text-base font-medium gap-2">
              <ArrowLeft className="w-4 h-4" />
              Yêu cầu liên kết mới
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            Đặt lại mật khẩu để tiếp tục sử dụng các tính năng tra cứu, AI tư vấn và hỗ trợ tuân thủ quy
            định pháp luật hóa chất Việt Nam.
          </p>
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

          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                {t.auth.passwordResetSuccess}
              </h1>
              <p className="text-slate-500 mb-8">{t.auth.passwordResetSuccessDesc}</p>
              <Button
                onClick={() => router.push('/dang-nhap')}
                className="h-12 px-6 bg-cyan-600 hover:bg-cyan-700 text-base font-medium gap-2"
              >
                {t.auth.loginButton}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {t.auth.resetPasswordTitle}
                </h1>
                <p className="text-slate-500">{t.auth.resetPasswordSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    {t.auth.newPassword}
                  </Label>
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
                      placeholder={t.auth.newPasswordPlaceholder}
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
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                    {t.auth.confirmNewPassword}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder={t.auth.confirmNewPasswordPlaceholder}
                      className={`pl-10 pr-10 h-12 text-base ${errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white text-base font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30 group"
                >
                  {isSubmitting ? (
                    t.auth.resettingPassword
                  ) : (
                    <span className="flex items-center gap-2">
                      {t.auth.resetPasswordButton}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/dang-nhap"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-cyan-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.auth.backToLogin}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
