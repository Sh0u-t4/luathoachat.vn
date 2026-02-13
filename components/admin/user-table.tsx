'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Search, Users, UserCheck, ShieldCheck, Eye, Pencil, Trash2, UserPlus, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Translation } from '@/lib/i18n/types';
import {
  ViewUserDialog,
  EditUserDialog,
  DeleteUserDialog,
  AddUserDialog,
  type UserProfile as DialogUserProfile,
} from './user-dialogs';

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

interface UserTableProps {
  users: UserProfile[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onUserUpdate: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  onUserDelete: (userId: string) => Promise<void>;
  onUserAdd: (userData: Partial<UserProfile> & { password: string }) => Promise<void>;
  t: Translation;
}

function getRoleBadge(role: string, t: Translation) {
  const labels: Record<string, string> = {
    admin: t.admin.roleAdmin,
    user: t.admin.roleUser,
  };
  const styles: Record<string, string> = {
    admin: 'bg-amber-100 text-amber-800 border-amber-200',
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
  onUserUpdate,
  onUserDelete,
  onUserAdd,
  t,
}: UserTableProps) {
  const [viewUser, setViewUser] = useState<UserProfile | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);

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
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.admin.searchPlaceholder}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv(filtered)}
              className="gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              {t.admin.exportCsv}
            </Button>
            <Button
              size="sm"
              onClick={() => setAddUserOpen(true)}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              Thêm người dùng
            </Button>
          </div>
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
                <TableHead className="font-semibold text-slate-700 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-400">
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewUser(user)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditUser(user)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteUser(user)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <ViewUserDialog user={viewUser} open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)} />

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSave={onUserUpdate}
      />

      <DeleteUserDialog
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={onUserDelete}
      />

      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} onAdd={onUserAdd} />
    </div>
  );
}
