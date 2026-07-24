// frontend/admin-dashboard/src/modules/shared/pages/RolesPage.jsx
// RBAC Role & Permission Management — học từ Boyue role.html + permission.js
// Route: /settings/roles
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Modal, Form, Select, Checkbox, Typography,
  Space, App, Flex, Collapse, Row, Col, Divider,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SearchOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

const STATUS_COLOR = { active: 'success', inactive: 'default' };

// ── Permission Tree Selector ───────────────────────────────────────────────────
function PermissionTree({ value = [], onChange }) {
  const { data: tree } = useQuery({
    queryKey: ['admin-permission-tree'],
    queryFn:  () => api.get('/admin/roles/permissions/all').then(r => r.data?.data ?? r.data ?? []),
    staleTime: 300_000,
  });

  const toggle = (perm) => {
    const next = value.includes(perm) ? value.filter(p => p !== perm) : [...value, perm];
    onChange?.(next);
  };

  const toggleGroup = (perms) => {
    const allChecked = perms.every(p => value.includes(p));
    const next = allChecked
      ? value.filter(p => !perms.includes(p))
      : [...new Set([...value, ...perms])];
    onChange?.(next);
  };

  return (
    <Collapse size="small" ghost style={{ marginTop: 8 }}>
      {(tree ?? []).map(group => {
        const allChecked = group.perms.every(p => value.includes(p));
        const someChecked = group.perms.some(p => value.includes(p));
        return (
          <Collapse.Panel
            key={group.group}
            header={
              <Flex align="center" gap={8}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={() => toggleGroup(group.perms)}
                  onClick={e => e.stopPropagation()}
                />
                <Text strong style={{ fontSize: 13 }}>{group.label}</Text>
                <Tag style={{ fontSize: 11 }}>{group.perms.filter(p => value.includes(p)).length}/{group.perms.length}</Tag>
              </Flex>
            }
          >
            <Row gutter={[8, 8]}>
              {group.perms.map(perm => (
                <Col key={perm} xs={24} sm={12} md={8}>
                  <Checkbox
                    checked={value.includes(perm)}
                    onChange={() => toggle(perm)}
                  >
                    <Text code style={{ fontSize: 11 }}>{perm}</Text>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Collapse.Panel>
        );
      })}
    </Collapse>
  );
}

// ── Role Form Modal ───────────────────────────────────────────────────────────
function RoleFormModal({ editing, open, onClose }) {
  const [form]         = Form.useForm();
  const [permissions, setPermissions] = useState([]);
  const { message }    = App.useApp();
  const qc             = useQueryClient();
  const isEdit         = !!editing?.id;

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(editing ?? { status: 'active', sortOrder: 0 });
      setPermissions(editing?.permissions ?? []);
    } else {
      form.resetFields();
      setPermissions([]);
    }
  }, [open, editing, form]);

  const mut = useMutation({
    mutationFn: (values) => {
      const body = { ...values, permissions };
      return isEdit
        ? api.patch(`/admin/roles/${editing.id}`, body)
        : api.post('/admin/roles', body);
    },
    onSuccess: () => {
      message.success(isEdit ? 'Đã cập nhật role' : 'Đã tạo role mới');
      qc.invalidateQueries({ queryKey: ['admin-roles'] });
      onClose();
    },
    onError: e => message.error(e?.response?.data?.message ?? 'Có lỗi xảy ra'),
  });

  return (
    <Modal
      open={open}
      title={isEdit ? `Sửa role: ${editing?.displayName}` : '+ Tạo Role mới'}
      onOk={() => form.validateFields().then(v => mut.mutate(v))}
      onCancel={onClose}
      okText={isEdit ? 'Lưu' : 'Tạo mới'}
      cancelText="Huỷ"
      confirmLoading={mut.isPending}
      width={680}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="name" label="Tên kỹ thuật (key)" rules={[{ required: true }]}>
              <Input placeholder="vd: finance, support" disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="displayName" label="Tên hiển thị" rules={[{ required: true }]}>
              <Input placeholder="vd: Tài chính" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái">
              <Select options={[{ label: 'Hoạt động', value: 'active' }, { label: 'Tắt', value: 'inactive' }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
              <Input type="number" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain style={{ fontSize: 12 }}>Quyền hạn ({permissions.length} đã chọn)</Divider>
        <PermissionTree value={permissions} onChange={setPermissions} />
      </Form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles', search],
    queryFn:  () => api.get('/admin/roles', { params: { search: search || undefined } }).then(r => r.data),
    staleTime: 60_000,
  });
  const rows  = data?.data ?? data ?? [];
  const total = data?.meta?.total ?? (Array.isArray(rows) ? rows.length : 0);

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/admin/roles/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); message.success('Đã xoá'); },
    onError:    e  => message.error(e?.response?.data?.message ?? 'Lỗi xoá'),
  });

  const handleDelete = (role) => modal.confirm({
    title: `Xoá role "${role.displayName}"?`,
    content: <Text type="danger" style={{ fontSize: 12 }}>Role đang có {role._count?.adminUsers ?? 0} admin. Không thể xoá nếu &gt; 0.</Text>,
    okText: 'Xoá', okButtonProps: { danger: true },
    cancelText: 'Huỷ',
    onOk: () => deleteMut.mutate(role.id),
  });

  const columns = [
    {
      title: 'Role',
      key: 'role',
      render: (_, r) => (
        <div>
          <Text strong>{r.displayName}</Text>
          <div><Text code style={{ fontSize: 11 }}>{r.name}</Text></div>
          {r.description && <Text type="secondary" style={{ fontSize: 11 }}>{r.description}</Text>}
        </div>
      ),
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: 'Permissions',
      key: 'perms',
      render: (_, r) => {
        const perms = Array.isArray(r.permissions) ? r.permissions : [];
        return perms.length > 0
          ? <Text type="secondary" style={{ fontSize: 11 }}>{perms.slice(0,3).join(', ')}{perms.length > 3 ? ` +${perms.length - 3} nữa` : ''}</Text>
          : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
      },
    },
    { title: 'Admins', key: 'count', render: (_, r) => <Tag>{r._count?.adminUsers ?? 0} admins</Tag> },
    {
      title: '', key: 'actions', width: 120,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setFormOpen(true); }}>Sửa</Button>
          <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMut.isPending} onClick={() => handleDelete(r)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Quản lý Roles & Permissions</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Tổng: {total} roles</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          Tạo Role mới
        </Button>
      </Flex>

      <Input
        allowClear prefix={<SearchOutlined />}
        placeholder="Tìm role..."
        style={{ maxWidth: 300, marginBottom: 16 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Table
        dataSource={Array.isArray(rows) ? rows : []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
      />

      <RoleFormModal
        open={formOpen}
        editing={editing}
        onClose={() => { setFormOpen(false); setEditing(null); }}
      />
    </div>
  );
}
