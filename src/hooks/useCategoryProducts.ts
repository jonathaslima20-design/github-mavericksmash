import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

const CACHE_PREFIX = 'sf-categories-';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CategoryResult {
  name: string;
  products: Product[];
  totalProducts: number;
  hasMore: boolean;
}

interface CacheEntry {
  categories: CategoryResult[];
  totalCategories: number;
  totalProducts: number;
  timestamp: number;
  nextCategoryOffset: number | null;
}

function getCacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`;
}

function getCachedData(userId: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(userId));
      return null;
    }
    return parsed as CacheEntry;
  } catch {
    return null;
  }
}

function setCachedData(userId: string, data: CacheEntry): void {
  try {
    localStorage.setItem(getCacheKey(userId), JSON.stringify(data));
  } catch {
    // localStorage might be full
  }
}

interface UseCategoryProductsProps {
  userId: string;
  enabled?: boolean;
}

interface UseCategoryProductsReturn {
  categories: CategoryResult[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMoreCategories: boolean;
  totalCategories: number;
  totalProducts: number;
  loadMoreCategories: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCategoryProducts({
  userId,
  enabled = true,
}: UseCategoryProductsProps): UseCategoryProductsReturn {
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const nextOffsetRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  const fetchCategories = useCallback(async (offset: number, isInitial: boolean) => {
    if (!userId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-storefront-products`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          categoryOffset: offset,
          categoriesPerPage: 3,
          productsPerCategory: 24,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (isInitial) {
        setCategories(data.categories);
      } else {
        setCategories(prev => [...prev, ...data.categories]);
      }

      setHasMoreCategories(data.hasMoreCategories);
      setTotalCategories(data.totalCategories);
      setTotalProducts(data.totalProducts);
      nextOffsetRef.current = data.nextCategoryOffset;

      // Update cache
      const currentCategories = isInitial ? data.categories : [...categories, ...data.categories];
      setCachedData(userId, {
        categories: currentCategories,
        totalCategories: data.totalCategories,
        totalProducts: data.totalProducts,
        timestamp: Date.now(),
        nextCategoryOffset: data.nextCategoryOffset,
      });

    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      isFetchingRef.current = false;
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [userId, categories]);

  const loadMoreCategories = useCallback(async () => {
    if (nextOffsetRef.current !== null && !isFetchingRef.current) {
      await fetchCategories(nextOffsetRef.current, false);
    }
  }, [fetchCategories]);

  const refetch = useCallback(async () => {
    nextOffsetRef.current = null;
    setCategories([]);
    await fetchCategories(0, true);
  }, [fetchCategories]);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Try cache first
    const cached = getCachedData(userId);
    if (cached) {
      setCategories(cached.categories);
      setTotalCategories(cached.totalCategories);
      setTotalProducts(cached.totalProducts);
      setHasMoreCategories(cached.nextCategoryOffset !== null);
      nextOffsetRef.current = cached.nextCategoryOffset;
      setLoading(false);

      // Refresh in background after showing cache
      setTimeout(() => {
        fetchCategories(0, true);
      }, 100);
      return;
    }

    fetchCategories(0, true);
  }, [userId, enabled, fetchCategories]);

  return {
    categories,
    loading,
    loadingMore,
    error,
    hasMoreCategories,
    totalCategories,
    totalProducts,
    loadMoreCategories,
    refetch,
  };
}
