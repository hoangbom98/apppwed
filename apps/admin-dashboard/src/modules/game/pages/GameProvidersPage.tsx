import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Input, Modal, Form, Select,
  App, Typography, Flex, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_TAG   = { active: 'success', inactive: 'default', maintenance: 'warning' };
const STATUS_LABEL = { active: 'Hoạt động', inactive: 'Tắt', maintenance: 'Bảo trì' };

// ── Products sub-modal ────────────────────────────────────────────────────────
function ProductsModal({ aggregator, onClose }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-provider-products', aggregator.id, page],
    queryFn:  () => api.get(`/admin/game/providers/${aggregator.id}/products`, { params: { page, limit: 30 } }).then(r => r.data),
    enabled:  !!aggregator?.id,
  });
  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const cols = [
    { title: 'Tên',      dataIndex: 'name',      key: 'name' },
    { title: 'Code',     dataIndex: 'code',       key: 'code', render: v => <Text code>{v}</Text> },
    { title: 'Games',    key: 'games',            render: (_, r) => r._count?.games ?? '—' },
    { title: 'Trạng thái', dataIndex: 'status',  key: 'status', render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag> },
    { title: 'Thứ tự',   dataIndex: 'sortOrder',  key: 'sortOrder' },
  ];

  return (
    <Modal
      open
      title={<span>Sản phẩm — <Text type="warning">{aggregator.name}</Text> <Text type="secondary">[{aggregator.code}]</Text></span>}
      onCancel={onClose}
      footer={null}
      width={680}
    >
      <Table
        dataSource={rows} columns={cols} loading={isLoading} rowKey="id" size="small"
        pagination={{ current: page, pageSize: 30, total, onChange: p => setPage(p), showSizeChanger: false }}
      />
    </Modal>
  );
}

// ── Provider form modal ───────────────────────────────────────────────────────
function ProviderFormModal({ editing, onClose }) {
  const isNew = !editing?.id;
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const mut = useMutation({
    mutationFn: values => {
      const body = { ...values, sortOrder: Number(values.sortOrder ?? 0) };
      if (!isNew && !body.secretKey) delete body.secretKey;
      return isNew
        ? api.post('/admin/game/providers', body)
        : api.patch(`/admin/game/providers/${editing.id}`, body);
    },
    onSuccess: () => {
      message.success(isNew ? 'Đã tạo provider' : 'Đã cập nhật');
      qc.invalidateQueries({ queryKey: ['admin-game-providers'] });
      onClose();
    },
    onError: e => message.error(e?.response?.data?.message ?? 'Có lỗi xảy ra'),
  });

  return (
    <Modal
      open
      title={isNew ? '+ Thêm Provider' : `Sửa: ${editing.name}`}
      onCancel={onClose}
      onOk={() => form.validateFields().then(vals => mut.mutate(vals))}
      okText={isNew ? 'Tạo mới' : 'Lưu thay đổi'}
      confirmLoading={mut.isPending}
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={editing ?? { status: 'active', sortOrder: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input disabled={!isNew} placeholder="VD: gsc" />
          </Form.Item>
          <Form.Item name="name" label="Tên provider" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="description" label="Mô tả"><Input /></Form.Item>
        <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="apiKey" label="API Key" rules={[{ required: isNew }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="secretKey" label={isNew ? 'Secret Key' : 'Secret Key (trống = giữ nguyên)'}>
            <Input.Password />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="status" label="Trạng thái">
            <Select options={[
              { value: 'active',      label: 'Hoạt động' },
              { value: 'inactive',    label: 'Tắt' },
              { value: 'maintenance', label: 'Bảo trì' },
            ]} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GameProvidersPage() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [editing, setEditing]   = useState(null);
  const [products, setProducts] = useState(null);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-game-providers', search, statusF],
    queryFn:  () => api.get('/admin/game/providers', {
      params: { limit: 100, search: search || undefined, status: statusF || undefined },
    }).then(r => r.data),
    staleTime: 60_000,
  });
  const rows = data?.data ?? data ?? [];

  const toggleMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/game/providers/${id}/status`, { status }),
    onSuccess:  () => { message.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['admin-game-providers'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    {
      title: 'Tên',
      key: 'name',
      render: (_, p) => (
        <div>
          <div>{p.name}</div>
          {p.description && <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: p.description }}>{p.description}</Text>}
        </div>
      ),
    },
    { title: 'Code',     dataIndex: 'code',     key: 'code', render: v => <Text code>{v}</Text> },
    { title: 'Base URL', dataIndex: 'baseUrl',  key: 'baseUrl', ellipsis: true, render: v => v ?? '—' },
    { title: 'Sản phẩm', key: 'products',       render: (_, p) => p._count?.products ?? '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Thứ tự', dataIndex: 'sortOrder', key: 'sortOrder', render: v => v ?? 0 },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, p) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(p)}>Sửa</Button>
          <Button size="small" icon={<AppstoreOutlined />} onClick={() => setProducts(p)}>Products</Button>
          {p.status !== 'maintenance' && (
            <Button
              size="small"
              type={p.status === 'active' ? 'default' : 'primary'}
              danger={p.status === 'active'}
              loading={toggleMut.isPending}
              onClick={() => toggleMut.mutate({ id: p.id, status: p.status === 'active' ? 'inactive' : 'active' })}
            >
              {p.status === 'active' ? 'Tắt' : 'Bật'}
            </Button>
          )}
          {p.status !== 'maintenance' && (
            <Button
              size="small"
              loading={toggleMut.isPending}
              onClick={() => toggleMut.mutate({ id: p.id, status: 'maintenance' })}
            >
              Bảo trì
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Game Providers / Aggregators</div>
          <Text type="secondary">Tổng: {rows.length} providers</Text>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="Tìm tên/code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={statusF}
            onChange={v => setStatusF(v)}
            style={{ width: 140 }}
            options={[
              { value: '',             label: 'Tất cả' },
              { value: 'active',       label: 'Hoạt động' },
              { value: 'inactive',     label: 'Tắt' },
              { value: 'maintenance',  label: 'Bảo trì' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
            Thêm Provider
          </Button>
        </Space>
      </Flex>

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={false}
      />

      {editing !== null && <ProviderFormModal editing={editing} onClose={() => setEditing(null)} />}
      {products !== null && <ProductsModal aggregator={products} onClose={() => setProducts(null)} />}
    </div>
  );
}
