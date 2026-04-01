'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  FileText,
  LogIn,
} from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChatProvider } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CheckItem {
  id: string;
  category: string;
  question: string;
  weight: number;
}

export default function ComplianceCheckPage() {
  const { t, language } = useLanguage();
  const tc = t.compliance;
  const { user } = useAuth();
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isAuthenticated = !!user;

  // Build checklist from i18n keys so list switches language on toggle
  const checklistItems: CheckItem[] = [
    { id: 'license',   category: tc.items.licenseCategory,   question: tc.items.licenseQuestion,   weight: 20 },
    { id: 'msds',      category: tc.items.msdsCategory,      question: tc.items.msdsQuestion,      weight: 15 },
    { id: 'training',  category: tc.items.trainingCategory,  question: tc.items.trainingQuestion,  weight: 15 },
    { id: 'storage',   category: tc.items.storageCategory,   question: tc.items.storageQuestion,   weight: 10 },
    { id: 'fireproof', category: tc.items.fireproofCategory, question: tc.items.fireproofQuestion, weight: 10 },
    { id: 'labeling',  category: tc.items.labelingCategory,  question: tc.items.labelingQuestion,  weight: 10 },
    { id: 'emergency', category: tc.items.emergencyCategory, question: tc.items.emergencyQuestion, weight: 10 },
    { id: 'ppe',       category: tc.items.ppeCategory,       question: tc.items.ppeQuestion,       weight: 5  },
    { id: 'firstaid',  category: tc.items.firstaidCategory,  question: tc.items.firstaidQuestion,  weight: 5  },
  ];

  const handleCheck = (id: string, checked: boolean) => {
    const newChecked = new Set(checkedItems);
    if (checked) { newChecked.add(id); } else { newChecked.delete(id); }
    setCheckedItems(newChecked);
    setShowResult(false);
  };

  const calculateScore = () => {
    let score = 0;
    checklistItems.forEach((item) => {
      if (checkedItems.has(item.id)) score += item.weight;
    });
    return score;
  };

  const score = calculateScore();

  const getRiskLevel = () => {
    if (score >= 80) return { label: tc.levelExcellent, desc: tc.descExcellent, color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 50) return { label: tc.levelGood,      desc: tc.descGood,      color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 25) return { label: tc.levelAverage,   desc: tc.descAverage,   color: 'text-orange-600', bg: 'bg-orange-100' };
    return               { label: tc.levelPoor,         desc: tc.descPoor,      color: 'text-red-600',    bg: 'bg-red-100' };
  };

  const risk = getRiskLevel();

  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CheckItem[]>);

  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
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
                  <ClipboardCheck className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{tc.pageTitle}</h1>
                  <p className="text-slate-600">{tc.pageSubtitle}</p>
                </div>
              </div>
            </div>

            <Card className="mb-6 border-0 shadow-md">
              <CardHeader>
                <CardTitle>{tc.checklistTitle}</CardTitle>
                <CardDescription>{tc.checklistDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-3 min-h-[52px] bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={() => handleCheck(item.id, !checkedItems.has(item.id))}
                          >
                            <Checkbox
                              id={item.id}
                              checked={checkedItems.has(item.id)}
                              onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                              className="flex-shrink-0 w-5 h-5"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Label
                              htmlFor={item.id}
                              className="text-sm text-slate-700 cursor-pointer flex-1 leading-snug"
                            >
                              {item.question}
                            </Label>
                            <span className="text-xs text-slate-400 flex-shrink-0">{item.weight}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => setShowResult(true)}
                  className="w-full mt-8 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {tc.viewResult}
                </Button>
              </CardContent>
            </Card>

            {showResult && (
              <Card className="border-0 shadow-md animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    {tc.resultTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Score bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">{tc.scoreLabel}</span>
                      <span className="font-semibold text-slate-900">{score}/100</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : score >= 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk badge */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${risk.bg}`}>
                      {score >= 80 ? (
                        <CheckCircle2 className={`w-5 h-5 ${risk.color}`} />
                      ) : score >= 50 ? (
                        <AlertTriangle className={`w-5 h-5 ${risk.color}`} />
                      ) : (
                        <XCircle className={`w-5 h-5 ${risk.color}`} />
                      )}
                      <span className={`font-semibold ${risk.color}`}>{risk.label}</span>
                    </div>
                    <p className={`text-sm mt-2 ${risk.color}`}>{risk.desc}</p>
                  </div>

                  {/* Detailed analysis (gated) */}
                  <div className="relative">
                    <div className={`space-y-4 ${!isAuthenticated ? 'blur-content' : ''}`}>
                      <h4 className="font-semibold text-slate-900">
                        {language === 'vi' ? 'Phân tích chi tiết & Khuyến nghị:' : 'Detailed Analysis & Recommendations:'}
                      </h4>

                      {!checkedItems.has('license') && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            {language === 'vi' ? 'Kinh doanh không Giấy phép:' : 'Operating without a License:'}
                          </p>
                          <p className="text-sm text-red-600">
                            {language === 'vi'
                              ? 'Mức phạt: 50-100 triệu VND (Điều 23, NĐ 71/2019)'
                              : 'Fine: 50–100 million VND (Article 23, Decree 71/2019)'}
                          </p>
                        </div>
                      )}

                      {!checkedItems.has('msds') && (
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-700 font-medium">
                            {language === 'vi' ? 'Thiếu hồ sơ MSDS:' : 'Missing MSDS documentation:'}
                          </p>
                          <p className="text-sm text-yellow-600">
                            {language === 'vi'
                              ? 'Mức phạt: 10-20 triệu VND. Không thể hoàn tất thủ tục XNK.'
                              : 'Fine: 10–20 million VND. Import/export procedures cannot be completed.'}
                          </p>
                        </div>
                      )}

                      {!checkedItems.has('training') && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                          <p className="text-sm text-orange-700 font-medium">
                            {language === 'vi' ? 'Nhân viên chưa đào tạo:' : 'Untrained employees:'}
                          </p>
                          <p className="text-sm text-orange-600">
                            {language === 'vi'
                              ? 'Mức phạt: 20-30 triệu VND. Rủi ro tai nạn lao động cao.'
                              : 'Fine: 20–30 million VND. High risk of workplace accidents.'}
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg">
                        <p className="text-sm text-cyan-700 font-medium">
                          {language === 'vi' ? 'Bước tiếp theo:' : 'Next steps:'}
                        </p>
                        <ul className="text-sm text-cyan-600 list-disc list-inside mt-2 space-y-1">
                          <li>{language === 'vi' ? 'Liên hệ tư vấn viên để được hỗ trợ lập hồ sơ' : 'Contact a consultant for document preparation support'}</li>
                          <li>{language === 'vi' ? 'Tải xuống mẫu văn bản pháp lý cần thiết' : 'Download required legal document templates'}</li>
                          <li>{language === 'vi' ? 'Đặt lịch kiểm tra thực tế tại cơ sở' : 'Schedule an on-site inspection'}</li>
                        </ul>
                      </div>
                    </div>

                    {!isAuthenticated && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          onClick={() => setShowLoginPrompt(true)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          {tc.loginBtn}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isAuthenticated && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                        {tc.downloadReport}
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/lien-he')} className="flex-1">
                        {tc.contactExpert}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowResult(false); setCheckedItems(new Set()); }} className="flex-1">
                        {tc.startOver}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />

        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-600" />
                {tc.loginTitle}
              </DialogTitle>
              <DialogDescription className="pt-4">
                {tc.loginDesc}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => router.push('/dang-nhap')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {tc.loginBtn}
              </Button>

              <Button
                onClick={() => router.push('/dang-ky')}
                variant="outline"
                className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                size="lg"
              >
                {tc.registerBtn}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500 text-center">{tc.freeAccountIncludes}</p>
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                {[tc.benefit1, tc.benefit2, tc.benefit3].map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyan-600 rounded-full" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ChatProvider>
  );
}
