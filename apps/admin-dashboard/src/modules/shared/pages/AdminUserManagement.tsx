// Route: /settings/admins
// Quản lý tài khoản Admin: tạo / sửa / khoá / xoá admin accounts.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Modal, Form, Select, Typography, Space, App, Flex,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import { useAuthStore } from '@admin/store/adminStore';

const { Title, Text } = Typography;

const ROLE_COLOR   = { super_admin: 'purple', admin: 'blue', moderator: 'green' };
const STATUS_COLOR = { active: 'success', suspended: 'warning', inactive: 'default' };

// ── Create / Edit form modal ───────────────────────────────────────────────────
function AdminFormModal({ initial, open, onClose, onSave, isSaving }) {
  const [form] = Form.useForm();
  const isEdit = !!initial?.id;

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initial ?? { role: 'admin', status: 'active', password: '' });
    } else {
      form.resetFields();
    }
  }, [open, initial, form]);

  const handleOk = () => form.validateFields().then(values => { onSave(values); });

  return (
    <Modal
      open={open}
      title={isEdit ? `Sửa admin: ${initial?.email}` : 'Thêm Admin mới'}
      onOk={handleOk}
      onCancel={onClose}
      okText={isEdit ? 'Cập nhật' : 'Tạo Admin'} cancelText="Hủy"
      confirmLoading={isSaving}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        {!isEdit && (
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="admin@example.com" autoComplete="off" />
          </Form.Item>
        )}
        <Form.Item name="fullName" label="Họ tên">
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>
        <Form.Item name="password" label={isEdit ? 'Mật khẩu mới (bỏ trống = giữ nguyên)' : 'Mật khẩu'}
          rules={isEdit ? [] : [{ required: true, min: 8, message: 'Tối thiểu 8 ký tự' }]}>
          <Input.Password placeholder={isEdit ? '••••••••' : 'Tối thiểu 8 ký tự'} autoComplete="new-password" />
        </Form.Item>
        <Space className="w-full" size={8}>
          <Form.Item name="role" label="Vai trò" style={{ width: '50%' }}>
            <Select options={[{ label: 'Moderator', value: 'moderator' }, { label: 'Admin', value: 'admin' }, { label: 'Super Admin', value: 'super_admin' }]} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" style={{ width: '50%' }}>
            <Select options={[{ label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }, { label: 'Inactive', value: 'inactive' }]} />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminUserManagement() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const { user: me } = useAuthStore();

  const [search,     setSearch]     = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [showForm,   setShowForm]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn:  () => api.get('/admin/admins', { params: { search: search || undefined } })
                       .then(r => r.data?.data ?? r.data ?? []),
  });
  const admins = Array.isArray(data) ? data : (data?.data ?? []);

  const createMut = useMutation({
    mutationFn: body => api.post('/admin/admins', body),
    onSuccess:  () => { qc.invalidateQueries(['admin-users']); setShowForm(false); message.success('Đã tạo admin mới'); },
    onError:    e  => message.error(e?.response?.data?.message || 'Lỗi tạo admin'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/admin/admins/${id}`, body),
    onSuccess:  () => { qc.invalidateQueries(['admin-users']); setShowForm(false); message.success('Đã cập nhật'); },
    onError:    e  => message.error(e?.response?.data?.message || 'Lỗi cập nhật'),
  });

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/admin/admins/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['admin-users']); message.success('Đã xoá admin'); },
    onError:    e  => message.error(e?.response?.data?.message || 'Lỗi xoá'),
  });

  const handleSave = (form) => {
    if (editTarget?.id) {
      const body = { fullName: form.fullName, role: form.role, status: form.status };
      if (form.password) body.password = form.password;
      updateMut.mutate({ id: editTarget.id, ...body });
    } else {
      createMut.mutate(form);
    }
  };

  const handleDelete = (admin) => modal.confirm({
    title: `Xác nhận xoá admin: ${admin.email}?`,
    content: <Text type="danger" className="text-xs">Hành động này không thể hoàn tác.</Text>,
    okText: 'Xác nhận xoá', okButtonProps: { danger: true },
    cancelText: 'Hủy',
    onOk: () => deleteMut.mutate(admin.id),
  });

  const isSaving = createMut.isPending || updateMut.isPending;

  const columns = [
    { title: 'Email',    dataIndex: 'email',    key: 'email',    render: v => <Text strong>{v}</Text> },
    { title: 'Họ tên',   dataIndex: 'fullName', key: 'fullName', render: v => v || '—' },
    { title: 'Vai trò',  dataIndex: 'role',     key: 'role',     render: v => <Tag color={ROLE_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status',   render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: 'Đăng nhập gần nhất', dataIndex: 'lastLogin', key: 'lastLogin',
      render: v => <Text type="secondary" className="text-xs">{v ? new Date(v).toLocaleString('vi-VN') : '—'}</Text>,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_, admin) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditTarget(admin); setShowForm(true); }} />
          {admin.id !== me?.id && (
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMut.isPending} onClick={() => handleDelete(admin)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Quản lý Admin</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditTarget(null); setShowForm(true); }}>
          Thêm Admin
        </Button>
      </Flex>

      <Input
        allowClear prefix={<SearchOutlined />}
        placeholder="Tìm theo email hoặc họ tên…"
        className="w-full max-w-sm mb-4"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Table
        dataSource={admins} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 700 }}
        pagination={false}
      />

      <AdminFormModal
        open={showForm}
        initial={editTarget}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
