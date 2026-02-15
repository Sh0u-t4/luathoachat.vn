'use client';

import { useCallback, useRef, MouseEvent, TouchEvent } from 'react';

export interface LongPressOptions {
  threshold?: number; // milliseconds to hold before triggering
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

const defaultOptions: Required<LongPressOptions> = {
  threshold: 500,
  onStart: () => {},
  onFinish: () => {},
  onCancel: () => {},
};

/**
 * Hook để xử lý long press gesture
 * Hỗ trợ cả mouse và touch events
 */
export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const timeoutRef = useRef<NodeJS.Timeout>();
  const targetRef = useRef<EventTarget>();
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // Prevent default right-click menu on desktop
      if ('button' in event && event.button === 2) {
        return;
      }

      targetRef.current = event.target;
      isLongPressRef.current = false;

      opts.onStart();

      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        callback();
        opts.onFinish();
      }, opts.threshold);
    },
    [callback, opts]
  );

  const clear = useCallback(
    (event: MouseEvent | TouchEvent, shouldTriggerCancel = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (shouldTriggerCancel && !isLongPressRef.current) {
        opts.onCancel();
      }

      isLongPressRef.current = false;
      targetRef.current = undefined;
    },
    [opts]
  );

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      start(e);
    },
    [start]
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      clear(e);
    },
    [clear]
  );

  const onMouseLeave = useCallback(
    (e: MouseEvent) => {
      clear(e, false);
    },
    [clear]
  );

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      start(e);
    },
    [start]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      clear(e);
    },
    [clear]
  );

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
  };
}
