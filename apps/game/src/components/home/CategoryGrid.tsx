// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_WAP_ICONS } from '@/utils/tainguyen';

interface Category {
  id: number;
  name: string;
  slug?: string;
  image?: string;
}

export const CategoryGrid: React.FC<{ categories: Category[]; maxItems?: number }> = ({
  categories,
  maxItems = 8,
}) => (
  <div className="grid grid-cols-4 gap-3">
    {categories.slice(0, maxItems).map(c => {
      const icon = c.image || CATEGORY_WAP_ICONS[c.slug || ''] || CATEGORY_WAP_ICONS.default;
      return (
        <Link
          key={c.id}
          to={`/games?category=${c.id}`}
          className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl p-3 transition-colors group"
        >
          <img
            src={icon}
            alt={c.name}
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium text-center leading-tight">
            {c.name}
          </span>
        </Link>
      );
    })}
  </div>
);
