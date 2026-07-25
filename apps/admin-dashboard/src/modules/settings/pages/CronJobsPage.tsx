// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/CronJobsPage.jsx
// Route: /settings/cron-jobs
// Quản lý danh sách Cron Jobs và trạng thái thực thi
import React from 'react';
import {
  App, Card, Table, Tag, Button, Space, Tooltip, Modal, Form, Input, Select,
  Typography, Alert, Descriptions, Spin,
} from 'antd';
import {
  PlayCircleOutlined, PauseCircleOutlined, CaretRightOutlined,
  CopyOutlined, ReloadOutlined, EditOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { Text, Paragraph } = Typography;

// ── status badge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    active:   { color: 'green',   label: 'Đang chạy' },
    inactive: { color: 'default', label: 'Tạm dừng' },
    failed:   { color: 'red',     label: 'Lỗi' },
    running:  { color: 'blue',    label: 'Đang thực thi' },
  }[status] ?? { color: 'default', label: status };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}

// ── edit modal ──────────────────────────────────────────────────────────────────
function EditModal({ job, open, onClose, onSaved }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const qc = useQueryClient();

  React.useEffect(() => {
    if (open && job) {
      form.setFieldsValue({
        name:        job.name,
        description: job.description ?? '',
        command:     job.command,
        schedule:    job.schedule,
        status:      job.status,
      });
    }
  }, [open, job, form]);

  const save = useMutation({
    mutationFn: (values) => api.patch(`/admin/cron/${job.id}`, values),
    onSuccess: () => {
      message.success('Đã cập nhật cron job');
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
      onSaved?.();
      onClose?.();
    },
    onError: () => message.error('Lỗi khi cập nhật'),
  });

  return (
    <Modal
      open={open}
      title={`Chỉnh sửa: ${job?.name}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      okText="Lưu"
      cancelText="Đóng"
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
        <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Đường dẫn (Command)
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                URL path hoặc script command
              </Text>
            </span>
          }
          name="command"
          rules={[{ required: true }]}
        >
          <Input placeholder="/cron/main" />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Lịch chạy (Cron Expression)
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                VD: */5 * * * * = mỗi 5 phút
              </Text>
            </span>
          }
          name="schedule"
          rules={[{ required: true }]}
        >
          <Input placeholder="*/5 * * * *" />
        </Form.Item>
        <Form.Item label="Trạng thái" name="status">
          <Select>
            <Select.Option value="active">Kích hoạt</Select.Option>
            <Select.Option value="inactive">Tạm dừng</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
function CronJobsInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = React.useState(null);
  const [editOpen, setEditOpen] = React.useState(false);
  // Live status overlay: { [id]: status } – overrides DB value until next full fetch
  const [liveStatus, setLiveStatus] = React.useState({});

  // ── Listen to socket cron_status events broadcast by server ────────────────
  React.useEffect(() => {
    const handler = (e) => {
      const { id, status, lastRunAt } = e.detail ?? {};
      if (!id) return;
      // Optimistically patch the cache entry so the badge updates instantly
      qc.setQueryData(['cron-jobs'], (old) =>
        Array.isArray(old)
          ? old.map(j => j.id === id ? { ...j, status, lastRunAt: lastRunAt ?? j.lastRunAt } : j)
          : old
      );
      setLiveStatus(prev => ({ ...prev, [id]: status }));
      if (status === 'failed') {
        message.error(`Cron job thất bại: ${e.detail?.name ?? id}`);
      }
    };
    window.addEventListener('admin:cron_status', handler);
    return () => window.removeEventListener('admin:cron_status', handler);
  }, [qc, message]);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn:  () => api.get('/admin/cron').then(r => r.data?.data ?? r.data),
    refetchInterval: 30000,
    // Clear live overrides when full fetch completes
    onSuccess: () => setLiveStatus({}),
  });

  const toggle = useMutation({
    mutationFn: (id) => api.patch(`/admin/cron/${id}/toggle`),
    onSuccess: (res) => {
      const job = res.data?.data;
      message.success(`Đã ${job?.status === 'active' ? 'kích hoạt' : 'tạm dừng'} cron job`);
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
    onError: () => message.error('Lỗi khi thay đổi trạng thái'),
  });

  const runNow = useMutation({
    mutationFn: (id) => api.post(`/admin/cron/${id}/run`),
    onSuccess: () => {
      message.success('Đã kích hoạt cron job (stampd lastRunAt)');
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
    onError: () => message.error('Lỗi khi chạy cron job'),
  });

  const seed = useMutation({
    mutationFn: () => api.post('/admin/cron/seed'),
    onSuccess: () => {
      message.success('Đã khởi tạo cron jobs mặc định');
      qc.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
    onError: () => message.error('Cần quyền super_admin'),
  });

  const columns = [
    {
      title: 'Tên Cron Job',
      dataIndex: 'name',
      key: 'name',
      render: (name, row) => (
        <div>
          <div className="font-medium text-gray-200">{name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 mt-0.5">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Đường dẫn',
      dataIndex: 'command',
      key: 'command',
      render: (cmd) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{cmd}</Text>
          <Tooltip title="Sao chép">
            <Button
              size="small" type="text"
              icon={<CopyOutlined />}
              onClick={() => { navigator.clipboard.writeText(cmd); message.success('Đã sao chép'); }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Lịch chạy',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (s) => <Text code>{s}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s, row) => (
        <Space size={4}>
          <StatusBadge status={s} />
          {liveStatus[row.id] === 'running' && (
            <span style={{ color: '#1677ff', fontSize: 11 }}>⬤ live</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Lần chạy cuối',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      render: (v) => v
        ? new Date(v).toLocaleString('vi-VN')
        : <Text type="secondary">Chưa chạy</Text>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Chạy ngay">
            <Button
              size="small"
              icon={<CaretRightOutlined />}
              loading={runNow.isPending && runNow.variables === row.id}
              onClick={() => runNow.mutate(row.id)}
            />
          </Tooltip>
          <Tooltip title={row.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}>
            <Button
              size="small"
              icon={row.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              loading={toggle.isPending && toggle.variables === row.id}
              onClick={() => toggle.mutate(row.id)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => { setEditTarget(row); setEditOpen(true); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Cron Jobs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quản lý các tác vụ định kỳ chạy tự động trên server
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Làm mới
          </Button>
          {(!jobs || jobs.length === 0) && (
            <Button
              icon={<PlusOutlined />}
              type="dashed"
              loading={seed.isPending}
              onClick={() => seed.mutate()}
            >
              Khởi tạo mặc định
            </Button>
          )}
        </Space>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Hướng dẫn cài đặt Cron Jobs"
        description={
          <div>
            <p>Thiết lập các Cron Jobs sau trên hosting / server (cPanel → Cron Jobs hoặc Linux <Text code>crontab -e</Text>).</p>
            <p>Mỗi lệnh gọi URL: <Text code>curl "https://yourdomain.com{'{command}'}?key={'{cron_secret}'}"</Text></p>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : (
        <Card bodyStyle={{ padding: 0 }}>
          <Table
            columns={columns}
            dataSource={jobs ?? []}
            rowKey="id"
            pagination={false}
            size="middle"
            scroll={{ x: 900 }}
          />
        </Card>
      )}

      {editTarget && (
        <EditModal
          job={editTarget}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

export default function CronJobsPage() {
  return <App><CronJobsInner /></App>;
}
