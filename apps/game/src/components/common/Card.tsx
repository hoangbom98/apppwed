// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  image?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  link?: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  image, title, subtitle, badge, link, className = '', onClick, children,
}) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer ${className}`}
    onClick={onClick}
  >
    {image && (
      <div className="relative">
        <img src={image} alt={title} className="w-full h-44 object-cover" loading="lazy" />
        {badge && (
          <span className="absolute top-2 right-2 bg-accent text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    )}
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      {link && (
        <Link to={link} className="mt-2 inline-block text-primary dark:text-accent text-sm font-medium hover:underline">
          Xem chi tiết →
        </Link>
      )}
      {children}
    </div>
  </div>
);

export default Card;
