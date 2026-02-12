'use client';

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, MessageSquare, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'user_registered' | 'message_sent' | 'error_occurred';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();

    // Refresh every 15 seconds
    const interval = setInterval(loadRecentActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadRecentActivity = async () => {
    try {
      const activities: Activity[] = [];

      // Get recent users (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data: newUsers } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, created_at')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (newUsers) {
        newUsers.forEach((user) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registered',
            title: 'Người dùng mới đăng ký',
            description: `${user.full_name || user.email} đã tạo tài khoản`,
            timestamp: user.created_at,
            metadata: { email: user.email },
          });
        });
      }

      // Get recent messages
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('id, content, role, is_error, created_at, user_id')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentMessages) {
        recentMessages.forEach((msg) => {
          if (msg.is_error) {
            activities.push({
              id: `msg-${msg.id}`,
              type: 'error_occurred',
              title: 'Lỗi xảy ra',
              description: msg.content.substring(0, 60) + '...',
              timestamp: msg.created_at,
            });
          } else if (msg.role === 'user') {
            activities.push({
              id: `msg-${msg.id}`,
              type: 'message_sent',
              title: 'Tin nhắn mới',
              description: msg.content.substring(0, 60) + '...',
              timestamp: msg.created_at,
              metadata: { userId: msg.user_id },
            });
          }
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(activities.slice(0, 15));
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'error_occurred':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityBadge = (type: Activity['type']) => {
    switch (type) {
      case 'user_registered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đăng ký</Badge>;
      case 'message_sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Tin nhắn</Badge>;
      case 'error_occurred':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Lỗi</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-2">Đang tải hoạt động...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <User className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-slate-500">Chưa có hoạt động gần đây</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[460px]">
      <div className="space-y-3 pr-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-slate-900">{activity.title}</h4>
                {getActivityBadge(activity.type)}
              </div>
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{activity.description}</p>
              <p className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
