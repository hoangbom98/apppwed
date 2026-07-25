// @ts-nocheck
/**
 * FeeConfigPage.tsx — Quản lý cấu hình phí nội bộ
 *
 * Bảng FeeConfig: source × txType → PERCENTAGE | FIXED
 * Actions: upsert (modal), toggle active, delete, seed defaults
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Typography,
  Space, Switch, Tooltip, App, Popconfirm, Alert, Flex,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { feeConfigApi } from './api';

const { Title, Text } = Typography;

const SOURCE_OPTS = [
  { label: 'Game',   value: 'GAME'   },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Trade',  value: 'TRADE'  },
  { label: 'Dating', value: 'DATING' },
  { label: 'Hub',    value: 'HUB'    },
];
const TX_TYPE_OPTS = [
  { label: 'BET',      value: 'BET'      },
  { label: 'WIN',      value: 'WIN'      },
  { label: 'WITHDRAW', value: 'WITHDRAW' },
  { label: 'DEPOSIT',  value: 'DEPOSIT'  },
];
const FEE_TYPE_OPTS = [
  { label: 'Phần trăm (%)', value: 'PERCENTAGE' },
  { label: 'Cố định (VND)', value: 'FIXED'      },
];

const SOURCE_COLOR: Record<string, string> = {
  GAME: '#3b82f6', SPORTS: '#10b981', TRADE: '#f59e0b', DATING: '#ec4899', HUB: '#8b5cf6',
};

export default function FeeConfigPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form]       = Form.useForm();
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['fee-configs'],
    queryFn:  feeConfigApi.list,
    staleTime: 30_000,
  });

  const upsertMut = useMutation({
    mutationFn: (body: object) => feeConfigApi.upsert(body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['fee-configs'] });
      setOpen(false); form.resetFields();
      message.success('Đã lưu cấu hình phí');
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Lỗi lưu'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      feeConfigApi.toggle(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-configs'] }),
    onError:   () => message.error('Lỗi khi thay đổi trạng thái'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => feeConfigApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['fee-configs'] });
      message.success('Đã xoá');
    },
    onError: () => message.error('Lỗi khi xoá'),
  });

  const seedMut = useMutation({
    mutationFn: feeConfigApi.seed,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['fee-configs'] });
      message.success('Đã seed cấu hình phí mặc định');
    },
    onError: () => message.error('Lỗi seed'),
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, feeType: 'PERCENTAGE' });
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      source:     row.source,
      txType:     row.txType,
      feeType:    row.feeType,
      value:      row.value,
      minAmount:  row.minAmount,
      maxAmount:  row.maxAmount,
      maxFee:     row.maxFee,
      description: row.description,
      isActive:   row.isActive,
    });
    setOpen(true);
  };

  const onFinish = (vals: any) => upsertMut.mutate(vals);

  const columns = [
    {
      title: 'Dự án', dataIndex: 'source', key: 'source', width: 90,
      render: (v: string) => (
        <Tag color={SOURCE_COLOR[v]} style={{ fontWeight: 700, fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: 'Loại GD', dataIndex: 'txType', key: 'txType', width: 90,
      render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: 'Kiểu phí', dataIndex: 'feeType', key: 'feeType', width: 100,
      render: (v: string) => (
        <Text style={{ fontSize: 12 }}>{v === 'PERCENTAGE' ? '% Phần trăm' : 'Cố định'}</Text>
      ),
    },
    {
      title: 'Giá trị', dataIndex: 'value', key: 'value', width: 90,
      render: (v: number, r: any) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {r.feeType === 'PERCENTAGE' ? `${v}%` : `${Number(v).toLocaleString('vi')}đ`}
        </Text>
      ),
    },
    {
      title: 'Min GD', dataIndex: 'minAmount', key: 'min', width: 100,
      render: (v: number | null) => v ? <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{Number(v).toLocaleString('vi')}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Phí tối đa', dataIndex: 'maxFee', key: 'maxFee', width: 100,
      render: (v: number | null) => v ? <Text style={{ fontSize: 11, color: '#f59e0b', fontFamily: 'monospace' }}>{Number(v).toLocaleString('vi')}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'desc',
      render: (v: string) => <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Kích hoạt', dataIndex: 'isActive', key: 'active', width: 90,
      render: (v: boolean, r: any) => (
        <Switch
          size="small" checked={v}
          loading={toggleMut.isPending}
          onChange={(checked) => toggleMut.mutate({ id: r.id, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác', key: 'actions', width: 90,
      render: (_: any, r: any) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm
            title="Xoá cấu hình phí này?"
            onConfirm={() => deleteMut.mutate(r.id)}
            okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Cấu hình phí nội bộ</Title>
        <Space>
          <Tooltip title="Tạo bộ phí mặc định được khuyến nghị (idempotent)">
            <Button
              icon={<ThunderboltOutlined />}
              loading={seedMut.isPending}
              onClick={() => seedMut.mutate()}
            >
              Seed mặc định
            </Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm cấu hình
          </Button>
        </Space>
      </Flex>

      <Alert
        type="info" showIcon style={{ marginBottom: 12, fontSize: 12 }}
        message="Phí được tính tự động khi user thực hiện BET/WIN/WITHDRAW. Tắt switch để tạm dừng thu phí từng loại."
      />

      <Table
        dataSource={rows as any[]}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 800 }}
        pagination={false}
      />

      {/* ── Upsert Modal ─── */}
      <Modal
        open={open}
        title={editing ? 'Sửa cấu hình phí' : 'Thêm cấu hình phí'}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Lưu" cancelText="Huỷ"
        okButtonProps={{ loading: upsertMut.isPending }}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 12 }}>
          <Flex gap={12}>
            <Form.Item name="source" label="Dự án (Source)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={SOURCE_OPTS} placeholder="Chọn dự án" disabled={!!editing} />
            </Form.Item>
            <Form.Item name="txType" label="Loại GD" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={TX_TYPE_OPTS} placeholder="Loại giao dịch" disabled={!!editing} />
            </Form.Item>
          </Flex>
          <Flex gap={12}>
            <Form.Item name="feeType" label="Kiểu phí" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={FEE_TYPE_OPTS} />
            </Form.Item>
            <Form.Item
              name="value"
              label="Giá trị"
              rules={[{ required: true, type: 'number', min: 0, transform: Number }]}
              style={{ flex: 1 }}
            >
              <Input type="number" suffix={
                <Form.Item noStyle dependencies={['feeType']}>
                  {({ getFieldValue }) => getFieldValue('feeType') === 'PERCENTAGE' ? '%' : 'đ'}
                </Form.Item>
              } />
            </Form.Item>
          </Flex>
          <Flex gap={12}>
            <Form.Item name="minAmount" label="Số tiền tối thiểu GD" style={{ flex: 1 }}>
              <Input type="number" placeholder="Không giới hạn" />
            </Form.Item>
            <Form.Item name="maxFee" label="Phí tối đa (cap)" style={{ flex: 1 }}>
              <Input type="number" placeholder="Không giới hạn" />
            </Form.Item>
          </Flex>
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="Ghi chú cho cấu hình này..." />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
