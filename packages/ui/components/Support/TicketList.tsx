// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle, ChevronRight, Loader } from 'lucide-react';

const STATUS_CONFIG = {
  open:        { label: 'Chờ xử lý', color: 'text-yellow-600 bg-yellow-50', Icon: Clock },
  in_progress: { label: 'Đang xử lý', color: 'text-blue-600 bg-blue-50',   Icon: AlertCircle },
  resolved:    { label: 'Đã giải quyết', color: 'text-green-600 bg-green-50', Icon: CheckCircle },
  closed:      { label: 'Đã đóng',     color: 'text-gray-500 bg-gray-100',  Icon: XCircle },
};

const PRIORITY_COLOR = {
  low:      'text-gray-500',
  medium:   'text-blue-500',
  high:     'text-orange-500',
  critical: 'text-red-500',
};

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * TicketList – shows the current user's support tickets.
 *
 * Props:
 *   apiClient        {object}   axios-like instance
 *   onSelectTicket   {function} called with ticket when user taps on one
 */
export default function TicketList({ apiClient, onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .get('/support/tickets')
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setTickets(Array.isArray(data) ? data : []);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [apiClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader size={28} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Bạn chưa có yêu cầu hỗ trợ nào.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {tickets.map((ticket) => {
        const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
        const Icon = cfg.Icon;
        return (
          <button
            key={ticket.id}
            onClick={() => onSelectTicket?.(ticket)}
            className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className={`flex-shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-full ${cfg.color}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs font-medium ${cfg.color} px-1.5 py-0.5 rounded-full`}>
                  {cfg.label}
                </span>
                <span className={`text-xs font-medium ${PRIORITY_COLOR[ticket.priority] ?? 'text-gray-500'}`}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-400">{fmt(ticket.createdAt)}</span>
              </div>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 text-gray-300 mt-1" />
          </button>
        );
      })}
    </div>
  );
}
