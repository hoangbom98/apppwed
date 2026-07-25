// packages/shared-ui/src/components/TicketList.tsx
import React from 'react';
import { Tag } from 'antd';

interface Ticket {
  id:         string | number;
  subject:    string;
  status:     string;
  createdAt?: string;
  [key: string]: any;
}

interface TicketListProps {
  tickets?:       Ticket[];
  loading?:       boolean;
  onSelect?:      (ticket: Ticket) => void;
  onSelectTicket?: (ticket: Ticket) => void;
  apiClient?:     any;
}

const STATUS_COLOR: Record<string, string> = {
  open:     'blue',
  pending:  'orange',
  answered: 'green',
  resolved: 'default',
  closed:   'default',
};

export const TicketList: React.FC<TicketListProps> = ({
  tickets = [], loading = false, onSelect, onSelectTicket,
}) => {
  const handleSelect = (ticket: Ticket) => {
    onSelect?.(ticket);
    onSelectTicket?.(ticket);
  };
  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}>Đang tải...</div>;
  if (!tickets.length) return <div style={{ textAlign: 'center', padding: 24, color: '#8892b0' }}>Chưa có yêu cầu hỗ trợ</div>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {tickets.map((t) => (
        <li key={t.id}
            onClick={() => handleSelect(t)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', cursor: onSelect ? 'pointer' : 'default' }}>
          <span>{t.subject}</span>
          <Tag color={STATUS_COLOR[t.status] ?? 'default'}>{t.status}</Tag>
        </li>
      ))}
    </ul>
  );
};
