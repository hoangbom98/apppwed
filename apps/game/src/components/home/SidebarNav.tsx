import React from 'react';

interface SidebarNavItem {
  key: string;
  label: string;
  icon: string;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ items, activeKey, onSelect }) => {
  return (
    <div className="game-sidebar">
      {items.map((item) => (
        <button
          key={item.key}
          className={`sidebar-item ${activeKey === item.key ? 'active' : ''}`}
          onClick={() => onSelect(item.key)}
        >
          <img src={item.icon} alt={item.label} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SidebarNav;
