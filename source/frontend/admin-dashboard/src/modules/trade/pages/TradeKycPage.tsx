// frontend/admin-dashboard/src/modules/trade/pages/TradeKycPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Input, App, Typography, Flex } from 'antd';
import api from '@admin/api/client';
import { ColumnType } from 'antd/es/table';

const { Text } = Typography;
const STATUS_TAG: Record<string, string> = { pending: 'warning', verified: 'success', rejected: 'error' };
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ duyệt', verified: 'Đã xác minh', rejected: 'Từ chối' };

export default function TradeKycPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('pending');
  const [notes, setNotes]   = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-kyc', page, status],
    queryFn:  () => api.get('/trade/admin/kyc/pending', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows: any[] = data?.data ?? [];
  const total: number = data?.total ?? data?.meta?.total ?? 0;

  const approveMut = useMutation({
    mutationFn: (id: string | number) => api.put(`/trade/admin/kyc/${id}/approve`, { action: 'approve' }),
    onSuccess: () => { message.success('Đã duyệt KYC'); qc.invalidateQueries({ queryKey: ['trade-admin-kyc'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string | number, note: string }) => api.put(`/trade/admin/kyc/${id}/approve`, { action: 'reject', rejectionNote: note || 'Tài liệu không hợp lệ' }),
    onSuccess: () => { message.success('Đã từ chối KYC'); qc.invalidateQueries({ queryKey: ['trade-admin-kyc'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns: ColumnType<any>[] = [
    {
      title: 'User', key: 'user',
      render: (_, k: any) => (
        <div>
          <div>{k.user?.username ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{k.userId}</Text>
        </div>
      ),
    },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', render: v => v ?? '—' },
    { title: 'CCCD/Hộ chiếu', key: 'idNum', render: (_, k: any) => <Text code>{k.idNumber ?? k.documentNumber ?? '—'}</Text> },
    {
      title: 'Tài liệu', key: 'docs',
      render: (_, k: any) => {
        const count = (k.documents ?? k.files ?? []).length;
        return count > 0 ? <Tag color="blue">{count} files</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Ngày nộp', key: 'createdAt', render: (_, k: any) => new Date(k.createdAt ?? k.created_at).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, k: any) => k.status === 'pending' ? (
        <Space direction="vertical" size="small">
          <Space size="small">
            <Button type="primary" size="small" onClick={() => approveMut.mutate(k.id)} loading={approveMut.isPending}>Duyệt</Button>
            <Button danger size="small" onClick={() => rejectMut.mutate({ id: k.id, note: notes[k.id] })} loading={rejectMut.isPending}>Từ chối</Button>
          </Space>
          <Input
            size="small" placeholder="Lý do từ chối..."
            value={notes[k.id] ?? ''}
            onChange={e => setNotes(n => ({ ...n, [k.id]: e.target.value }))}
            style={{ width: 160 }}
          />
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Xác minh KYC</div>
          <Text type="secondary">Duyệt hồ sơ định danh người dùng</Text>
        </div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 160 }}
          options={[
            { value: '',         label: 'Tất cả' },
            { value: 'pending',  label: 'Chờ duyệt' },
            { value: 'verified', label: 'Đã duyệt' },
            { value: 'rejected', label: 'Từ chối' },
          ]}
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
    </div>
  );
}
