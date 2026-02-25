'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'luathoachat_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

/**
 * Hook for managing recent search queries
 * Stores in localStorage, max 5 recent searches
 *
 * @returns Object with recent searches and management functions
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Add new search
  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.query !== query);

      // Add new search at the beginning
      const newSearch: RecentSearch = {
        id: `${Date.now()}-${Math.random()}`,
        query,
        timestamp: Date.now(),
      };

      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }

      return updated;
    });
  }, []);

  // Remove specific search
  const removeSearch = useCallback((id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update recent searches:', error);
      }

      return updated;
    });
  }, []);

  // Clear all searches
  const clearAll = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearAll,
  };
}
