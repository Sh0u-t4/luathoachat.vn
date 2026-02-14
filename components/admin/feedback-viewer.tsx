'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ThumbsUp, ThumbsDown, MessageSquare, Search, Filter, RefreshCw, User, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface Feedback {
  id: string;
  message_id: string;
  session_id: string;
  user_id: string | null;
  rating: 'positive' | 'negative';
  comment: string | null;
  created_at: string;
  user_email?: string;
  user_full_name?: string;
}

export function FeedbackViewer() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
  });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      // Get all feedbacks
      const { data: feedbackData, error } = await supabase
        .from('message_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for feedbacks that have user_id
      const userIds = feedbackData
        ?.filter((f) => f.user_id)
        .map((f) => f.user_id as string) || [];

      let userProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        userProfiles = profileData || [];
      }

      // Merge feedback with user data
      const enrichedFeedbacks = feedbackData?.map((feedback) => {
        const userProfile = userProfiles.find((u) => u.id === feedback.user_id);
        return {
          ...feedback,
          user_email: userProfile?.email,
          user_full_name: userProfile?.full_name,
        };
      }) || [];

      setFeedbacks(enrichedFeedbacks);

      // Calculate stats
      const total = enrichedFeedbacks.length;
      const positive = enrichedFeedbacks.filter((f) => f.rating === 'positive').length;
      const negative = enrichedFeedbacks.filter((f) => f.rating === 'negative').length;

      setStats({ total, positive, negative });
    } catch (error: any) {
      console.error('[FeedbackViewer] Error:', error);
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    // Rating filter
    if (ratingFilter !== 'all' && feedback.rating !== ratingFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        feedback.comment?.toLowerCase().includes(query) ||
        feedback.message_id.toLowerCase().includes(query) ||
        feedback.session_id.toLowerCase().includes(query) ||
        feedback.user_email?.toLowerCase().includes(query) ||
        feedback.user_full_name?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleExportExcel = () => {
    try {
      // Chuẩn bị data cho Excel
      const excelData = filteredFeedbacks.map((feedback, index) => ({
        'STT': index + 1,
        'Đánh giá': feedback.rating === 'positive' ? 'Tích cực' : 'Tiêu cực',
        'Tên người gửi': feedback.user_full_name || 'Ẩn danh',
        'Email': feedback.user_email || 'N/A',
        'Nội dung góp ý': feedback.comment || 'Không có nội dung',
        'Session ID': feedback.session_id,
        'Message ID': feedback.message_id,
        'Thời gian': new Date(feedback.created_at).toLocaleString('vi-VN'),
      }));

      // Tạo worksheet và workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Phản hồi');

      // Tự động điều chỉnh độ rộng cột
      const maxWidth = 50;
      const colWidths = [
        { wch: 5 },  // STT
        { wch: 12 }, // Đánh giá
        { wch: 25 }, // Tên
        { wch: 30 }, // Email
        { wch: maxWidth }, // Nội dung
        { wch: 40 }, // Session ID
        { wch: 40 }, // Message ID
        { wch: 20 }, // Thời gian
      ];
      worksheet['!cols'] = colWidths;

      // Tạo tên file với timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Danh_sach_phan_hoi_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      toast.success(`Đã xuất ${filteredFeedbacks.length} phản hồi ra file Excel`);
    } catch (error) {
      console.error('[ExportExcel] Error:', error);
      toast.error('Không thể xuất file Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Tổng phản hồi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Phản hồi tích cực
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{stats.positive}</span>
              {stats.total > 0 && (
                <span className="text-sm text-slate-500 ml-auto">
                  ({Math.round((stats.positive / stats.total) * 100)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">
              Phản hồi tiêu cực
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              <span className="text-3xl font-bold text-red-600">{stats.negative}</span>
              {stats.total > 0 && (
                <span className="text-sm text-slate-500 ml-auto">
                  ({Math.round((stats.negative / stats.total) * 100)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-600" />
                Danh sách phản hồi
              </CardTitle>
              <CardDescription>
                Xem và quản lý tất cả phản hồi từ người dùng về chatbot
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={filteredFeedbacks.length === 0}
                className="shrink-0"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Tải Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFeedbacks}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm theo nội dung, email, session..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={(value: any) => setRatingFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Lọc theo đánh giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="positive">Tích cực</SelectItem>
                <SelectItem value="negative">Tiêu cực</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchQuery || ratingFilter !== 'all'
                  ? 'Không tìm thấy phản hồi phù hợp'
                  : 'Chưa có phản hồi nào'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Đánh giá</TableHead>
                      <TableHead>Người gửi</TableHead>
                      <TableHead className="min-w-[300px]">Nội dung góp ý</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead className="w-40">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell>
                          {feedback.rating === 'positive' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Tích cực
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Tiêu cực
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {feedback.user_id ? (
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {feedback.user_full_name || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {feedback.user_email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Người dùng ẩn danh
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {feedback.comment ? (
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {feedback.comment}
                            </p>
                          ) : (
                            <span className="text-sm text-slate-400 italic">
                              Không có nội dung
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {feedback.session_id.slice(0, 12)}...
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Result count */}
          {filteredFeedbacks.length > 0 && (
            <p className="text-sm text-slate-500 mt-4">
              Hiển thị {filteredFeedbacks.length} / {feedbacks.length} phản hồi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
