'use client';

import Link from 'next/link';
import { FlaskConical, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export function Footer() {
  const { t } = useLanguage();

  const serviceLinks = [
    { label: t.nav.compliance, href: '/kiem-tra' },
    { label: t.nav.guidance, href: '/giay-phep' },
    { label: t.nav.declaration, href: '/khai-bao' },
  ];

  const supportLinks = [
    { label: t.footer.terms, href: '/dieu-khoan' },
    { label: t.footer.privacy, href: '/chinh-sach-bao-mat' },
    { label: t.footer.disclaimer, href: '/mien-tru' },
    { label: t.nav.contact, href: '/lien-he' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl font-bold text-white">LuatHoaChat.vn</span>
            </Link>
            <p className="text-sm text-slate-400 mb-6">
              {t.footer.description}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>info@luathoachat.vn</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>65 N4 KDC Phú Mỹ Hiệp, Tân Đông Hiệp, HCM</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t.footer.legal}</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              {t.footer.copyright}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/dieu-khoan" className="hover:text-cyan-400 transition-colors">
                {t.footer.terms}
              </Link>
              <Link href="/chinh-sach-bao-mat" className="hover:text-cyan-400 transition-colors">
                {t.footer.privacy}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
