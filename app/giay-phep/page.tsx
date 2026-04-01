'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  FileCheck,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatProvider } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';

export default function PermitGuidancePage() {
  const { t, language } = useLanguage();
  const tp = t.permit;

  const permitTypes = [
    {
      id: 'business',
      title: tp.permits.businessTitle,
      description: tp.permits.businessDesc,
      authority: 'Sở Công Thương tỉnh/TP',
      duration: '5 năm',
      fee: '1.000.000 VND',
      requirements: [
        tp.permits.businessR1,
        tp.permits.businessR2,
        tp.permits.businessR3,
        tp.permits.businessR4,
        tp.permits.businessR5,
      ],
      legalRef: 'Điều 17-21 Nghị định 24/2026/NĐ-CP',
    },
    {
      id: 'precursor',
      title: tp.permits.precursorTitle,
      description: tp.permits.precursorDesc,
      authority: 'Bộ Công Thương',
      duration: '3 năm',
      fee: '2.000.000 VND',
      requirements: [
        tp.permits.precursorR1,
        tp.permits.precursorR2,
        tp.permits.precursorR3,
        tp.permits.precursorR4,
        tp.permits.precursorR5,
      ],
      legalRef: 'Điều 11 Nghị định 24/2026, Điều 8-10 Nghị định 26/2026',
      warning: true,
    },
    {
      id: 'import',
      title: tp.permits.importTitle,
      description: tp.permits.importDesc,
      authority: 'Bộ Công Thương',
      duration: 'Theo lô hàng',
      fee: '500.000 VND/lần',
      requirements: [
        tp.permits.importR1,
        tp.permits.importR2,
        tp.permits.importR3,
        tp.permits.importR4,
        tp.permits.importR5,
      ],
      legalRef: 'Điều 6 Nghị định 26/2026/NĐ-CP',
    },
  ];

  const timeline = [
    { step: 1, title: tp.step1, duration: '3-5' },
    { step: 2, title: tp.step2, duration: '1' },
    { step: 3, title: tp.step3, duration: '15-20' },
    { step: 4, title: tp.step4, duration: '5-7' },
    { step: 5, title: tp.step5, duration: '3-5' },
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
                {tp.backHome}
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {tp.pageTitle}
                  </h1>
                  <p className="text-slate-600">{tp.pageSubtitle}</p>
                </div>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 mt-2">
                {tp.badge}
              </Badge>
            </div>

            {/* Important notice */}
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    {language === 'vi' ? 'Lưu ý quan trọng' : 'Important Notice'}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {language === 'vi'
                      ? 'Từ 01/01/2026, tất cả hồ sơ cấp phép phải nộp trực tuyến qua Cổng Dịch vụ công Quốc gia. Không tiếp nhận hồ sơ giấy theo cách truyền thống.'
                      : 'From 01/01/2026, all permit applications must be submitted online via the National Public Service Portal. Paper applications are no longer accepted.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-6">{tp.timelineTitle}</h2>
              <div className="overflow-x-auto pb-2 -mx-1">
                <div className="flex items-center min-w-max px-1 gap-1">
                  {timeline.map((item, index) => (
                    <div key={item.step} className="flex items-center">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm whitespace-nowrap">
                        <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.duration} {tp.timelineSuffix}</p>
                        </div>
                      </div>
                      {index < timeline.length - 1 && (
                        <ArrowRight className="w-4 h-4 mx-1 text-slate-300 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Permit cards */}
            <div className="grid gap-6">
              {permitTypes.map((permit) => (
                <Card key={permit.id} className={`border-0 shadow-md ${permit.warning ? 'ring-2 ring-amber-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{permit.title}</CardTitle>
                        <CardDescription className="mt-1">{permit.description}</CardDescription>
                      </div>
                      {permit.warning && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {tp.warningLabel}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{tp.authorityLabel}</span>
                        <span className="font-medium">{permit.authority}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{tp.durationLabel}</span>
                        <span className="font-medium">{permit.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{tp.feeLabel}</span>
                        <span className="font-medium">{permit.fee}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">{tp.requirementsLabel}</h4>
                      <ul className="space-y-2">
                        {permit.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-cyan-50 rounded-lg">
                      <p className="text-xs text-cyan-600">
                        <span className="font-semibold">{tp.legalRefLabel}</span> {permit.legalRef}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                <p className="font-semibold text-slate-900 mb-1">{tp.ctaTitle}</p>
                <p className="text-sm text-slate-600 mb-4">{tp.ctaSubtitle}</p>
                <Link href="/lien-he">
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">
                    {tp.ctaBtn}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="text-center p-6 bg-cyan-50 rounded-xl shadow-sm border border-cyan-100">
                <p className="font-semibold text-slate-900 mb-1">{tp.aiChatTitle}</p>
                <p className="text-sm text-slate-600 mb-4">{tp.aiChatDesc}</p>
                <Link href="/#chat">
                  <Button variant="outline" className="border-cyan-600 text-cyan-600 hover:bg-cyan-100 w-full">
                    {tp.aiChatBtn}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ChatProvider>
  );
}
