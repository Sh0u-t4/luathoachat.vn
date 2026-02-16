'use client';

import { useState, useEffect } from 'react';

const DISCLAIMER_STORAGE_KEY = 'luat-hoa-chat-disclaimer-seen';

export function useFirstTimeDisclaimer() {
  const [shouldShowDisclaimer, setShouldShowDisclaimer] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenDisclaimer = localStorage.getItem(DISCLAIMER_STORAGE_KEY);

    if (!hasSeenDisclaimer) {
      setShouldShowDisclaimer(true);
    }

    setIsReady(true);
  }, []);

  const markDisclaimerAsSeen = () => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    setShouldShowDisclaimer(false);
  };

  return {
    shouldShowDisclaimer,
    isReady,
    markDisclaimerAsSeen,
  };
}
