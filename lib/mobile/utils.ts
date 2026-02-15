/**
 * Mobile Utilities
 * Helper functions for mobile development
 */

/**
 * Phát hiện iOS version
 */
export function getIOSVersion(): number | null {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Phát hiện Android version
 */
export function getAndroidVersion(): number | null {
  const match = navigator.userAgent.match(/Android (\d+)\.(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check if device supports vibration API
 */
export function supportsVibration(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback (nếu hỗ trợ)
 */
export function hapticFeedback(pattern: number | number[] = 10): void {
  if (supportsVibration()) {
    navigator.vibrate(pattern);
  }
}

/**
 * Haptic presets
 */
export const HapticPatterns = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
  selection: 5,
};

/**
 * Lock screen orientation (nếu hỗ trợ)
 */
export async function lockOrientation(
  orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'
): Promise<boolean> {
  if ('orientation' in screen && 'lock' in (screen as any).orientation) {
    try {
      await (screen as any).orientation.lock(orientation);
      return true;
    } catch (error) {
      console.warn('Could not lock orientation:', error);
      return false;
    }
  }
  return false;
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation(): void {
  if ('orientation' in screen && 'unlock' in (screen as any).orientation) {
    (screen as any).orientation.unlock();
  }
}

/**
 * Prevent body scroll (useful for modals on mobile)
 */
export function preventBodyScroll(): () => void {
  const scrollY = window.scrollY;
  const body = document.body;

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';

  // Return cleanup function
  return () => {
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    window.scrollTo(0, scrollY);
  };
}

/**
 * Check if virtual keyboard is visible (iOS)
 */
export function isKeyboardVisible(): boolean {
  // On iOS, when keyboard is visible, visualViewport height < window.innerHeight
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.height < window.innerHeight;
  }
  return false;
}

/**
 * Get keyboard height (approximately)
 */
export function getKeyboardHeight(): number {
  if ('visualViewport' in window && window.visualViewport) {
    return window.innerHeight - window.visualViewport.height;
  }
  return 0;
}

/**
 * Share content using native share API
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if ('share' in navigator) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }
  return false;
}

/**
 * Copy to clipboard (mobile-friendly)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API
  if ('clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  // Fallback for older browsers
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Failed to copy (fallback):', error);
    return false;
  }
}

/**
 * Request fullscreen mode
 */
export async function requestFullscreen(
  element: HTMLElement = document.documentElement
): Promise<boolean> {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    }
  } catch (error) {
    console.error('Failed to enter fullscreen:', error);
  }
  return false;
}

/**
 * Exit fullscreen mode
 */
export async function exitFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
      return true;
    }
  } catch (error) {
    console.error('Failed to exit fullscreen:', error);
  }
  return false;
}

/**
 * Check if running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  return (
    ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Check if can install PWA
 */
export function canInstallPWA(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Debounce function (useful for resize events)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function (useful for scroll events)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Calculate safe viewport height (excluding browser UI)
 */
export function getSafeViewportHeight(): number {
  if ('visualViewport' in window && window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.innerHeight;
}

/**
 * Format file size for mobile display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if device has good network connection
 */
export function hasGoodConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    // Consider 4g and wifi as "good"
    return effectiveType === '4g' || effectiveType === 'wifi';
  }

  // Assume good connection if API not available
  return true;
}

/**
 * Get connection type
 */
export function getConnectionType(): string {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }
  return 'unknown';
}
