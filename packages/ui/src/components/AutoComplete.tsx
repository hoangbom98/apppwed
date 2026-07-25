// @ts-nocheck
// packages/shared-ui/src/components/AutoComplete.tsx
// Custom AutoComplete wrapper — accepts both antd-standard props AND
// our extended props (apiPrefix, source, onSelect with AutoCompleteItem, etc.)
import React, { useState, useRef, useCallback } from 'react';
import type { AutoCompleteItem } from '../pwa/autoComplete/useAutoComplete';

interface AutoCompleteProps {
  value?:         string;
  onChange?:      (val: string) => void;
  onSelect?:      (item: AutoCompleteItem) => void;
  placeholder?:   string;
  className?:     string;
  inputClassName?: string;
  // API-driven options
  apiPrefix?:     string;
  source?:        string;
  minChars?:      number;
  maxResults?:    number;
  debounceMs?:    number;
  // antd-compat
  options?:       AutoCompleteItem[];
  disabled?:      boolean;
  renderItem?:    (item: AutoCompleteItem, active: boolean) => React.ReactNode;
  style?:         React.CSSProperties;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  value = '', onChange, onSelect,
  placeholder, className, inputClassName,
  apiPrefix, source, minChars = 1, maxResults = 10, debounceMs = 280,
  options: externalOptions, disabled, renderItem, style,
}) => {
  const [results, setResults]   = useState<AutoCompleteItem[]>([]);
  const [open, setOpen]         = useState(false);
  const [active, setActive]     = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < minChars) { setResults([]); setOpen(false); return; }
    if (externalOptions) {
      const filtered = externalOptions.filter(o =>
        o.label?.toLowerCase().includes(q.toLowerCase()) ||
        o.value.toLowerCase().includes(q.toLowerCase())
      ).slice(0, maxResults);
      setResults(filtered); setOpen(filtered.length > 0); return;
    }
    if (!apiPrefix) return;
    try {
      const url = `${apiPrefix}/autocomplete?q=${encodeURIComponent(q)}&source=${source ?? 'all'}&limit=${maxResults}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } });
      if (res.ok) {
        const data: AutoCompleteItem[] = await res.json();
        setResults(data.slice(0, maxResults));
        setOpen(data.length > 0);
      }
    } catch { /* network error — silently fail */ }
  }, [apiPrefix, source, minChars, maxResults, externalOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange?.(q);
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => search(q), debounceMs);
  };

  const handleSelect = (item: AutoCompleteItem) => {
    onChange?.(item.label ?? item.value);
    onSelect?.(item);
    setOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && active >= 0) { handleSelect(results[active]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <input
        className={inputClassName}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ width: '100%' }}
      />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: 8, maxHeight: 320, overflowY: 'auto' }}>
          {results.map((item, i) => (
            <div key={item.value + i} onMouseDown={() => handleSelect(item)} style={{ cursor: 'pointer' }}>
              {renderItem ? renderItem(item, i === active) : (
                <div style={{ padding: '8px 14px', background: i === active ? 'rgba(99,102,241,0.12)' : 'transparent' }}>
                  {item.label ?? item.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
