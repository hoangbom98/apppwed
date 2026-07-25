// packages/shared-ui/src/pwa/autoComplete/useAutoComplete.ts
import { useState, useCallback } from 'react';

export interface AutoCompleteItem {
  value:       string;
  label?:      string;
  id?:         string;
  category?:   string;
  url?:        string;
  image?:      string;
  // Allow extra fields (slug, etc.) — typed as any so callers avoid casts
  [key: string]: any;
}

export function useAutoComplete<T extends AutoCompleteItem = AutoCompleteItem>(
  fetchOptions: (query: string) => Promise<T[]>,
) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = useCallback(async (query: string) => {
    if (!query) { setOptions([]); return; }
    setLoading(true);
    try {
      const result = await fetchOptions(query);
      setOptions(result);
    } finally {
      setLoading(false);
    }
  }, [fetchOptions]);

  return { options, loading, onSearch };
}
