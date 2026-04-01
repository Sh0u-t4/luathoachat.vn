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

const permitTypes = [
  {
    id: 'business',
    title: 'Giấy phép Kinh doanh Hóa chất',
    description: 'Áp dụng cho: Mua bán, phân phối hóa chất công nghiệp',
    authority: 'Sở Công Thương tỉnh/TP',
    duration: '5 năm',
    fee: '1.000.000 VND',
    requirements: [
      'Giấy CNĐK kinh doanh',
      'Giấy chứng nhận PCCC',
      'Kế hoạch ứng phó sự cố (nếu vượt ngưỡng)',
      'Sơ đồ kho, nhà xưởng',
      'Danh sách NLĐ có chứng chỉ ATVSLĐ',
    ],
    legalRef: 'Điều 17-21 Nghị định 24/2026/NĐ-CP',
  },
  {
    id: 'precursor',
    title: 'Giấy phép Tiền chất Công nghiệp',
    description: 'Áp dụng cho: Methanol, Acetone, Toluene... (Phụ lục III)',
    authority: 'Bộ Công Thương',
    duration: '3 năm',
    fee: '2.000.000 VND',
    requirements: [
      'Tất cả yêu cầu của Giấy phép kinh doanh',
      'Cam kết báo cáo sử dụng HÀNG TUẦN',
      'Hệ thống camera giám sát 24/7',
      'Kiểm kê tồn kho hàng ngày',
      'Báo cáo trực tuyến qua Cổng DVC',
    ],
    legalRef: 'Điều 11 Nghị định 24/2026, Điều 8-10 Nghị định 26/2026',
    warning: true,
  },
  {
    id: 'import',
    title: 'Giấy phép Nhập khẩu Hóa chất',
    description: 'Áp dụng cho: Nhập khẩu hóa chất Phụ lục III, IV',
    authority: 'Bộ Công Thương',
    duration: 'Theo lô hàng',
    fee: '500.000 VND/lần',
    requirements: [
      'Giấy phép kinh doanh hóa chất',
      'Hợp đồng mua bán',
      'MSDS của hóa chất',
      'Kế hoạch sử dụng chi tiết',
      'Cam kết mục đích sử dụng',
    ],
    legalRef: 'Điều 6 Nghị định 26/2026/NĐ-CP',
  },
];

const timeline = [
  { step: 1, title: 'Chuẩn bị hồ sơ', duration: '3-5 ngày' },
  { step: 2, title: 'Nộp hồ sơ trực tuyến', duration: '1 ngày' },
  { step: 3, title: 'Cơ quan thẩm định', duration: '15-20 ngày' },
  { step: 4, title: 'Kiểm tra thực tế (nếu cần)', duration: '5-7 ngày' },
  { step: 5, title: 'Cấp giấy phép', duration: '3-5 ngày' },
];

export default function PermitGuidancePage() {
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
                Quay lại Trang chủ
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                    Hướng dẫn Cấp Giấy phép
                  </h1>
                  <p className="text-slate-600">
                    Theo Luật Hóa chất 69/2025 và Nghị định 24, 26/2026
                  </p>
                </div>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 mt-2">
                Cập nhật 01/2026
              </Badge>
            </div>

            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Lưu ý quan trọng</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Từ 01/01/2026, tất cả hồ sơ cấp phép phải nộp trực tuyến qua Cổng Dịch vụ công Quốc gia.
                    Không tiếp nhận hồ sơ giấy theo cách truyền thống.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Quy trình cấp phép</h2>
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
                          <p className="text-xs text-slate-500">{item.duration}</p>
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
                          Quản lý Đặc biệt
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Cơ quan:</span>
                        <span className="font-medium">{permit.authority}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Hiệu lực:</span>
                        <span className="font-medium">{permit.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Lệ phí:</span>
                        <span className="font-medium">{permit.fee}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Hồ sơ cần thiết:</h4>
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
                        <span className="font-semibold">Căn cứ:</span> {permit.legalRef}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-slate-600 mb-4">Cần hỗ trợ thủ tục cấp phép?</p>
              <Link href="/khai-bao">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Dùng AI Trợ lý Khai báo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ChatProvider>
  );
}
