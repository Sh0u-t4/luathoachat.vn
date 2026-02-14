'use client';

import { useState, useEffect } from 'react';
import { User, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { t } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    company_name: profile?.company_name || '',
    company_tax_code: profile?.company_tax_code || '',
    position: profile?.position || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) return;

    if (!formData.full_name.trim()) {
      toast.error(t.auth.errorNameRequired);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          company_name: formData.company_name.trim() || null,
          company_tax_code: formData.company_tax_code.trim() || null,
          position: formData.position.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(t.auth.profileUpdated, {
        description: t.auth.profileUpdatedDesc,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Đã làm mới thông tin', {
        description: 'Thông tin tài khoản của bạn đã được cập nhật',
      });
    } catch (error) {
      toast.error('Không thể làm mới thông tin');
    } finally {
      setRefreshing(false);
    }
  };

  // Update form data when dialog opens or profile changes
  useEffect(() => {
    if (profile && open) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company_name: profile.company_name || '',
        company_tax_code: profile.company_tax_code || '',
        position: profile.position || '',
      });
    }
  }, [profile, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                <User className="w-6 h-6 text-cyan-700" />
              </div>
              <div>
                <DialogTitle className="text-xl">{t.auth.editProfileTitle}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t.auth.editProfileSubtitle}
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRefreshProfile}
              disabled={refreshing}
              title="Làm mới thông tin"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {profile && (
            <div className="flex gap-2 mt-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {profile.role === 'admin' ? '🛡️ Admin' : '👤 User'}
              </Badge>
              <Badge
                variant={profile.account_status === 'active' ? 'default' : 'secondary'}
                className={profile.account_status === 'active' ? 'bg-green-500' : ''}
              >
                {profile.account_status === 'active' ? '✓ Active' : profile.account_status}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              {t.auth.fullName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder={t.auth.fullNamePlaceholder}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              {t.auth.phone}
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={t.auth.phonePlaceholder}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-sm font-medium">
              {t.auth.companyName}
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder={t.auth.companyNamePlaceholder}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_tax_code" className="text-sm font-medium">
              {t.auth.companyTaxCode}
            </Label>
            <Input
              id="company_tax_code"
              value={formData.company_tax_code}
              onChange={(e) => handleChange('company_tax_code', e.target.value)}
              placeholder={t.auth.companyTaxCodePlaceholder}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">
              {t.auth.position}
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder={t.auth.positionPlaceholder}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              {t.auth.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? t.auth.saving : t.auth.saveChanges}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
