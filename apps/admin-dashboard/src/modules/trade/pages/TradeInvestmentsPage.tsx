// @ts-nocheck
// frontend/admin-dashboard/src/modules/trade/pages/TradeInvestmentsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Select, Modal, Form,
  Input, InputNumber, Switch, App, Typography, Flex,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import type { ColumnType } from 'antd/es/table';

const { Text } = Typography;

const INV_STATUS_TAG: Record<string, string> = { ACTIVE: 'processing', COMPLETED: 'success', CANCELLED: 'error' };
const INV_STATUS_LABEL: Record<string, string> = { ACTIVE: 'Đang chạy', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ' };

// ── Investments list ─────────────────────────────────────────────────────────
function InvestmentsList() {
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-investments', page, status],
    queryFn:  () => api.get('/trade/admin/investments', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows: any[]    = data?.data ?? [];
  const total: number  = data?.total ?? data?.meta?.total ?? 0;

  const columns: ColumnType<any>[] = [
    {
      title: 'Người dùng', key: 'user',
      render: (_, r) => (
        <div>
          <div>{r.user?.fullName ?? r.user?.email ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.userId}</Text>
        </div>
      ),
    },
    {
      title: 'Gói', key: 'package',
      render: (_, r) => r.package?.name ?? r.packageId,
    },
    {
      title: 'Số tiền', dataIndex: 'amount', key: 'amount',
      render: v => <Text strong>{Number(v).toLocaleString('vi')} USD</Text>,
    },
    {
      title: 'Lãi đã trả', dataIndex: 'profitPaid', key: 'profitPaid',
      render: v => <Text type="success">{Number(v ?? 0).toFixed(2)} USD</Text>,
    },
    {
      title: 'Bắt đầu', key: 'startDate',
      render: (_, r) => new Date(r.startDate).toLocaleDateString('vi'),
    },
    {
      title: 'Kết thúc', key: 'endDate',
      render: (_, r) => new Date(r.endDate).toLocaleDateString('vi'),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Tag color={INV_STATUS_TAG[s] ?? 'default'}>{INV_STATUS_LABEL[s] ?? s}</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Đầu tư</div>
          <Text type="secondary">Lịch sử đầu tư của người dùng</Text>
        </div>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 180 }}
          options={[
            { value: '',          label: 'Tất cả' },
            { value: 'ACTIVE',    label: 'Đang chạy' },
            { value: 'COMPLETED', label: 'Hoàn thành' },
            { value: 'CANCELLED', label: 'Đã huỷ' },
          ]}
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
    </div>
  );
}

// ── Package management modal ──────────────────────────────────────────────────
function PackageModal({ record, onClose }: { record: any | null; onClose: () => void }) {
  const { message } = App.useApp();
  const qc  = useQueryClient();
  const [form] = Form.useForm();

  const saveMut = useMutation({
    mutationFn: (values: any) => record
      ? api.patch(`/trade/admin/investment/packages/${record.id}`, values)
      : api.post('/trade/admin/investment/packages', values),
    onSuccess: () => {
      message.success(record ? 'Đã cập nhật gói' : 'Đã tạo gói mới');
      qc.invalidateQueries({ queryKey: ['trade-admin-packages'] });
      onClose();
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  return (
    <Modal
      open title={record ? 'Sửa gói đầu tư' : 'Tạo gói đầu tư'}
      onCancel={onClose} onOk={() => form.submit()} confirmLoading={saveMut.isPending}
      okText="Lưu" cancelText="Huỷ"
    >
      <Form form={form} layout="vertical" initialValues={record ?? { isActive: true, minAmount: 0, maxAmount: 0 }}
        onFinish={v => saveMut.mutate(v)}>
        <Form.Item name="name" label="Tên gói" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="dailyProfit" label="Lãi suất ngày (%)" rules={[{ required: true }]}>
          <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="duration" label="Thời hạn (ngày)" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="minAmount" label="Tối thiểu (USD)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="maxAmount" label="Tối đa (USD, 0 = không giới hạn)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Packages list ─────────────────────────────────────────────────────────────
function PackagesList() {
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-packages'],
    queryFn:  () => api.get('/trade/admin/investment/packages').then(r => r.data),
  });
  const rows: any[] = data?.data ?? data ?? [];

  const columns: ColumnType<any>[] = [
    { title: 'Tên gói', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    { title: 'Lãi/ngày', dataIndex: 'dailyProfit', key: 'dailyProfit', render: v => `${v}%` },
    { title: 'Thời hạn', dataIndex: 'duration', key: 'duration', render: v => `${v} ngày` },
    { title: 'Tối thiểu', dataIndex: 'minAmount', key: 'minAmount', render: v => `${Number(v ?? 0).toLocaleString('vi')} USD` },
    { title: 'Tối đa', dataIndex: 'maxAmount', key: 'maxAmount', render: v => Number(v) === 0 ? '∞' : `${Number(v).toLocaleString('vi')} USD` },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: v => <Tag color={v ? 'success' : 'default'}>{v ? 'Hoạt động' : 'Ẩn'}</Tag> },
    {
      title: '', key: 'action',
      render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(r)}>Sửa</Button>,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Gói đầu tư</div>
          <Text type="secondary">Quản lý danh sách gói đầu tư</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>Tạo gói mới</Button>
      </Flex>
      <Table dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle" pagination={false} />
      {(editing || creating) && (
        <PackageModal record={editing} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </div>
  );
}

// ── Default export: tab-based combined page ───────────────────────────────────
export { InvestmentsList, PackagesList };
export default InvestmentsList;
