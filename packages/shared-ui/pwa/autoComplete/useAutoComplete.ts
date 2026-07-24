import { useState, useEffect, useCallback, useRef } from 'react';

/** A single suggestion item returned from the API */
export interface AutoCompleteItem {
  id:        string;
  label:     string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value:     any;
  category?: string;
  image?:    string | null;
  score?:    number;
}

/** One source group in the API response */
export interface AutoCompleteResult {
  source: string;
  items:  AutoCompleteItem[];
  total:  number;
}

export interface UseAutoCompleteOptions {
  /** Minimum characters before fetching (default: 1) */
  minChars?:    number;
  /** Max items returned across all sources (default: 10) */
  maxResults?:  number;
  /** Debounce delay in ms (default: 280) */
  debounceMs?:  number;
  /** API endpoint prefix, e.g. '/api/game' */
  apiPrefix:    string;
  /** Which source(s) to query: 'game' | 'user' | 'all' | etc. */
  source?:      string;
  /** Cache results in memory (default: true) */
  cache?:       boolean;
}

const _cache = new Map<string, AutoCompleteResult[]>();

/**
 * useAutoComplete — fetches smart-search suggestions from /api/<module>/autocomplete.
 *
 * Usage:
 *   const { results, isLoading } = useAutoComplete('slot', {
 *     apiPrefix: '/api/game',
 *     source: 'game',
 *   });
 */
export function useAutoComplete(query: string, options: UseAutoCompleteOptions) {
  const {
    minChars   = 1,
    maxResults = 10,
    debounceMs = 280,
    apiPrefix,
    source     = 'all',
    cache      = true,
  } = options;

  const [results,   setResults]   = useState<AutoCompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch_ = useCallback(async (q: string) => {
    const cacheKey = `${apiPrefix}|${q}|${source}`;
    if (cache && _cache.has(cacheKey)) {
      setResults(_cache.get(cacheKey)!);
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const url = `${apiPrefix}/autocomplete?q=${encodeURIComponent(q)}&source=${source}&limit=${maxResults}`;
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: AutoCompleteResult[] = json?.data?.results ?? json?.results ?? [];
      setResults(data);
      if (cache) _cache.set(cacheKey, data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[AutoComplete] Fetch error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiPrefix, source, maxResults, cache]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.length < minChars) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(() => fetch_(query), debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, minChars, debounceMs, fetch_]);

  const flatItems = results.flatMap((r) => r.items);

  return {
    results,
    flatItems,
    isLoading,
    hasResults: flatItems.length > 0,
  };
}
