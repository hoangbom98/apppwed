// frontend/admin-dashboard/src/modules/shared/pages/Transactions.jsx
// Antd — Table, Tag, Button, DatePicker, Select, Space, Typography
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table, Tag, Button, Select, Space, Typography, Flex, DatePicker,
} from 'antd';
import { DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TYPE_COLOR  = { deposit: 'success', withdraw: 'error', adjustment: 'processing', refund: 'purple', bet: 'warning', win: 'cyan' };
const TYPE_LABEL  = { deposit: 'Nạp', withdraw: 'Rút', adjustment: 'Điều chỉnh', refund: 'Hoàn', bet: 'Cược', win: 'Thắng' };
const STATUS_COLOR= { completed: 'success', pending: 'warning', failed: 'error', success: 'success' };
const STATUS_LABEL= { completed: 'Hoàn thành', pending: 'Chờ duyệt', failed: 'Thất bại', success: 'Thành công' };

function exportCsv(rows) {
  const headers = ['ID','User','Loại','Số tiền','Trước','Sau','Trạng thái','Ghi chú','Thời gian'];
  const lines = rows.map(r => [
    r.id, r.user?.username ?? r.userId, r.type,
    r.amount, r.balanceBefore, r.balanceAfter,
    r.status, r.note ?? '', new Date(r.createdAt).toLocaleString('vi'),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv  = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function Transactions() {
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransactions', page, status, type, from, to],
    queryFn:  () => api.get('/admin/finance/transactions', {
      params: { page, limit: 20, status: status||undefined, type: type||undefined, from: from||undefined, to: to||undefined },
    }).then(r => r.data),
  });
  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns = [
    { title: 'ID',       dataIndex: 'id',     key: 'id',     width: 80,  render: v => <Text className="font-mono text-[11px]">{String(v).slice(0,8)}</Text> },
    { title: 'User',     key: 'user',                                     render: (_,r) => r.user?.username ?? r.user?.email ?? r.userId },
    { title: 'Loại',     dataIndex: 'type',   key: 'type',   width: 100, render: v => <Tag color={TYPE_COLOR[v]??'default'}>{TYPE_LABEL[v]??v}</Tag> },
    { title: 'Số tiền',  dataIndex: 'amount', key: 'amount', width: 130,
      render: v => <Text className={`font-mono font-bold ${Number(v)<0?'text-red-500':'text-emerald-500'}`}>
        {Number(v)>0?'+':''}{Number(v).toLocaleString('vi')}₫</Text> },
    { title: 'Số dư trước', dataIndex: 'balanceBefore', key: 'before', render: v => v!=null ? <Text type="secondary" className="text-[11px]">{Number(v).toLocaleString('vi')}</Text> : '—' },
    { title: 'Số dư sau',   dataIndex: 'balanceAfter',  key: 'after',  render: v => v!=null ? <Text type="secondary" className="text-[11px]">{Number(v).toLocaleString('vi')}</Text> : '—' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v]??'default'}>{STATUS_LABEL[v]??v??'—'}</Tag> },
    { title: 'Ghi chú',  dataIndex: 'note', key: 'note', ellipsis: true, render: v => v ?? '—' },
    { title: 'Thời gian',dataIndex: 'createdAt', key: 'time', render: v => <Text type="secondary" className="text-[11px]">{new Date(v).toLocaleString('vi')}</Text> },
  ];

  const STATUS_BTNS = [['','Tất cả'],['pending','Chờ'],['completed','Xong'],['failed','Lỗi']];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Giao dịch (Ledger)</Title>
        <Button icon={<DownloadOutlined />} disabled={!rows.length} onClick={() => exportCsv(rows)}>
          Export CSV
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap={12} wrap="wrap" align="flex-end" className="mb-4">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Trạng thái</Text>
          <Space size={4}>
            {STATUS_BTNS.map(([v,l]) => (
              <Button key={v} size="small" type={status===v?'primary':'default'}
                onClick={() => { setStatus(v); setPage(1); }}>{l}</Button>
            ))}
          </Space>
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Loại</Text>
          <Select size="small" className="w-[140px]" value={type} onChange={v => { setType(v); setPage(1); }}
            options={[{ label: 'Tất cả', value: '' }, ...['deposit','withdraw','adjustment','refund','bet','win'].map(t => ({ label: TYPE_LABEL[t]??t, value: t }))]}
          />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Từ ngày</Text>
          <DatePicker size="small" value={from ? dayjs(from) : null}
            onChange={d => { setFrom(d?.format('YYYY-MM-DD') ?? ''); setPage(1); }}
            placeholder="Từ ngày" className="w-[130px]" />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Đến ngày</Text>
          <DatePicker size="small" value={to ? dayjs(to) : null}
            onChange={d => { setTo(d?.format('YYYY-MM-DD') ?? ''); setPage(1); }}
            placeholder="Đến ngày" className="w-[130px]" />
        </div>
        {(status||type||from||to) && (
          <Button size="small" icon={<ClearOutlined />} onClick={() => { setStatus(''); setType(''); setFrom(''); setTo(''); setPage(1); }}>
            Xoá filter
          </Button>
        )}
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 1000 }}
        pagination={{
          current: page, pageSize: 20, total,
          showSizeChanger: false,
          showTotal: t => `${t} giao dịch`,
          onChange: p => setPage(p),
        }}
      />
    </div>
  );
}
