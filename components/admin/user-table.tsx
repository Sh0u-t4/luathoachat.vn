'use client';

import { format } from 'date-fns';
import { Download, Search, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Translation } from '@/lib/i18n/types';

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

interface UserTableProps {
  users: UserProfile[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  t: Translation;
}

function getRoleBadge(role: string, t: Translation) {
  const labels: Record<string, string> = {
    admin: t.admin.roleAdmin,
    moderator: t.admin.roleModerator,
    user: t.admin.roleUser,
  };
  const styles: Record<string, string> = {
    admin: 'bg-amber-100 text-amber-800 border-amber-200',
    moderator: 'bg-sky-100 text-sky-800 border-sky-200',
    user: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <Badge variant="outline" className={styles[role] || styles.user}>
      {labels[role] || role}
    </Badge>
  );
}

function getStatusBadge(status: string, t: Translation) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    deactivated: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const labels: Record<string, string> = {
    active: t.admin.filterActive,
    suspended: t.admin.filterSuspended,
    deactivated: 'Vô hiệu hóa',
  };
  return (
    <Badge variant="outline" className={styles[status] || styles.deactivated}>
      {labels[status] || status}
    </Badge>
  );
}

function exportToCsv(users: UserProfile[]) {
  const headers = [
    'Họ tên', 'Email', 'Điện thoại', 'Công ty', 'Chức vụ',
    'Phân quyền', 'Trạng thái', 'Số lần đăng nhập', 'Đăng nhập cuối', 'Ngày đăng ký',
  ];
  const rows = users.map((u) => [
    u.full_name,
    u.email,
    u.phone || '',
    u.company_name || '',
    u.position || '',
    u.role,
    u.account_status,
    String(u.login_count),
    u.last_login_at ? format(new Date(u.last_login_at), 'dd/MM/yyyy HH:mm') : '',
    u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy HH:mm') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `users_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function UserTable({
  users,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  t,
}: UserTableProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.account_status === 'active').length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company_name && u.company_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || u.account_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
            <p className="text-xs text-slate-500">{t.admin.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{activeUsers}</p>
            <p className="text-xs text-slate-500">{t.admin.activeUsers}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{adminUsers}</p>
            <p className="text-xs text-slate-500">{t.admin.adminUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.admin.searchPlaceholder}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'active', 'suspended'].map((status) => {
              const labels: Record<string, string> = {
                all: t.admin.filterAll,
                active: t.admin.filterActive,
                suspended: t.admin.filterSuspended,
              };
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onStatusFilterChange(status)}
                  className={
                    statusFilter === status
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      : 'text-slate-600'
                  }
                >
                  {labels[status]}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCsv(filtered)}
            className="gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            {t.admin.exportCsv}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="font-semibold text-slate-700">{t.admin.columnName}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnEmail}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnPhone}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnCompany}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnPosition}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnRole}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnStatus}</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">{t.admin.columnLogins}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t.admin.columnRegistered}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    {t.admin.noUsers}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                      {user.full_name || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{user.email}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{user.phone || '-'}</TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap max-w-[180px] truncate">
                      {user.company_name || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">{user.position || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role, t)}</TableCell>
                    <TableCell>{getStatusBadge(user.account_status, t)}</TableCell>
                    <TableCell className="text-center text-slate-600">{user.login_count}</TableCell>
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
