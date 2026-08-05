// Antd — Table, Modal, Form, Input, Select, Tag, Button, App
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space, Typography, App, Flex,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TARGET_OPTS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Game',   value: 'game' },
  { label: 'Dating', value: 'dating' },
  { label: 'Sports', value: 'sports' },
  { label: 'Trade',  value: 'trade' },
  { label: 'Hub',    value: 'hub' },
];

const STATUS_COLOR = { active: 'success', inactive: 'default' };

export default function Announcements() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form]    = Form.useForm();
  const [page,    setPage]    = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements', page],
    queryFn:  () => api.get('/admin/announcements', { params: { page, limit: 20 } }).then(r => r.data),
  });
  const rows       = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total      = data?.total ?? 0;

  const saveMut = useMutation({
    mutationFn: (values) => editing?.id
      ? api.patch(`/admin/announcements/${editing.id}`, values)
      : api.post('/admin/announcements', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      setEditing(null);
      form.resetFields();
      message.success(editing?.id ? 'Đã cập nhật thông báo' : 'Đã tạo thông báo mới');
    },
    onError: (err) => message.error(err?.response?.data?.message ?? 'Lỗi khi lưu'),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/announcements/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-announcements'] }); message.warning('Đã xoá thông báo'); },
    onError:    () => message.error('Lỗi khi xoá'),
  });

  const openNew  = () => { setEditing({}); form.setFieldsValue({ target: 'all', status: 'active' }); };
  const openEdit = (row) => { setEditing(row); form.setFieldsValue(row); };

  const handleDelete = (id) => modal.confirm({
    title: 'Xác nhận xoá thông báo?',
    okText: 'Xoá', okButtonProps: { danger: true },
    onOk: () => delMut.mutate(id),
  });

  const columns = [
    { title: 'ID',        dataIndex: 'id',     key: 'id', width: 70, render: v => <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>#{v}</Text> },
    { title: 'Tiêu đề',   dataIndex: 'title',  key: 'title', ellipsis: true },
    { title: 'Đối tượng', dataIndex: 'target', key: 'target', render: v => <Tag>{v ?? 'all'}</Tag> },
    { title: 'Trạng thái',dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'time', render: v => <Text type="secondary" style={{ fontSize: 11 }}>{v ? new Date(v).toLocaleString('vi') : '—'}</Text> },
    { title: '', key: 'actions', width: 100, render: (_, row) => (
      <Space size={4}>
        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(row.id)} />
      </Space>
    )},
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Thông báo hệ thống</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>Tạo thông báo</Button>
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 600 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, onChange: p => setPage(p) }}
      />

      <Modal
        open={editing !== null}
        title={editing?.id ? 'Sửa thông báo' : 'Tạo thông báo mới'}
        onOk={() => form.validateFields().then(v => saveMut.mutate(v))}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        okText="Lưu" cancelText="Huỷ"
        confirmLoading={saveMut.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Nội dung">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="target" label="Đối tượng">
            <Select options={TARGET_OPTS} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
