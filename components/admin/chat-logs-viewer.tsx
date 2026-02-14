'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Calendar, Filter, Download, ThumbsUp, ThumbsDown, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToExcel } from '@/lib/excel-export';
import { supabase } from '@/lib/supabase';

interface ChatLog {
  id: string;
  user_id: string | null;
  user_email?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  detailed_content?: string;
  detected_chemicals?: string[];
  response_time_ms?: number;
  is_error: boolean;
  created_at: string;
}

interface MessageRating {
  message_id: string;
  likes: number;
  dislikes: number;
  total_ratings: number;
  like_percentage: number;
}

export function ChatLogsViewer() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'assistant' | 'errors'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [users, setUsers] = useState<Array<{ id: string; email: string }>>([]);
  const [ratings, setRatings] = useState<Map<string, MessageRating>>(new Map());

  useEffect(() => {
    loadUsers();
    loadChatLogs();
  }, [filter, selectedUser]);

  const loadUsers = async () => {
    try {
      // Get all user profiles
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, email')
        .order('email');

      if (error) {
        console.error('Failed to load users:', error);
        return;
      }

      setUsers(profiles || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadChatLogs = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      // Apply filters
      if (filter === 'user') {
        query = query.eq('role', 'user');
      } else if (filter === 'assistant') {
        query = query.eq('role', 'assistant');
      } else if (filter === 'errors') {
        query = query.eq('is_error', true);
      }

      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Failed to load chat logs:', error);
        setLogs([]);
        return;
      }

      if (!messages || messages.length === 0) {
        setLogs([]);
        return;
      }

      // Get unique user IDs
      const userIds = Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)));

      // Load user profiles for those IDs
      let userEmailMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email')
          .in('id', userIds);

        if (profiles) {
          profiles.forEach(profile => {
            userEmailMap.set(profile.id, profile.email);
          });
        }
      }

      // Combine messages with user emails
      const logsWithEmail = messages.map(log => ({
        ...log,
        user_email: log.user_id ? userEmailMap.get(log.user_id) || null : null,
      }));

      setLogs(logsWithEmail);

      // Load ratings for assistant messages
      const assistantMessageIds = logsWithEmail
        .filter((log) => log.role === 'assistant')
        .map((log) => log.id);

      if (assistantMessageIds.length > 0) {
        await loadRatings(assistantMessageIds);
      }
    } catch (error) {
      console.error('Failed to load chat logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      // Load all ratings for these messages
      const { data: allRatings, error } = await supabase
        .from('message_ratings')
        .select('message_id, rating_type')
        .in('message_id', messageIds);

      if (error) {
        console.error('Failed to load ratings:', error);
        return;
      }

      // Group by message_id and calculate stats
      const ratingsMap = new Map<string, MessageRating>();

      messageIds.forEach(messageId => {
        const messageRatings = (allRatings || []).filter(r => r.message_id === messageId);
        const likes = messageRatings.filter(r => r.rating_type === 'like').length;
        const dislikes = messageRatings.filter(r => r.rating_type === 'dislike').length;
        const total = likes + dislikes;
        const likePercentage = total > 0 ? Math.round((likes / total) * 100) : 0;

        if (total > 0) {
          ratingsMap.set(messageId, {
            message_id: messageId,
            likes,
            dislikes,
            total_ratings: total,
            like_percentage: likePercentage,
          });
        }
      });

      setRatings(ratingsMap);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const exportChatLogsToExcel = () => {
    // Prepare data for export
    const exportData = logs.map((log) => {
      const rating = ratings.get(log.id);
      return {
        'Thời gian': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        'User Email': log.user_email || (log.user_id ? 'User đã xóa' : 'Khách (Chưa đăng nhập)'),
        'User ID': log.user_id || 'Anonymous',
        'Loại': log.role === 'user' ? 'Người dùng' : 'AI Trợ lý',
        'Nội dung': log.content,
        'Session ID': log.session_id,
        'Hóa chất phát hiện': log.detected_chemicals?.join(', ') || '',
        'Thời gian phản hồi (ms)': log.response_time_ms || '',
        'Có lỗi': log.is_error ? 'Có' : 'Không',
        'Likes': rating ? rating.likes : '',
        'Dislikes': rating ? rating.dislikes : '',
        'Tỉ lệ tích cực (%)': rating ? rating.like_percentage : '',
      };
    });

    const columns = [
      { header: 'Thời gian', key: 'Thời gian', width: 18 },
      { header: 'User Email', key: 'User Email', width: 25 },
      { header: 'User ID', key: 'User ID', width: 25 },
      { header: 'Loại', key: 'Loại', width: 12 },
      { header: 'Nội dung', key: 'Nội dung', width: 50 },
      { header: 'Session ID', key: 'Session ID', width: 25 },
      { header: 'Hóa chất phát hiện', key: 'Hóa chất phát hiện', width: 30 },
      { header: 'Thời gian phản hồi (ms)', key: 'Thời gian phản hồi (ms)', width: 15 },
      { header: 'Có lỗi', key: 'Có lỗi', width: 10 },
      { header: 'Likes', key: 'Likes', width: 10 },
      { header: 'Dislikes', key: 'Dislikes', width: 10 },
      { header: 'Tỉ lệ tích cực (%)', key: 'Tỉ lệ tích cực (%)', width: 15 },
    ];

    exportToExcel({
      filename: 'chat_logs',
      sheetName: 'Lịch sử Chat',
      columns,
      data: exportData,
      title: 'LỊCH SỬ TRÒ CHUYỆN HỆ THỐNG',
      subtitle: `Xuất dữ liệu ngày ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Tổng số: ${logs.length} tin nhắn`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold">Chat Logs ({logs.length})</h2>
          </div>
          <Button onClick={exportChatLogsToExcel} size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Tải Excel
          </Button>
        </div>

        <div className="flex gap-3">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="user">User Messages</SelectItem>
              <SelectItem value="assistant">AI Responses</SelectItem>
              <SelectItem value="errors">Lỗi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Chọn user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={loadChatLogs} size="sm" variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Áp dụng
          </Button>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="p-4">
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
              <p className="text-slate-500 mt-2">Đang tải...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Không có chat logs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.is_error
                      ? 'bg-red-50 border-red-200'
                      : log.role === 'user'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.role === 'user' ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-green-600" />
                      )}
                      <Badge variant={log.role === 'user' ? 'default' : 'secondary'}>
                        {log.role === 'user' ? 'User' : 'AI'}
                      </Badge>
                      {log.is_error && <Badge variant="destructive">Error</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 mb-2">{log.content}</p>

                  {log.detected_chemicals && log.detected_chemicals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.detected_chemicals.map((chemical, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {chemical}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>User: {log.user_id || 'Anonymous'}</span>
                    <span>Session: {log.session_id.slice(0, 8)}...</span>
                    {log.response_time_ms && <span>⏱️ {log.response_time_ms}ms</span>}
                  </div>

                  {/* Show ratings for assistant messages */}
                  {log.role === 'assistant' && ratings.has(log.id) && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
                      <span className="text-xs font-medium text-slate-600">Đánh giá:</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-semibold text-green-700">
                            {ratings.get(log.id)!.likes}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs font-semibold text-red-700">
                            {ratings.get(log.id)!.dislikes}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {ratings.get(log.id)!.like_percentage}% tích cực
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
