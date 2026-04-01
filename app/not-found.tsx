'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Home, Search, ArrowRight, FlaskConical, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const quickLinks = [
    { href: '/kiem-tra', icon: CheckCircle, label: 'Kiểm tra Tuân thủ', color: 'text-cyan-600 bg-cyan-50' },
    { href: '/giay-phep', icon: FileText, label: 'Hướng dẫn Giấy phép', color: 'text-violet-600 bg-violet-50' },
    { href: '/khai-bao', icon: FlaskConical, label: 'Khai báo Hóa chất', color: 'text-emerald-600 bg-emerald-50' },
    { href: '/lien-he', icon: ArrowRight, label: 'Liên hệ Hỗ trợ', color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
          <div className="w-12 h-12 relative">
            <Image
              src="/logo_luathoachat.jpg"
              alt="LuatHoaChat.vn Logo"
              width={48}
              height={48}
              className="object-contain rounded-xl"
            />
          </div>
          <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            LuatHoaChat.vn
          </span>
        </Link>

        {/* 404 */}
        <div className="mb-6">
          <p className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 leading-none select-none">
            404
          </p>
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Trang không tồn tại
        </h1>
        <p className="text-slate-400 mb-8 text-base md:text-lg">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa.
          <br />
          Hãy thử tìm kiếm hoặc quay về trang chủ.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-8">
          <div className="relative rounded-full bg-white/10 border border-white/20 backdrop-blur focus-within:border-cyan-500/60 transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm về Luật Hóa chất..."
              className="w-full py-3.5 pl-12 pr-28 text-white placeholder:text-slate-500 bg-transparent rounded-full focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-full transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </form>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${link.color}`}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Back home */}
        <Link href="/">
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2 px-6">
            <Home className="w-4 h-4" />
            Về Trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
