/**
 * SearchBar.tsx — Hub
 * ─────────────────────────────────────────────────────────────────
 * Search bar với AutoComplete dropdown realtime.
 * - Gõ ≥1 ký tự → debounce 280ms → gọi /api/hub/autocomplete
 * - Dropdown hiển thị kết quả từ games, tools, websites, news
 * - Enter hoặc click result → navigate /search?q=...
 * - Chọn 1 item cụ thể → navigate đúng trang
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoComplete } from '@ui';
import type { AutoCompleteItem } from '@ui';

// Map source → route prefix
const SOURCE_ROUTES: Record<string, string> = {
  game:    '/games',
  website: '/websites',
  tool:    '/tools',
  news:    '/news',
};

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (q: string) => void;
}

export default function SearchBar({ className = '', placeholder, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSelect = useCallback((item: AutoCompleteItem) => {
    // Determine route from item id prefix: "game_123" → /games/slug
    const [src] = item.id.split('_');
    const base  = SOURCE_ROUTES[src];
    const slug  = (item.value as any)?.slug ?? item.slug;

    if (base && slug) {
      navigate(`${base}/${slug}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(item.label)}`);
    }
    setQuery('');
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      const q = query.trim();
      if (onSearch) onSearch(q);
      else navigate(`/search?q=${encodeURIComponent(q)}`);
      setQuery('');
    }
  }, [query, navigate, onSearch]);

  return (
    <div className={`hub-search-wrapper ${className}`.trim()}>
      <AutoComplete
        value={query}
        onChange={setQuery}
        onSelect={handleSelect}
        apiPrefix="/api/hub"
        source="all"
        placeholder={placeholder ?? 'Tìm game, tin tức, công cụ...'}
        inputClassName="hub-search-input"
        className="hub-search-autocomplete"
        minChars={1}
        maxResults={10}
        debounceMs={280}
        renderItem={(item: AutoCompleteItem, active: boolean) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onKeyDown={handleKeyDown}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.label}
                width={28}
                height={28}
                style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text, #f1f5f9)' }}>
                {item.label}
              </div>
              {item.category && (
                <div style={{ fontSize: 11, opacity: 0.55, marginTop: 1, color: 'var(--color-text-muted, #94a3b8)' }}>
                  {item.category}
                </div>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
