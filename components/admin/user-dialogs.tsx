'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Eye,
  Pencil,
  Trash2,
  X,
  UserPlus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface UserProfile {
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

interface ViewUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
}

interface DeleteUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string) => Promise<void>;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (userData: Partial<UserProfile> & { password: string }) => Promise<void>;
}

// View User Dialog
export function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-5 h-5 text-cyan-600" />
            Chi tiết người dùng
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về tài khoản của {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Họ và tên</Label>
                <p className="text-sm font-medium text-slate-900">{user.full_name || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </Label>
                <p className="text-sm text-slate-900">{user.email}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Điện thoại
                </Label>
                <p className="text-sm text-slate-900">{user.phone || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Chức vụ
                </Label>
                <p className="text-sm text-slate-900">{user.position || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Thông tin doanh nghiệp
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Công ty</Label>
                <p className="text-sm text-slate-900">{user.company_name || '-'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Mã số thuế</Label>
                <p className="text-sm text-slate-900">{user.company_tax_code || '-'}</p>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-slate-500">Ngành nghề</Label>
                <p className="text-sm text-slate-900">{user.industry || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Trạng thái tài khoản
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Phân quyền</Label>
                <Badge
                  variant="outline"
                  className={
                    user.role === 'admin'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }
                >
                  {user.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Trạng thái</Label>
                <Badge
                  variant="outline"
                  className={
                    user.account_status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : user.account_status === 'suspended'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }
                >
                  {user.account_status === 'active'
                    ? 'Hoạt động'
                    : user.account_status === 'suspended'
                    ? 'Tạm khóa'
                    : 'Vô hiệu hóa'}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Số lần đăng nhập</Label>
                <p className="text-sm font-semibold text-slate-900">{user.login_count}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Đăng nhập cuối
                </Label>
                <p className="text-sm text-slate-900">
                  {user.last_login_at ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm') : 'Chưa có'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Ngày đăng ký</Label>
                <p className="text-sm text-slate-900">
                  {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Cập nhật cuối</Label>
                <p className="text-sm text-slate-900">
                  {format(new Date(user.updated_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Dialog
export function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Pre-fill form whenever the dialog opens with a user
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || '',
        company_name: user.company_name || '',
        company_tax_code: user.company_tax_code || '',
        position: user.position || '',
        industry: user.industry || '',
        role: user.role,
        account_status: user.account_status,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Send all fields (include empty strings to allow clearing values)
      const updates: Partial<UserProfile> = { ...formData };
      await onSave(user.id, updates);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="w-5 h-5 text-cyan-600" />
              Chỉnh sửa người dùng
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin cho {user.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Thông tin cá nhân</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Điện thoại</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="position">Chức vụ</Label>
                  <Input
                    id="position"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Trưởng phòng, Giám đốc..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Thông tin doanh nghiệp</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Tên công ty</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Công ty TNHH..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_tax_code">Mã số thuế</Label>
                  <Input
                    id="company_tax_code"
                    value={formData.company_tax_code || ''}
                    onChange={(e) => setFormData({ ...formData, company_tax_code: e.target.value })}
                    placeholder="0123456789"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="industry">Ngành nghề</Label>
                  <Input
                    id="industry"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Sản xuất, Thương mại..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-700">Cài đặt tài khoản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Phân quyền</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Người dùng</SelectItem>
                      <SelectItem value="admin">Quản trị</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_status">Trạng thái</Label>
                  <Select
                    value={formData.account_status}
                    onValueChange={(value) => setFormData({ ...formData, account_status: value })}
                  >
                    <SelectTrigger id="account_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="suspended">Tạm khóa</SelectItem>
                      <SelectItem value="deactivated">Vô hiệu hóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete User Dialog
export function DeleteUserDialog({ user, open, onOpenChange, onConfirm }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (!user || confirmText !== 'XOA') return;

    setLoading(true);
    try {
      await onConfirm(user.id);
      onOpenChange(false);
      setConfirmText('');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Xác nhận xóa người dùng
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Bạn có chắc chắn muốn xóa tài khoản <span className="font-semibold text-slate-900">{user.email}</span>?
            </p>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến tài khoản này
                sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm" className="text-sm">
                Nhập <span className="font-mono font-semibold">XOA</span> để xác nhận:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nhập XOA"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || confirmText !== 'XOA'}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Đang xóa...' : 'Xóa tài khoản'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Add User Dialog
export function AddUserDialog({ open, onOpenChange, onAdd }: AddUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: '',
    position: '',
    role: 'user',
    account_status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd(formData);
      onOpenChange(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        company_name: '',
        position: '',
        role: 'user',
        account_status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="w-5 h-5 text-cyan-600" />
              Thêm người dùng mới
            </DialogTitle>
            <DialogDescription>Tạo tài khoản mới cho hệ thống</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password">
                  Mật khẩu <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="full_name">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Chức vụ</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Nhân viên..."
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="company_name">Tên công ty</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Công ty TNHH..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Phân quyền</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Người dùng</SelectItem>
                    <SelectItem value="admin">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.account_status}
                  onValueChange={(value) => setFormData({ ...formData, account_status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="suspended">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
