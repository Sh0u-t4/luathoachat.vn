import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FAQItem {
  id: string;
  question: string;
  question_variations: string[];
  answer: string;
  citations: any[];
  category: string;
  priority: number;
}

const FAQ_CACHE_KEY = 'legal_faq_cache';
const FAQ_CACHE_VERSION_KEY = 'legal_faq_cache_version';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useFAQCache() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load FAQs from cache or fetch from server
  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      // Try to load from localStorage first
      const cachedData = localStorage.getItem(FAQ_CACHE_KEY);
      const cachedVersion = localStorage.getItem(FAQ_CACHE_VERSION_KEY);

      if (cachedData && cachedVersion) {
        const cacheTimestamp = parseInt(cachedVersion, 10);
        const now = Date.now();

        // If cache is still valid (less than 24 hours old)
        if (now - cacheTimestamp < CACHE_DURATION) {
          const parsedFaqs = JSON.parse(cachedData);
          setFaqs(parsedFaqs);
          setLastUpdated(new Date(cacheTimestamp));
          setIsLoading(false);
          return;
        }
      }

      // Cache is invalid or doesn't exist, fetch from server
      await refreshFAQs();
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setIsLoading(false);
    }
  };

  const refreshFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_cache')
        .select('*')
        .order('priority', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Save to cache
        const now = Date.now();
        localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(FAQ_CACHE_VERSION_KEY, now.toString());

        setFaqs(data);
        setLastUpdated(new Date(now));
      }
    } catch (error) {
      console.error('Error refreshing FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search FAQs by question
  const searchFAQ = (query: string): FAQItem | null => {
    if (!query || query.trim().length < 3) return null;

    const normalizedQuery = query.toLowerCase().trim();

    // Direct match on question or variations
    const directMatch = faqs.find((faq) => {
      const questionMatch = faq.question.toLowerCase().includes(normalizedQuery);
      const variationMatch = faq.question_variations.some((v) =>
        v.toLowerCase().includes(normalizedQuery)
      );
      return questionMatch || variationMatch;
    });

    if (directMatch) return directMatch;

    // Fuzzy match - find FAQ with most keyword matches
    const keywords = normalizedQuery.split(' ').filter((k) => k.length > 2);
    let bestMatch: FAQItem | null = null;
    let maxMatches = 0;

    for (const faq of faqs) {
      const searchText = `${faq.question} ${faq.question_variations.join(' ')}`.toLowerCase();
      const matches = keywords.filter((keyword) => searchText.includes(keyword)).length;

      if (matches > maxMatches && matches >= Math.ceil(keywords.length / 2)) {
        maxMatches = matches;
        bestMatch = faq;
      }
    }

    return bestMatch;
  };

  // Get FAQs by category
  const getFAQsByCategory = (category: string): FAQItem[] => {
    return faqs.filter((faq) => faq.category === category);
  };

  // Get all categories
  const getCategories = (): string[] => {
    return Array.from(new Set(faqs.map((faq) => faq.category)));
  };

  return {
    faqs,
    isLoading,
    lastUpdated,
    searchFAQ,
    getFAQsByCategory,
    getCategories,
    refreshFAQs,
  };
}
