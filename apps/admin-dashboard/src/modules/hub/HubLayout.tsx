// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@admin/api/client';

const fetchDashboardData = async () => {
  // Thay '/hub/stats' bằng endpoint thật của bạn
  const { data } = await api.get('/hub/stats');
  return data;
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'event', label: 'Sự kiện' },
  { key: 'time', label: 'Thời gian' },
];

export default function HubLayout() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hubStats'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>Có lỗi xảy ra khi tải dữ liệu.</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Hub Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 shadow rounded">
          <p className="text-sm text-gray-500">Tổng Nạp</p>
          <p className="text-2xl font-bold">{data.totalDeposit}</p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <p className="text-sm text-gray-500">Tổng Rút</p>
          <p className="text-2xl font-bold">{data.totalWithdraw}</p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <p className="text-sm text-gray-500">Người dùng mới</p>
          <p className="text-2xl font-bold">{data.newUsers}</p>
        </div>
      </div>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-gray-800/50 text-gray-400 uppercase text-[10px] tracking-wider">
            {columns.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {(data.recentEvents ?? []).map((row: any, i: number) => (
            <tr key={i} className="hover:bg-gray-800/30">
              {columns.map(c => <td key={c.key} className="px-4 py-3 text-gray-300">{row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
