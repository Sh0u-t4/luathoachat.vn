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

const checklistItems: CheckItem[] = [
  {
    id: 'license',
    category: 'Giấy phép',
    question: 'Doanh nghiệp đã có Giấy phép kinh doanh hóa chất?',
    weight: 20,
  },
  {
    id: 'msds',
    category: 'Hồ sơ',
    question: 'Có đầy đủ bảng MSDS cho tất cả hóa chất?',
    weight: 15,
  },
  {
    id: 'training',
    category: 'Nhân sự',
    question: 'Nhân viên đã được đào tạo an toàn hóa chất?',
    weight: 15,
  },
  {
    id: 'storage',
    category: 'Kho bãi',
    question: 'Kho hóa chất có hệ thống thông gió?',
    weight: 10,
  },
  {
    id: 'fireproof',
    category: 'Kho bãi',
    question: 'Kho có tường chống cháy theo TCVN?',
    weight: 10,
  },
  {
    id: 'labeling',
    category: 'Nhãn mác',
    question: 'Tất cả thùng chứa có nhãn GHS đầy đủ?',
    weight: 10,
  },
  {
    id: 'emergency',
    category: 'An toàn',
    question: 'Có kế hoạch ứng phó sự cố tràn đổ?',
    weight: 10,
  },
  {
    id: 'ppe',
    category: 'An toàn',
    question: 'Nhân viên được trang bị đầy đủ PPE?',
    weight: 5,
  },
  {
    id: 'firstaid',
    category: 'An toàn',
    question: 'Có trạm sơ cứu và hóa chất trung hòa?',
    weight: 5,
  },
];

export default function ComplianceCheckPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isAuthenticated = !!user;

  const handleCheck = (id: string, checked: boolean) => {
    const newChecked = new Set(checkedItems);
    if (checked) {
      newChecked.add(id);
    } else {
      newChecked.delete(id);
    }
    setCheckedItems(newChecked);
    setShowResult(false);
  };

  const calculateScore = () => {
    let score = 0;
    checklistItems.forEach((item) => {
      if (checkedItems.has(item.id)) {
        score += item.weight;
      }
    });
    return score;
  };

  const handleEvaluate = () => {
    setShowResult(true);
  };

  const handleLoginRedirect = () => {
    router.push('/dang-nhap');
  };

  const handleRegisterRedirect = () => {
    router.push('/dang-ky');
  };

  const score = calculateScore();

  const getRiskLevel = () => {
    if (score >= 80) return { level: 'Thấp', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 50) return { level: 'Trung bình', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Cao', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const risk = getRiskLevel();

  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
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
                Quay lại Trang chủ
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <ClipboardCheck className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Kiểm tra Tuân thủ</h1>
                  <p className="text-slate-600">
                    Tự đánh giá mức độ tuân thủ quy định an toàn hóa chất
                  </p>
                </div>
              </div>
            </div>

            <Card className="mb-6 border-0 shadow-md">
              <CardHeader>
                <CardTitle>Danh sách kiểm tra</CardTitle>
                <CardDescription>
                  Tick vào các mục mà doanh nghiệp bạn đã thực hiện
                </CardDescription>
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
                              onCheckedChange={(checked) =>
                                handleCheck(item.id, checked as boolean)
                              }
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
                  onClick={handleEvaluate}
                  className="w-full mt-8 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Đánh giá mức độ Tuân thủ
                </Button>
              </CardContent>
            </Card>

            {showResult && (
              <Card className="border-0 shadow-md animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    Kết quả Đánh giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${risk.bg}`}
                    >
                      {score >= 80 ? (
                        <CheckCircle2 className={`w-5 h-5 ${risk.color}`} />
                      ) : score >= 50 ? (
                        <AlertTriangle className={`w-5 h-5 ${risk.color}`} />
                      ) : (
                        <XCircle className={`w-5 h-5 ${risk.color}`} />
                      )}
                      <span className={`font-semibold ${risk.color}`}>
                        Mức độ rủi ro: {risk.level}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Điểm tuân thủ</span>
                      <span className="font-semibold text-slate-900">{score}/100</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          score >= 80
                            ? 'bg-green-500'
                            : score >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className={`space-y-4 ${!isAuthenticated ? 'blur-content' : ''}`}>
                      <h4 className="font-semibold text-slate-900">
                        Phân tích chi tiết & Khuyến nghị:
                      </h4>

                      {!checkedItems.has('license') && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-sm text-red-700 font-medium">
                            Kinh doanh không Giấy phép:
                          </p>
                          <p className="text-sm text-red-600">
                            Mức phạt: 50-100 triệu VND (Điều 23, NĐ 71/2019)
                          </p>
                        </div>
                      )}

                      {!checkedItems.has('msds') && (
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-700 font-medium">Thiếu hồ sơ MSDS:</p>
                          <p className="text-sm text-yellow-600">
                            Mức phạt: 10-20 triệu VND. Không thể hoàn tất thủ tục XNK.
                          </p>
                        </div>
                      )}

                      {!checkedItems.has('training') && (
                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                          <p className="text-sm text-orange-700 font-medium">
                            Nhân viên chưa đào tạo:
                          </p>
                          <p className="text-sm text-orange-600">
                            Mức phạt: 20-30 triệu VND. Rủi ro tai nạn lao động cao.
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg">
                        <p className="text-sm text-cyan-700 font-medium">Bước tiếp theo:</p>
                        <ul className="text-sm text-cyan-600 list-disc list-inside mt-2 space-y-1">
                          <li>Liên hệ tư vấn viên để được hỗ trợ lập hồ sơ</li>
                          <li>Tải xuống mẫu văn bản pháp lý cần thiết</li>
                          <li>Đặt lịch kiểm tra thực tế tại cơ sở</li>
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
                          Đăng nhập để xem chi tiết
                        </Button>
                      </div>
                    )}
                  </div>
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
                Đăng nhập để xem báo cáo chi tiết
              </DialogTitle>
              <DialogDescription className="pt-4">
                Báo cáo chi tiết bao gồm phân tích mức phạt cụ thể, khuyến nghị cải thiện và hướng dẫn tuân thủ đầy đủ.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>

              <Button
                onClick={handleRegisterRedirect}
                variant="outline"
                className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                size="lg"
              >
                Tạo tài khoản miễn phí
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500 text-center">
                Tài khoản miễn phí bao gồm:
              </p>
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                  Báo cáo tuân thủ chi tiết không giới hạn
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                  Tư vấn AI pháp luật hóa chất
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-cyan-600 rounded-full"></span>
                  Tải xuống mẫu văn bản pháp lý
                </li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ChatProvider>
  );
}
