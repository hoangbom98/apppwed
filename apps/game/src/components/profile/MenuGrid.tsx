import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface MenuItemDef {
  icon: LucideIcon;
  label: string;
  key: string;
}

interface MenuGridProps {
  items: MenuItemDef[];
  onItemClick?: (key: string) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ items, onItemClick }) => {
  const navigate = useNavigate();

  const handleClick = (key: string) => {
    if (onItemClick) {
      onItemClick(key);
    } else {
      navigate(`/profile/${key}`);
    }
  };

  return (
    <div className="menu-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className="menu-item"
            onClick={() => handleClick(item.key)}
          >
            <Icon size={28} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MenuGrid;
