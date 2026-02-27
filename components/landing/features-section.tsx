'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ListChecks,
  FlaskConical,
  Ruler,
  FileInput,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/context';

export function FeaturesSection() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = language === 'vi' ? [
    // {
    //   icon: ListChecks,
    //   title: 'Tra cứu Danh mục 2026',
    //   description:
    //     'Xác định hóa chất thuộc Phụ lục I, II, III, IV theo Nghị định 24/2026/NĐ-CP. Tra cứu điều kiện kinh doanh và yêu cầu giấy phép.',
    //   href: '/msds',
    //   highlights: ['Phụ lục I - Hóa chất nguy hiểm', 'Phụ lục II - Hóa chất hạn chế', 'Phụ lục III - Tiền chất công nghiệp'],
    // },
    {
      icon: Ruler,
      title: 'Tính Khoảng cách an toàn',
      description:
        'Tự động tính khoảng cách an toàn kho hóa chất theo quy định tại Nghị định 25/2026/NĐ-CP về an toàn trong hoạt động hóa chất.',
      href: '/kiem-tra',
      highlights: ['Công thức tính theo NĐ 25/2026', 'Khoảng cách tối thiểu', 'Yêu cầu PCCC'],
    },
    {
      icon: FileInput,
      title: 'Khai báo Nhập khẩu AI',
      description:
        'Hỗ trợ lập hồ sơ khai báo nhập khẩu hóa chất theo Nghị định 26/2026/NĐ-CP. AI tự động điền form và kiểm tra hồ sơ.',
      href: '/khai-bao',
      highlights: ['Mẫu đơn theo NĐ 26/2026', 'AI kiểm tra hồ sơ', 'Hướng dẫn từng bước'],
    },
    // {
    //   icon: FlaskConical,
    //   title: 'Thư viện MSDS',
    //   description:
    //     'Truy cập 1000+ bảng dữ liệu an toàn hóa chất (MSDS) bằng tiếng Việt, cập nhật theo tiêu chuẩn GHS và Luật Hóa chất 69/2025.',
    //   href: '/msds',
    //   highlights: ['1000+ hóa chất', 'MSDS tiếng Việt chuẩn', 'Tải PDF miễn phí'],
    // },
  ] : [
    // {
    //   icon: ListChecks,
    //   title: 'Catalog Lookup 2026',
    //   description:
    //     'Identify chemicals in Appendix I, II, III, IV per Decree 24/2026/ND-CP. Search business conditions and permit requirements.',
    //   href: '/msds',
    //   highlights: ['Appendix I - Hazardous chemicals', 'Appendix II - Restricted chemicals', 'Appendix III - Industrial precursors'],
    // },
    {
      icon: Ruler,
      title: 'Safety Distance Calculator',
      description:
        'Auto-calculate chemical warehouse safety distance per Decree 25/2026/ND-CP on safety in chemical activities.',
      href: '/kiem-tra',
      highlights: ['Formula per Decree 25/2026', 'Minimum distance', 'Fire safety requirements'],
    },
    {
      icon: FileInput,
      title: 'AI Import Declaration',
      description:
        'AI-assisted chemical import declaration per Decree 26/2026/ND-CP. Auto-fill forms and document verification.',
      href: '/khai-bao',
      highlights: ['Forms per Decree 26/2026', 'AI document check', 'Step-by-step guide'],
    },
    // {
    //   icon: FlaskConical,
    //   title: 'MSDS Library',
    //   description:
    //     'Access 1000+ Material Safety Data Sheets in Vietnamese, updated per GHS standards and Chemical Law 69/2025.',
    //   href: '/msds',
    //   highlights: ['1000+ chemicals', 'Standard Vietnamese MSDS', 'Free PDF download'],
    // },
  ];

  const sectionTitle = language === 'vi'
    ? { badge: 'Công cụ hỗ trợ toàn diện', title: 'Tất cả những gì bạn cần', subtitle: 'Bộ công cụ đầy đủ giúp doanh nghiệp tuân thủ Luật Hóa chất 69/2025 và các Nghị định hướng dẫn.', cta: 'Truy cập ngay' }
    : { badge: 'Comprehensive tools', title: 'Everything you need', subtitle: 'Complete toolkit to help businesses comply with Chemical Law 69/2025 and implementing decrees.', cta: 'Access now' };

  if (!mounted) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm bg-cyan-100 text-cyan-700 rounded-full">
            <Zap className="w-4 h-4" />
            <span>{sectionTitle.badge}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {sectionTitle.title}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {sectionTitle.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                    <feature.icon className="w-6 h-6 text-cyan-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <CardTitle className="text-xl text-slate-900 mt-4">{feature.title}</CardTitle>
                <CardDescription className="text-slate-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <Link href={feature.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                  >
                    {sectionTitle.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
