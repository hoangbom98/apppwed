/**
 * VipConfigPage.tsx — Quản lý cấu hình VIP Tier
 * Route: /game/vip-config
 *
 * Hiển thị và chỉnh sửa các mức VIP (level 0–10):
 *   - Ngưỡng cược tích lũy để đạt level
 *   - Thưởng khi lên level
 *   - Màu sắc, tên, trạng thái
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useQueryClient as _qc } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, InputNumber, Input, Select, Tag,
  Typography, App, Tooltip, Popconfirm, Space, Row, Col, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

// ── API helpers ────────────────────────────────────────────────────────────────
const vipApi = {
  list:   () => api.get('/admin/vip/configs').then(r => r.data?.data ?? r.data),
  upsert: (body: object) => api.post('/admin/vip/configs', body).then(r => r.data?.data ?? r.data),
  update: (id: number, body: object) => api.patch(`/admin/vip/configs/${id}`, body).then(r => r.data?.data ?? r.data),
  delete: (id: number) => api.delete(`/admin/vip/configs/${id}`).then(r => r.data?.data ?? r.data),
  stats:  () => api.get('/admin/vip/stats').then(r => r.data?.data ?? r.data),
};

function vnd(n: number) {
  return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

// ── VIP Level colour badge ────────────────────────────────────────────────────
const VIP_PRESET_COLORS = ['#888888','#00B894','#00CEC9','#0984E3','#6C5CE7','#FD79A8','#E17055','#FDCB6E','#F9CA24','#FF9FF3','#FF7675'];

export default function VipConfigPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [open, setOpen]     = useState(false);
  const [editing, setEdit]  = useState<any>(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['vip-configs'],
    queryFn:  vipApi.list,
    staleTime: 30_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['vip-stats'],
    queryFn:  vipApi.stats,
    staleTime: 60_000,
  });

  const configArr = Array.isArray(configs) ? configs : [];
  const distMap: Record<number, number> = {};
  if (statsData?.distribution) {
    for (const d of statsData.distribution) distMap[d.level] = d.count;
  }

  const saveMut = useMutation({
    mutationFn: (body: object) =>
      editing ? vipApi.update(editing.id, body) : vipApi.upsert(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vip-configs'] });
      qc.invalidateQueries({ queryKey: ['vip-stats'] });
      message.success('Đã lưu VIP config');
      setOpen(false);
      form.resetFields();
      setEdit(null);
    },
    onError: (e: any) => message.error(e?.response?.data?.message || 'Lỗi lưu'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => vipApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vip-configs'] });
      message.success('Đã xoá');
    },
    onError: () => message.error('Lỗi xoá'),
  });

  function openCreate() {
    setEdit(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(row: any) {
    setEdit(row);
    form.setFieldsValue({ ...row });
    setOpen(true);
  }

  const columns = [
    {
      title: 'Level', dataIndex: 'level', key: 'level', width: 80,
      render: (v: number, row: any) => (
        <Tag color={row.color || VIP_PRESET_COLORS[v] || '#888'} style={{ fontWeight: 700, fontSize: 12 }}>
          {row.name || `V${v}`}
        </Tag>
      ),
    },
    {
      title: 'Ngưỡng cược', dataIndex: 'betRequired', key: 'betRequired', width: 150,
      render: (v: number) => <Text className="font-mono text-xs">{vnd(v)}</Text>,
    },
    {
      title: 'Thưởng lên level', dataIndex: 'rewardAmount', key: 'rewardAmount', width: 140,
      render: (v: number) => <Text className="font-mono text-xs text-green-400">{vnd(v)}</Text>,
    },
    {
      title: 'Người dùng', key: 'users', width: 100,
      render: (_: any, row: any) => (
        <Tag color="blue">{(distMap[row.level] || 0).toLocaleString()}</Tag>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => <Tag color={v === 'active' ? 'success' : 'default'}>{v === 'active' ? 'Hoạt động' : 'Tắt'}</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 100, align: 'center' as const,
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="Sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          </Tooltip>
          <Popconfirm
            title={`Xoá VIP level ${row.level}?`}
            onConfirm={() => deleteMut.mutate(row.id)}
            okText="Xoá" cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <TrophyOutlined className="mr-2 text-yellow-400" />
            Cấu hình VIP
          </Title>
          <Text type="secondary" className="text-xs">
            Quản lý ngưỡng cược, thưởng lên cấp, màu sắc cho từng mức VIP
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm level
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spin /></div>
      ) : (
        <Table
          dataSource={configArr}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 700 }}
        />
      )}

      <Modal
        title={editing ? `Sửa VIP Level ${editing.level}` : 'Thêm VIP Level mới'}
        open={open}
        onCancel={() => { setOpen(false); setEdit(null); form.resetFields(); }}
        footer={null}
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={v => saveMut.mutate(v)}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Level" name="level" rules={[{ required: true }]}>
                <InputNumber min={0} max={20} style={{ width: '100%' }} disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
                <Input placeholder="Ví dụ: V1, Vàng, Kim Cương" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Ngưỡng cược tích lũy (VND)" name="betRequired">
                <InputNumber min={0} step={100000} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thưởng khi lên level (VND)" name="rewardAmount">
                <InputNumber min={0} step={10000} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Màu sắc (hex)" name="color">
                <Input placeholder="#00B894" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trạng thái" name="status" initialValue="active">
                <Select options={[{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Tắt' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" loading={saveMut.isPending} block>
            {editing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
