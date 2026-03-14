// @ts-nocheck
/* eslint-disable */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hệ thống đang bảo trì | LuatHoaChat.vn',
  description: 'LuatHoaChat.vn đang được bảo trì và nâng cấp. Dự kiến hoạt động trở lại lúc 08:00 SA ngày 01/04/2026.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
