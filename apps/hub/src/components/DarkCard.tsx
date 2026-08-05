import React from 'react';

// frontend/hub/src/components/DarkCard.tsx
// Hub-specific card variant with dark theme (bg-gray-800).
// This is NOT the same as @ui/Card (which is light-themed).
// Use @ui/Card for standard light-theme cards across other projects.
export interface DarkCardProps {
  image?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function DarkCard({ image, title, subtitle, badge, href, onClick, className = '', children }: DarkCardProps) {
  // If children are provided, render as a generic wrapper (used by FavoritesPage)
  if (children) {
    const cls = `bg-gray-800 rounded-lg overflow-hidden transition-all ${className}`;
    if (href) return <a href={href} className={`no-underline block ${cls}`}>{children}</a>;
    return <div className={cls} onClick={onClick}>{children}</div>;
  }

  const inner = (
    <div className={`bg-gray-800 rounded-lg overflow-hidden hover:ring-1 hover:ring-indigo-500 transition-all cursor-pointer ${className}`}>
      {image && <img src={image} alt={title ?? ''} className="w-full h-36 object-cover" loading="lazy" width="400" height="144" />}
      <div className="p-3">
        {badge && <span className="text-xs bg-indigo-900 text-indigo-300 rounded px-1.5 py-0.5 mb-1 inline-block">{badge}</span>}
        {title && <div className="font-medium text-gray-100 text-sm truncate">{title}</div>}
        {subtitle && <div className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
  if (href) return <a href={href} className="no-underline block">{inner}</a>;
  return <div onClick={onClick}>{inner}</div>;
}
