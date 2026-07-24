import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { useAutoComplete, type AutoCompleteItem, type UseAutoCompleteOptions } from './useAutoComplete';

interface AutoCompleteProps extends Omit<UseAutoCompleteOptions, 'apiPrefix'> {
  /** Value / controlled query string */
  value:         string;
  onChange:      (v: string) => void;
  /** Called when user selects a suggestion */
  onSelect:      (item: AutoCompleteItem) => void;
  /** API prefix for the module, e.g. '/api/game' */
  apiPrefix:     string;
  placeholder?:  string;
  inputClassName?: string;
  className?:    string;
  /** Optional custom render for each item */
  renderItem?:   (item: AutoCompleteItem, active: boolean) => React.ReactNode;
}

/**
 * AutoComplete — controlled input with smart suggestion dropdown.
 *
 * Usage:
 *   <AutoComplete
 *     value={query}
 *     onChange={setQuery}
 *     onSelect={(item) => navigate(`/games/${item.value.slug}`)}
 *     apiPrefix="/api/game"
 *     source="game"
 *     placeholder="Tìm game..."
 *   />
 */
export function AutoComplete({
  value,
  onChange,
  onSelect,
  apiPrefix,
  source      = 'all',
  minChars    = 1,
  maxResults  = 10,
  debounceMs  = 280,
  cache       = true,
  placeholder = 'Tìm kiếm...',
  inputClassName = '',
  className      = '',
  renderItem,
}: AutoCompleteProps) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { flatItems, isLoading, hasResults } = useAutoComplete(value, {
    apiPrefix, source, minChars, maxResults, debounceMs, cache,
  });

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(-1); }, [flatItems]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && flatItems[activeIdx]) {
          onSelect(flatItems[activeIdx]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, flatItems, activeIdx, onSelect]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(e.target.value.length >= minChars);
  };

  const handleSelect = (item: AutoCompleteItem) => {
    onSelect(item);
    setIsOpen(false);
  };

  // Default item renderer
  const defaultRenderItem = (item: AutoCompleteItem, active: boolean) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        cursor: 'pointer',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.label}
          width={32}
          height={32}
          style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </div>
        {item.category && (
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{item.category}</div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= minChars && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ width: '100%', boxSizing: 'border-box' }}
          className={inputClassName}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            aria-label="Xóa tìm kiếm"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: 0.5, fontSize: 16, lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (isLoading || hasResults) && (
        <div style={{
          position: 'absolute', zIndex: 1000, width: '100%', top: 'calc(100% + 4px)',
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          maxHeight: 320,
          overflowY: 'auto',
        }}>
          {isLoading && (
            <div style={{ padding: 12, textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              Đang tìm kiếm…
            </div>
          )}

          {!isLoading && flatItems.map((item, idx) => (
            <div key={item.id} onMouseDown={() => handleSelect(item)}>
              {renderItem
                ? renderItem(item, idx === activeIdx)
                : defaultRenderItem(item, idx === activeIdx)
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
