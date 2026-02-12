'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChartData {
  date: string;
  users: number;
  messages: number;
}

export function AnalyticsCharts() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'dd/MM', { locale: vi }),
          start: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
          end: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
        };
      });

      const chartData: ChartData[] = [];

      for (const day of last7Days) {
        // Count messages for this day
        const { count: messagesCount } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', day.start)
          .lte('created_at', day.end);

        // Count new users for this day
        const { count: usersCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', day.start)
          .lte('created_at', day.end);

        chartData.push({
          date: day.displayDate,
          users: usersCount || 0,
          messages: messagesCount || 0,
        });
      }

      setData(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500 mt-2">Đang tải biểu đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages Chart */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Tin nhắn (7 ngày qua)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="messages" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Users Chart */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">Người dùng mới (7 ngày qua)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              stroke="#cbd5e1"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
