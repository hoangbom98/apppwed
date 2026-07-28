// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/FeatureFlagsPage.tsx
// Route: /settings/feature-flags
// Quản lý Feature Flags động — Super Admin bật/tắt tính năng theo từng project
import React, { useState } from 'react';
import {
  App, Card, Button, Space, Switch, Modal, Form, Input, Select,
  Tag, Tooltip, Typography, Table, Popconfirm, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  ToggleLeftOutlined, CodeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { Text } = Typography;
const { TextArea } = Input;

const PROJECTS = ['all', 'hub', 'game', 'trade', 'dating', 'sports', 'admin'];

// ── Project colour tags ────────────────────────────────────────────────────────
const PROJECT_COLORS: Record<string, string> = {
  all:     'default',
  hub:     'blue',
  game:    'green',
  trade:   'gold',
  dating:  'pink',
  sports:  'orange',
  admin:   'purple',
};

// ── Upsert modal ──────────────────────────────────────────────────────────────
function FlagModal({ flag, open, onClose }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const isEdit = Boolean(flag);

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(flag
        ? { key: flag.key, project: flag.project, enabled: flag.enabled, description: flag.description ?? '', config: flag.config ? JSON.stringify(flag.config, null, 2) : '' }
        : { project: 'all', enabled: false, config: '' },
      );
    }
  }, [open, flag]);

  const mut = useMutation({
    mutationFn: (values: any) => {
      const body = { ...values };
      if (values.config) {
        try { body.config = JSON.parse(values.config); }
        catch { body.config = null; }
      }
      return api.put(`/admin/feature-flags/${encodeURIComponent(values.key)}`, body);
    },
    onSuccess: () => {
      message.success('Đã lưu feature flag');
      qc.invalidateQueries({ queryKey: ['feature-flags-admin'] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.message || 'Lưu thất bại'),
  });

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa Feature Flag' : 'Tạo Feature Flag mới'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={v => mut.mutate(v)} className="mt-4">
        <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Bắt buộc' }]}>
          <Input placeholder="trading_view_chart" disabled={isEdit} />
        </Form.Item>
        <Form.Item name="project" label="Project" rules={[{ required: true }]}>
          <Select options={PROJECTS.map(p => ({ value: p, label: p }))} />
        </Form.Item>
        <Form.Item name="enabled" label="Enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input placeholder="Mô tả tính năng..." />
        </Form.Item>
        <Form.Item name="config" label={<span><CodeOutlined /> Config JSON (tùy chọn)</span>}>
          <TextArea rows={4} placeholder='{"rolloutPct": 50}' style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Huỷ</Button>
          <Button type="primary" htmlType="submit" loading={mut.isPending}>Lưu</Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeatureFlagsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feature-flags-admin', projectFilter],
    queryFn:  () => api.get('/admin/feature-flags', { params: projectFilter ? { project: projectFilter } : {} })
                       .then(r => r.data?.data ?? []),
  });

  const toggleMut = useMutation({
    mutationFn: ({ key, project }: { key: string; project: string }) =>
      api.patch(`/admin/feature-flags/${encodeURIComponent(key)}/toggle`, { project }),
    onSuccess: () => {
      message.success('Đã toggle flag');
      qc.invalidateQueries({ queryKey: ['feature-flags-admin'] });
    },
    onError: () => message.error('Toggle thất bại'),
  });

  const deleteMut = useMutation({
    mutationFn: ({ key, project }: { key: string; project: string }) =>
      api.delete(`/admin/feature-flags/${encodeURIComponent(key)}`, { data: { project } }),
    onSuccess: () => {
      message.success('Đã xóa flag');
      qc.invalidateQueries({ queryKey: ['feature-flags-admin'] });
    },
    onError: () => message.error('Xóa thất bại'),
  });

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      render: (v: string) => <Tag color={PROJECT_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      render: (v: boolean, row: any) => (
        <Switch
          checked={v}
          size="small"
          loading={toggleMut.isPending}
          onChange={() => toggleMut.mutate({ key: row.key, project: row.project })}
        />
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      render: (v: string) => <span className="text-gray-400">{v || '—'}</span>,
    },
    {
      title: 'Config',
      dataIndex: 'config',
      render: (v: any) => v
        ? <Tooltip title={<pre style={{ maxWidth: 300, fontSize: 11 }}>{JSON.stringify(v, null, 2)}</pre>}>
            <Tag icon={<CodeOutlined />} color="default" style={{ cursor: 'pointer' }}>JSON</Tag>
          </Tooltip>
        : <span className="text-gray-600">—</span>,
    },
    {
      title: 'Hành động',
      width: 100,
      render: (_: any, row: any) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => { setEditTarget(row); setModalOpen(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa feature flag này?"
            onConfirm={() => deleteMut.mutate({ key: row.key, project: row.project })}
            okText="Xóa"
            cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Feature Flags</h1>
          <p className="text-sm text-gray-400">Bật/tắt tính năng động theo từng project — không cần deploy lại</p>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Lọc theo project"
            style={{ width: 160 }}
            options={PROJECTS.map(p => ({ value: p, label: p }))}
            onChange={v => setProjectFilter(v ?? '')}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Tải lại</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
          >
            Tạo mới
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={data ?? []}
          columns={columns}
          rowKey={(r: any) => `${r.project}:${r.key}`}
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>

      <FlagModal
        flag={editTarget}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
      />
    </div>
  );
}
