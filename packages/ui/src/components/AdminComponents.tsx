import React, { useState } from 'react';
import { Tag, Card, Statistic, Table, TableProps, Form, Input, InputProps, Select, SelectProps, InputNumber } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// 1. Status Tag
export const LkvipStatusTag: React.FC<{
  status: string;
  type?: 'status' | 'source';
}> = ({ status, type = 'status' }) => {
  const statusColors: Record<string, string> = {
    ACTIVE: 'error', PAID: 'success', // Status
    GAME: '#3b82f6', SPORTS: '#10b981', TRADE: '#f59e0b', DATING: '#ec4899', HUB: '#8b5cf6', // Source
  };

  return (
    <Tag color={statusColors[status] || 'default'} style={{ fontWeight: 600, fontSize: 11 }}>
      {status}
    </Tag>
  );
};

// 2. Stat Card
export const LkvipStatCard: React.FC<{
  title: string;
  value: string | number;
  suffix?: string;
  color?: string;
}> = ({ title, value, suffix, color }) => (
  <Card size="small">
    <Statistic
      title={title}
      value={value}
      suffix={suffix}
      valueStyle={{ color: color || '#333', fontSize: 16, fontFamily: 'monospace' }}
    />
  </Card>
);

// 3. Standard Table
export const LkvipTable: React.FC<TableProps<any>> = (props) => (
  <Table
    size="small"
    scroll={{ x: 700 }}
    pagination={{ pageSize: 20, showTotal: (t) => `${t} mục` }}
    {...props}
  />
);

// 4. Standard Form Components
export const LkvipForm: React.FC<React.ComponentProps<typeof Form>> = (props) => (
  <Form layout="vertical" {...props} />
);

export const LkvipInput: React.FC<InputProps> = (props) => <Input size="large" {...props} />;
export const LkvipSelect: React.FC<SelectProps> = (props) => <Select size="large" {...props} />;
export const LkvipInputNumber: React.FC<any> = (props) => <InputNumber size="large" style={{ width: '100%' }} {...props} />;

// 5. Sidebar Components
export const LkvipSidebarItem: React.FC<{ item: any; collapsed: boolean }> = ({ item, collapsed }) => (
  <NavLink
    to={item.to}
    end={item.end}
    title={collapsed ? item.label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
      }`
    }
  >
    <item.icon size={16} className="flex-shrink-0" />
    {!collapsed && <span className="truncate">{item.label}</span>}
  </NavLink>
);

export const LkvipSidebarGroup: React.FC<{ group: any; collapsed: boolean; defaultOpen?: boolean }> = ({ group, collapsed, defaultOpen = false }) => {
  const { pathname } = useLocation();
  const hasActive = group.items.some((item: any) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to)
  );
  const [open, setOpen] = useState(defaultOpen || hasActive);

  if (!group.label) {
    return (
      <div>
        {group.items.map((item: any) => (
          <LkvipSidebarItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-1">
      {!collapsed && (
        <button
          onClick={() => setOpen(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            hasActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{group.label}</span>
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      {collapsed && <div className="h-px bg-gray-800 mx-2 my-1" />}
      {(open || collapsed) && (
        <div>
          {group.items.map((item: any) => (
            <LkvipSidebarItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
};
