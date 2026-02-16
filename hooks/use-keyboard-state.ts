'use client';

import { useState, useEffect } from 'react';

export interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  visualViewportHeight: number;
  layoutViewportHeight: number;
}

/**
 * Hook to detect virtual keyboard state on mobile devices
 * Uses Visual Viewport API to calculate keyboard height accurately
 *
 * @returns KeyboardState object with keyboard visibility and dimensions
 */
export function useKeyboardState(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    visualViewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    layoutViewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Check if Visual Viewport API is supported
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      console.warn('Visual Viewport API not supported');
      return;
    }

    // Store initial layout viewport height (doesn't change when keyboard opens)
    const layoutHeight = window.innerHeight;

    const handleViewportChange = () => {
      const currentVisualHeight = visualViewport.height;
      const currentLayoutHeight = window.innerHeight;

      // Calculate keyboard height
      // On iOS: layoutHeight stays same, visualHeight decreases
      // On Android: both might change, but we use the difference
      const keyboardHeight = Math.max(0, layoutHeight - currentVisualHeight);

      // Threshold: keyboard is considered open if it takes more than 150px
      // This prevents false positives from browser chrome showing/hiding
      const isOpen = keyboardHeight > 150;

      setKeyboardState({
        isKeyboardOpen: isOpen,
        keyboardHeight: isOpen ? keyboardHeight : 0,
        visualViewportHeight: currentVisualHeight,
        layoutViewportHeight: currentLayoutHeight,
      });
    };

    // Listen to viewport changes
    visualViewport.addEventListener('resize', handleViewportChange);
    visualViewport.addEventListener('scroll', handleViewportChange);

    // Initial check
    handleViewportChange();

    // Cleanup
    return () => {
      visualViewport.removeEventListener('resize', handleViewportChange);
      visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  return keyboardState;
}
