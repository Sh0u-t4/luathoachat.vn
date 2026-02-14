'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, User, Bot, Calendar, Filter, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      const { data, error } = await supabase
        .from('chat_messages')
        .select('user_id')
        .not('user_id', 'is', null);

      if (error) throw error;

      // Get unique user IDs
      const userIdsSet = new Set(data?.map((m) => m.user_id).filter(Boolean));
      const userIds = Array.from(userIdsSet);

      // Get user emails from auth.users (requires admin access)
      const usersData = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(userId as string);
            return { id: userId as string, email: userData.user?.email || 'Unknown' };
          } catch {
            return { id: userId as string, email: 'Unknown' };
          }
        })
      );

      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadChatLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

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

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);

      // Load ratings for assistant messages
      if (data) {
        await loadRatings(data.filter(log => log.role === 'assistant').map(log => log.id));
      }
    } catch (error) {
      console.error('Failed to load chat logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('message_rating_stats')
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      const ratingsMap = new Map<string, MessageRating>();
      data?.forEach((rating) => {
        ratingsMap.set(rating.message_id, rating);
      });

      setRatings(ratingsMap);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Thời gian', 'User ID', 'Role', 'Nội dung', 'Session ID', 'Hóa chất'];
    const rows = logs.map((log) => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      log.user_id || 'Anonymous',
      log.role,
      log.content.replace(/"/g, '""'),
      log.session_id,
      log.detected_chemicals?.join(', ') || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `chat-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
          <Button onClick={exportToCSV} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
