'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FlaskConical, Menu, Globe, User, LogOut, ChevronDown, ShieldCheck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import type { Language } from '@/lib/i18n/types';
import { toast } from 'sonner';
import { ProfileEditDialog } from '@/components/profile/profile-edit-dialog';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  // Debug logging
  if (user) {
    console.log('🔍 Header Debug:', {
      email: user.email,
      profileLoaded: !!profile,
      role: profile?.role,
      isAdmin,
      accountStatus: profile?.account_status
    });
  }

  const toggleLanguage = () => {
    const newLang: Language = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'vi' ? 'Đã đăng xuất' : 'Signed out');
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: t.nav.home },
    // { href: '/msds', label: t.nav.msds }, // Ẩn tính năng MSDS - chưa phát triển
    { href: '/kiem-tra', label: t.nav.compliance },
    { href: '/giay-phep', label: t.nav.guidance },
    { href: '/lien-he', label: t.nav.contact },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src="/logo_luathoachat.jpg"
                alt="LuatHoaChat.vn Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-slate-900">LuatHoaChat.vn</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-cyan-600 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-slate-600 hover:text-cyan-600 gap-2"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">{language.toUpperCase()}</span>
            </Button>

            {loading ? (
              <div className="w-20 h-9 bg-slate-100 rounded-md animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-slate-700 hover:text-cyan-600 max-w-[180px]"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-cyan-700" />
                    </div>
                    <span className="truncate text-sm font-medium">{displayName}</span>
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setProfileDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    {t.auth.profileDetails}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => router.push('/quan-tri')}
                        className="cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        {t.admin.title}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.auth.logoutButton}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600"
                  onClick={() => router.push('/dang-nhap')}
                >
                  {t.nav.login}
                </Button>
                <Button
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => router.push('/dang-ky')}
                >
                  {t.nav.register}
                </Button>
              </>
            )}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-6 mt-6">
                <Button
                  variant="outline"
                  onClick={toggleLanguage}
                  className="w-full gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
                </Button>

                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-slate-600 hover:text-cyan-600 transition-colors font-medium py-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="flex flex-col gap-3 pt-4 border-t">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-1 py-2">
                        <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-cyan-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setIsOpen(false);
                          setProfileDialogOpen(true);
                        }}
                      >
                        <UserCog className="w-4 h-4" />
                        {t.auth.profileDetails}
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => {
                            setIsOpen(false);
                            router.push('/quan-tri');
                          }}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {t.admin.title}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setIsOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t.auth.logoutButton}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dang-nhap');
                        }}
                      >
                        {t.nav.login}
                      </Button>
                      <Button
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/dang-ky');
                        }}
                      >
                        {t.nav.register}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <ProfileEditDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </header>
  );
}
