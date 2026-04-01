'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';

/**
 * Responsive Toaster: bottom-center on mobile (<768px), top-center on desktop.
 * Must be client-side to safely access window.innerWidth.
 */
export function ClientToaster() {
  const [position, setPosition] = useState<'top-center' | 'bottom-center'>('top-center');

  useEffect(() => {
    const update = () => {
      setPosition(window.innerWidth < 768 ? 'bottom-center' : 'top-center');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <Toaster
      position={position}
      richColors
      offset={position === 'bottom-center' ? 80 : 16}
    />
  );
}
