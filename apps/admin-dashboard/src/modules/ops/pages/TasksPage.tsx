import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Modal, Form, Input, Tabs, App, Typography, Flex } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { opsApi } from '../api';

const { Text } = Typography;
const { TextArea } = Input;

const PRIORITY_TAG = { critical: 'error', high: 'warning', medium: 'gold', low: 'default' };
const STATUS_TAG   = { pending: 'processing', in_progress: 'warning', completed: 'success', cancelled: 'default' };
const STATUS_LABEL = { pending: 'Chờ', in_progress: 'Đang xử lý', completed: 'Hoàn thành', cancelled: 'Huỷ' };
const TASK_TYPES   = ['support', 'withdraw', 'deposit', 'kyc', 'bug', 'campaign', 'churn', 'report'];

export default function TasksPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [filter, setFilter]   = useState('pending');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['opsTasks', filter],
    queryFn:  () => opsApi.listTasks({ status: filter || undefined, limit: 50 }).then(r => r.data),
  });

  const completeMut = useMutation({
    mutationFn: id => opsApi.completeTask(id),
    onSuccess:  () => { message.success('Task đã hoàn thành'); qc.invalidateQueries({ queryKey: ['opsTasks'] }); },
  });

  const rebalanceMut = useMutation({
    mutationFn: opsApi.rebalanceTasks,
    onSuccess:  res => { message.success(`Đã điều phối ${res.data?.data?.moved ?? 0} task`); refetch(); },
  });

  const createMut = useMutation({
    mutationFn: body => opsApi.createTask(body),
    onSuccess:  () => {
      message.success('Task đã được tạo và giao tự động');
      qc.invalidateQueries({ queryKey: ['opsTasks'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: e => message.error(e?.response?.data?.message ?? 'Lỗi tạo task'),
  });

  const tasks = data?.data ?? [];

  const columns = [
    {
      title: 'Task', key: 'task',
      render: (_, t) => (
        <div>
          <div style={{ fontWeight: 500 }}>{t.title}</div>
          {t.description && <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: t.description }}>{t.description}</Text>}
        </div>
      ),
    },
    { title: 'Loại', dataIndex: 'type', key: 'type' },
    { title: 'Ưu tiên', dataIndex: 'priority', key: 'priority', render: p => <Tag color={PRIORITY_TAG[p] ?? 'default'}>{p}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag> },
    { title: 'Giao cho', key: 'assignedTo', render: (_, t) => t.assignedTo ? `#${t.assignedTo}` : '—' },
    { title: 'Ngày tạo', key: 'createdAt', render: (_, t) => new Date(t.createdAt).toLocaleDateString('vi-VN') },
    {
      title: '', key: 'action',
      render: (_, t) => t.status !== 'completed' ? (
        <Button
          size="small" type="link" icon={<CheckCircleOutlined />}
          onClick={() => completeMut.mutate(t.id)}
          loading={completeMut.isPending}
        >Xong</Button>
      ) : null,
    },
  ];

  const tabItems = [
    { key: '',            label: 'Tất cả' },
    { key: 'pending',     label: 'Chờ' },
    { key: 'in_progress', label: 'Đang xử lý' },
    { key: 'completed',   label: 'Hoàn thành' },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Quản lý Task</div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => rebalanceMut.mutate()} loading={rebalanceMut.isPending}>Cân bằng tải</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo Task</Button>
        </Space>
      </Flex>

      <Tabs
        activeKey={filter}
        onChange={setFilter}
        items={tabItems}
      />

      <Table
        dataSource={tasks}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <Modal
        open={createOpen}
        title="Tạo Task mới"
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.validateFields().then(createMut.mutate)}
        okText="Tạo & Giao tự động"
        confirmLoading={createMut.isPending}
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: 'support' }}>
          <Form.Item name="type" label="Loại task">
            <Select options={TASK_TYPES.map(t => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Mô tả ngắn..." />
          </Form.Item>
          <Form.Item name="description" label="Ghi chú">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
