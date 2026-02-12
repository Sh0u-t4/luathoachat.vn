'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Loader2, FlaskConical, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase';
import { UserTable } from '@/components/admin/user-table';
import { ChatLogsViewer } from '@/components/admin/chat-logs-viewer';
import { DashboardOverview } from '@/components/admin/dashboard-overview';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  position: string | null;
  role: string;
  account_status: string;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/dang-nhap');
      return;
    }
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, phone, company_name, position, role, account_status, login_count, last_login_at, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Khong the tai danh sach nguoi dung');
        } else {
          setUsers(data || []);
        }
      } catch {
        toast.error('Loi ket noi');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [authLoading, user, isAdmin, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

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
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              Quản lý Users
            </TabsTrigger>
            <TabsTrigger value="chatlogs" className="gap-2">
              Chat Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview />
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
                t={t}
              />
            )}
          </TabsContent>

          <TabsContent value="chatlogs">
            <ChatLogsViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
