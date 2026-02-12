'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Activity,
  Clock,
  TrendingUp,
  UserCheck,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { AnalyticsCharts } from './analytics-charts';
import { RecentActivity } from './recent-activity';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  averageResponseTime: number;
  todayUsers: number;
  todayMessages: number;
  errorRate: number;
  activeSessions: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    averageResponseTime: 0,
    todayUsers: 0,
    todayMessages: 0,
    errorRate: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();

    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', sevenDaysAgo.toISOString())
        .eq('account_status', 'active');

      // Get total messages
      const { count: totalMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });

      // Get today's messages
      const { count: todayMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get average response time
      const { data: responseTimes } = await supabase
        .from('chat_messages')
        .select('response_time_ms')
        .eq('role', 'assistant')
        .not('response_time_ms', 'is', null)
        .limit(100);

      const avgResponseTime = responseTimes && responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / responseTimes.length
          )
        : 0;

      // Get error rate
      const { count: totalRecentMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: errorMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_error', true)
        .gte('created_at', sevenDaysAgo.toISOString());

      const errorRate = totalRecentMessages && totalRecentMessages > 0
        ? Math.round((errorMessages || 0) / totalRecentMessages * 100 * 10) / 10
        : 0;

      // Get active sessions (last 1 hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const { data: recentSessions } = await supabase
        .from('chat_messages')
        .select('session_id')
        .gte('created_at', oneHourAgo.toISOString());

      const uniqueSessions = new Set(recentSessions?.map(m => m.session_id) || []);

      // Get users registered today
      const { count: todayUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMessages: totalMessages || 0,
        averageResponseTime: avgResponseTime,
        todayUsers: todayUsers || 0,
        todayMessages: todayMessages || 0,
        errorRate,
        activeSessions: uniqueSessions.size,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tổng Users',
      value: stats.totalUsers,
      change: `+${stats.todayUsers} hôm nay`,
      icon: Users,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Users Hoạt động',
      value: stats.activeUsers,
      change: '7 ngày qua',
      icon: UserCheck,
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Tin nhắn',
      value: stats.totalMessages.toLocaleString(),
      change: `+${stats.todayMessages} hôm nay`,
      icon: MessageSquare,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Phiên hoạt động',
      value: stats.activeSessions,
      change: 'Trong 1 giờ qua',
      icon: Activity,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      title: 'Thời gian phản hồi',
      value: `${stats.averageResponseTime}ms`,
      change: 'Trung bình',
      icon: Clock,
      color: 'bg-cyan-500',
      lightBg: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
    {
      title: 'Tỷ lệ lỗi',
      value: `${stats.errorRate}%`,
      change: '7 ngày qua',
      icon: AlertCircle,
      color: stats.errorRate > 5 ? 'bg-red-500' : 'bg-green-500',
      lightBg: stats.errorRate > 5 ? 'bg-red-50' : 'bg-green-50',
      textColor: stats.errorRate > 5 ? 'text-red-600' : 'text-green-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-600 border-t-transparent mb-4"></div>
          <p className="text-slate-500">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${stat.lightBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className={`px-2 py-1 rounded-full ${stat.lightBg} flex items-center gap-1`}>
                  <TrendingUp className={`w-3 h-3 ${stat.textColor}`} />
                  <span className={`text-xs font-medium ${stat.textColor}`}>Live</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
              <p className="text-xs text-slate-400">{stat.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-slate-900">Thống kê hoạt động</h3>
          </div>
          <AnalyticsCharts />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-slate-900">Hoạt động gần đây</h3>
          </div>
          <RecentActivity />
        </Card>
      </div>

      {/* System Health Indicator */}
      <Card className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">System Status: Online</h4>
              <p className="text-sm text-slate-600">All services running normally</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Last updated</p>
            <p className="text-sm font-medium text-slate-700">
              {new Date().toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
