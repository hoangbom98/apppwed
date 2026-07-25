// @ts-nocheck
/**
 * shared-ui/components/SearchBar.jsx
 * ─────────────────────────────────────────────────────────────────
 * Generic search bar with i18n support.
 * Props:
 *   onSearch    {(q: string) => void}  – called when form is submitted
 *   placeholder {string}               – overrides i18n key 'search.placeholder'
 *   className   {string}               – extra CSS classes
 *
 * Usage (React Router apps):
 *   <SearchBar onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)} />
 *
 * Usage (custom handler):
 *   <SearchBar onSearch={(q) => setQuery(q)} />
 */
import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder, className = '' }) {
  const [q, setQ] = useState('');

  const handle = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed && onSearch) onSearch(trimmed);
  };

  return (
    <form onSubmit={handle} className={`search-bar flex items-center gap-2 ${className}`.trim()}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder || 'Tìm kiếm...'}
        className="search-bar__input flex-1"
      />
      <button type="submit" className="search-bar__btn">
        Search
      </button>
    </form>
  );
}
