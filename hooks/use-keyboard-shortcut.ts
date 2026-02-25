'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 * Supports Cmd (Mac) / Ctrl (Windows/Linux) modifiers
 *
 * @param config - Shortcut configuration
 * @param callback - Function to call when shortcut is pressed
 * @param enabled - Whether the shortcut is active (default: true)
 *
 * @example
 * useKeyboardShortcut({ key: 'k', ctrlKey: true, metaKey: true }, () => {
 *   inputRef.current?.focus();
 * });
 */
export function useKeyboardShortcut(
  config: KeyboardShortcutConfig,
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if key matches
      const keyMatch = event.key.toLowerCase() === config.key.toLowerCase();

      // Check modifiers
      const ctrlMatch = config.ctrlKey === undefined || event.ctrlKey === config.ctrlKey;
      const metaMatch = config.metaKey === undefined || event.metaKey === config.metaKey;
      const shiftMatch = config.shiftKey === undefined || event.shiftKey === config.shiftKey;
      const altMatch = config.altKey === undefined || event.altKey === config.altKey;

      // For Cmd/Ctrl shortcuts, accept either
      const modifierMatch =
        (config.ctrlKey || config.metaKey)
          ? (event.ctrlKey || event.metaKey) && ctrlMatch && metaMatch
          : ctrlMatch && metaMatch;

      if (keyMatch && modifierMatch && shiftMatch && altMatch) {
        if (config.preventDefault !== false) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [config, callback, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for global search shortcut (Cmd/Ctrl + K)
 * Common pattern for quick search access
 */
export function useGlobalSearchShortcut(onActivate: () => void, enabled: boolean = true) {
  useKeyboardShortcut(
    { key: 'k', ctrlKey: true, metaKey: true },
    onActivate,
    enabled
  );
}
