'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShieldAlert, ArrowLeft, Loader2, FlaskConical, LayoutDashboard, Brain, Bot, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Lazy load heavy components để giảm bundle size
const UserTable = dynamic(() => import('@/components/admin/user-table').then(mod => ({ default: mod.UserTable })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
    </div>
  ),
  ssr: false
});

const ChatLogsViewer = dynamic(() => import('@/components/admin/chat-logs-viewer').then(mod => ({ default: mod.ChatLogsViewer })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
    </div>
  ),
  ssr: false
});

const DashboardOverview = dynamic(() => import('@/components/admin/dashboard-overview').then(mod => ({ default: mod.DashboardOverview })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
    </div>
  ),
  ssr: false
});

const FeedbackViewer = dynamic(() => import('@/components/admin/feedback-viewer').then(mod => ({ default: mod.FeedbackViewer })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
    </div>
  ),
  ssr: false
});

const KnowledgeManager = dynamic(() => import('@/components/admin/knowledge-manager').then(mod => ({ default: mod.KnowledgeManager })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
    </div>
  ),
  ssr: false
});

const AIConfigManager = dynamic(() => import('@/components/admin/ai-config-manager').then(mod => ({ default: mod.AIConfigManager })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  ),
  ssr: false
});

const AIAnalyticsDashboard = dynamic(() => import('@/components/admin/ai-analytics-dashboard').then(mod => ({ default: mod.AIAnalyticsDashboard })), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  ),
  ssr: false
});

const KnowledgeAuditPanel = dynamic(() => import('@/components/admin/knowledge-audit-panel').then(mod => ({ default: mod.KnowledgeAuditPanel })), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  ),
  ssr: false
});

const ContentVerifyPanel = dynamic(() => import('@/components/admin/content-verify-panel').then(mod => ({ default: mod.ContentVerifyPanel })), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  ),
  ssr: false
});

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  company_tax_code: string | null;
  position: string | null;
  industry: string | null;
  role: string;
  account_status: string;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Không thể tải danh sách người dùng');
      } else {
        setUsers(data || []);
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/dang-nhap');
      return;
    }
    if (!isAdmin) return;

    fetchUsers();
  }, [authLoading, user, isAdmin, router]);

  const handleUserUpdate = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Cập nhật thành công!');
      await fetchUsers();
    } catch (error: any) {
      toast.error('Lỗi: ' + (error.message || 'Không thể cập nhật'));
    }
  };

  const handleUserDelete = async (userId: string) => {
    try {
      const { error } = await supabase.from('user_profiles').delete().eq('id', userId);

      if (error) throw error;

      toast.success('Đã xóa người dùng!');
      await fetchUsers();
    } catch (error: any) {
      toast.error('Lỗi: ' + (error.message || 'Không thể xóa'));
    }
  };

  const handleUserAdd = async (userData: Partial<UserProfile> & { password: string }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email!,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            registration_source: 'admin_created',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('user_profiles').update({
          full_name: userData.full_name,
          phone: userData.phone,
          company_name: userData.company_name,
          position: userData.position,
          role: userData.role,
          account_status: userData.account_status,
        }).eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success('Tạo tài khoản thành công!');
      await fetchUsers();
    } catch (error: any) {
      toast.error('Lỗi: ' + (error.message || 'Không thể tạo tài khoản'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Profile may still be loading even after authLoading is done — wait for it
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t.admin.accessDenied}</h1>
          <p className="text-slate-500 mb-8">{t.admin.accessDeniedDesc}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.admin.backHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-cyan-600" />
                </div>
                <span className="text-lg font-bold text-slate-900">LuatHoaChat.vn</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-slate-200" />
              <span className="hidden sm:block text-sm font-medium text-slate-500">
                {t.admin.title}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{profile?.full_name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t.admin.backHome}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t.admin.title}</h1>
          </div>
          <p className="text-slate-500">{t.admin.subtitle}</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-4 sm:grid-cols-7 h-auto sm:h-12 gap-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <span className="hidden sm:inline">Quản lý Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <span className="hidden sm:inline">Phản hồi</span>
              <span className="sm:hidden">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="chatlogs" className="gap-2">
              <span className="hidden sm:inline">Chat Logs</span>
              <span className="sm:hidden">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Knowledge Base</span>
              <span className="sm:hidden">KB</span>
            </TabsTrigger>
            <TabsTrigger value="ai-config" className="gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Cấu hình AI</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="analytics">
            <AIAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
              </div>
            ) : (
              <UserTable
                users={users}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onUserUpdate={handleUserUpdate}
                onUserDelete={handleUserDelete}
                onUserAdd={handleUserAdd}
                t={t}
              />
            )}
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackViewer />
          </TabsContent>

          <TabsContent value="chatlogs">
            <ChatLogsViewer />
          </TabsContent>

          <TabsContent value="knowledge">
            <div className="space-y-8">
              <KnowledgeManager />
              <div className="border-t border-slate-200 pt-8">
                <KnowledgeAuditPanel />
              </div>
              <div className="border-t border-slate-200 pt-8">
                <ContentVerifyPanel />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-config">
            <AIConfigManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
