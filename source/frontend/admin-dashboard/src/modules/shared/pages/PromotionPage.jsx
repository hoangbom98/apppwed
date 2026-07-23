// frontend/admin-dashboard/src/modules/shared/pages/PromotionPage.jsx
// Promotion management: list, create, edit, toggle status, participant view.
// Route: /promotions
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Select, Modal, Form, DatePicker, InputNumber,
  Typography, Space, App, Flex,
} from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined, PoweroffOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function fmt(n) { return n == null ? '—' : Number(n).toLocaleString('vi-VN'); }

const PROMO_TYPES  = ['WELCOME', 'DEPOSIT', 'CASHBACK', 'FREE_SPIN', 'REFERRAL', 'EVENT', 'VIP'];
const VALUE_TYPES  = ['PERCENTAGE', 'FIXED', 'FREE_SPIN'];
const STATUS_LIST  = ['ACTIVE', 'INACTIVE', 'SCHEDULED', 'EXPIRED'];

const STATUS_COLOR = { ACTIVE: 'success', INACTIVE: 'default', SCHEDULED: 'processing', EXPIRED: 'error' };
const TYPE_COLOR   = { WELCOME: 'cyan', DEPOSIT: 'blue', CASHBACK: 'purple', FREE_SPIN: 'gold', REFERRAL: 'magenta', EVENT: 'orange', VIP: 'red' };

// ── Participants sub-modal ─────────────────────────────────────────────────────
function ParticipantsModal({ promoId, promoTitle, onClose }) {
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promo-participants', promoId, page],
    queryFn:  () => api.get(`/admin/promotions/${promoId}/participants`, { params: { page, limit: 20 } }).then(r => r.data),
    enabled:  !!promoId,
  });
  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const cancelMut = useMutation({
    mutationFn: (pid) => api.patch(`/admin/promotions/participants/${pid}/cancel`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-promo-participants', promoId, page] }); message.success('Đã huỷ'); },
    onError:    () => message.error('Lỗi khi huỷ'),
  });

  const partColumns = [
    { title: 'User ID',    dataIndex: 'userId',           render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Bonus',      dataIndex: 'bonusAmount',      render: v => <Text className="text-xs">{fmt(v)}</Text> },
    { title: 'Đã wagering',dataIndex: 'wageringCompleted',render: v => fmt(v) },
    { title: 'Yêu cầu',   dataIndex: 'wageringRequired', render: v => fmt(v) },
    { title: 'TT',         dataIndex: 'status',           render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Tham gia',   dataIndex: 'joinedAt',         render: v => <Text type="secondary" className="text-xs">{v ? new Date(v).toLocaleString('vi') : '—'}</Text> },
    { title: '', key: 'cancel', width: 70, render: (_, p) => p.status === 'ACTIVE' ? <Button size="small" danger loading={cancelMut.isPending} onClick={() => cancelMut.mutate(p.id)}>Huỷ</Button> : null },
  ];

  return (
    <Modal open={!!promoId} onCancel={onClose} footer={null} title={`Người tham gia — ${promoTitle}`} width={720} destroyOnHidden>
      <Table
        dataSource={rows} columns={partColumns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 600 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `Tổng: ${t}`, onChange: p => setPage(p) }}
      />
    </Modal>
  );
}

// ── Promo form modal ───────────────────────────────────────────────────────────
function PromoFormModal({ editing, onClose, onSaved }) {
  const isNew = !editing?.id;
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (values) => {
      const body = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate:   values.endDate?.toISOString(),
      };
      return isNew ? api.post('/admin/promotions', body) : api.patch(`/admin/promotions/${editing.id}`, body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-promotions'] }); onSaved?.(); },
  });

  React.useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        ...editing,
        startDate: editing.startDate ? dayjs(editing.startDate) : undefined,
        endDate:   editing.endDate   ? dayjs(editing.endDate)   : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [editing, form]);

  return (
    <Modal
      open={editing !== null}
      title={isNew ? '+ Thêm khuyến mãi' : `Sửa: ${editing?.title}`}
      onOk={() => form.validateFields().then(v => mut.mutate(v))}
      onCancel={onClose}
      okText={isNew ? 'Tạo mới' : 'Lưu thay đổi'} cancelText="Huỷ"
      confirmLoading={mut.isPending}
      destroyOnHidden width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space className="w-full" size={8}>
          <Form.Item name="type" label="Loại" style={{ width: 200 }}>
            <Select options={PROMO_TYPES.map(t => ({ label: t, value: t }))} />
          </Form.Item>
          <Form.Item name="valueType" label="Kiểu giá trị" style={{ width: 200 }}>
            <Select options={VALUE_TYPES.map(t => ({ label: t, value: t }))} />
          </Form.Item>
        </Space>
        <Space className="w-full" size={8}>
          <Form.Item name="value" label="Giá trị">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="maxUses" label="Max sử dụng">
            <InputNumber className="w-full" />
          </Form.Item>
        </Space>
        <Space className="w-full" size={8}>
          <Form.Item name="startDate" label="Bắt đầu">
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item name="endDate" label="Kết thúc">
            <DatePicker showTime className="w-full" />
          </Form.Item>
        </Space>
        <Space className="w-full" size={8}>
          <Form.Item name="status" label="Trạng thái">
            <Select options={STATUS_LIST.map(s => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự">
            <InputNumber className="w-full" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PromotionPage() {
  const qc = useQueryClient();
  const [page,       setPage]    = useState(1);
  const [typeFilter, setType]    = useState('');
  const [statusFilter, setSt]   = useState('ACTIVE');
  const [search,     setSearch]  = useState('');
  const [editing,    setEditing] = useState(null);    // null=closed, {}=new, {...}=edit
  const [viewParts,  setVP]      = useState(null);    // { id, title }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions', page, typeFilter, statusFilter, search],
    queryFn:  () => api.get('/admin/promotions', {
      params: { page, limit: 20, type: typeFilter || undefined, status: statusFilter || undefined, search: search || undefined },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const toggleMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/promotions/${id}/status`, { status }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  const columns = [
    {
      title: 'Tiêu đề', key: 'title',
      render: (_, p) => (
        <div>
          <Text strong>{p.title}</Text>
          {p.shortDesc && <div><Text type="secondary" className="text-xs">{p.shortDesc}</Text></div>}
        </div>
      ),
    },
    { title: 'Loại',   dataIndex: 'type',   key: 'type',   render: v => <Tag color={TYPE_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: 'Giá trị', key: 'value',
      render: (_, p) => p.valueType === 'PERCENTAGE' ? `${p.value}%` : p.valueType === 'FREE_SPIN' ? `${p.value} spins` : fmt(p.value),
    },
    {
      title: 'Thời gian', key: 'dates',
      render: (_, p) => (
        <div>
          <Text type="secondary" className="text-xs block">{p.startDate ? new Date(p.startDate).toLocaleDateString('vi') : '—'}</Text>
          <Text type="secondary" className="text-xs">→ {p.endDate ? new Date(p.endDate).toLocaleDateString('vi') : '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Đã dùng / Max', key: 'uses',
      render: (_, p) => <Text className="text-xs">{fmt(p.usedCount)} / {p.maxUses ? fmt(p.maxUses) : '∞'}</Text>,
    },
    { title: 'TT', dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: '', key: 'actions', width: 170,
      render: (_, p) => (
        <Space size={4} wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(p)}>Sửa</Button>
          <Button size="small" icon={<TeamOutlined />} onClick={() => setVP({ id: p.id, title: p.title })}>Người tham gia</Button>
          <Button
            size="small"
            danger={p.status === 'ACTIVE'}
            icon={<PoweroffOutlined />}
            loading={toggleMut.isPending}
            onClick={() => toggleMut.mutate({ id: p.id, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
          >
            {p.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Quản lý khuyến mãi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>Thêm khuyến mãi</Button>
      </Flex>

      <Flex gap={8} wrap="wrap" className="mb-4">
        <Input allowClear placeholder="Tìm tên..." className="w-[160px]" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <Select className="w-[150px]" value={typeFilter} onChange={v => { setType(v); setPage(1); }}
          options={[{ label: 'Tất cả loại', value: '' }, ...PROMO_TYPES.map(t => ({ label: t, value: t }))]}
        />
        <Space size={4}>
          {[['', 'Tất cả'], ['ACTIVE', 'Đang chạy'], ['SCHEDULED', 'Lên lịch'], ['INACTIVE', 'Tắt'], ['EXPIRED', 'Hết hạn']].map(([v, l]) => (
            <Button key={v} size="small" type={statusFilter === v ? 'primary' : 'default'} onClick={() => { setSt(v); setPage(1); }}>{l}</Button>
          ))}
        </Space>
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 900 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `${t} chương trình`, onChange: p => setPage(p) }}
      />

      {editing !== null && (
        <PromoFormModal editing={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
      )}
      {viewParts && (
        <ParticipantsModal promoId={viewParts.id} promoTitle={viewParts.title} onClose={() => setVP(null)} />
      )}
    </div>
  );
}
