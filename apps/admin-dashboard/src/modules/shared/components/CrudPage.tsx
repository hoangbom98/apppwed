// @ts-nocheck
// frontend/admin-dashboard/src/modules/shared/components/CrudPage.jsx
// Ant Design — Table, Modal, Form, Input, Select, Button, Space
// Drop-in replacement: same props interface as original.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Select, Space, Typography, Flex, App,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * @param {{
 *   title:    string,
 *   queryKey: string,
 *   api: {
 *     list:   (params?: object) => Promise<any>,
 *     create: (body: object)   => Promise<any>,
 *     update: (id: number, body: object) => Promise<any>,
 *     remove: (id: number)    => Promise<any>,
 *   },
 *   fields: Array<{
 *     key: string, label: string,
 *     type?: 'text'|'number'|'textarea'|'select',
 *     options?: Array<{label:string, value:string}>,
 *     required?: boolean,
 *     listHide?: boolean,
 *     render?: (val: any, row: any) => React.ReactNode,
 *   }>,
 * }}
 */
export default function CrudPage({ title, queryKey, api, fields }) {
  const qc = useQueryClient();
  const { message, modal } = App.useApp();
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [editing, setEditing] = useState(null);  // null=closed, {}=new, {...}=edit row
  const [form]                = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, search],
    queryFn:  () => api.list({ page, limit: 15, search: search || undefined }),
  });

  const rows       = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ── Save mutation ─────────────────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: (values) =>
      editing?.id ? api.update(editing.id, values) : api.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      message.success(`${editing?.id ? 'Cập nhật' : 'Tạo mới'} thành công`);
      setEditing(null);
      form.resetFields();
    },
    onError: (err) => message.error(err.response?.data?.message ?? 'Lỗi hệ thống'),
  });

  // ── Delete mutation ───────────────────────────────────────────────────────────
  const delMut = useMutation({
    mutationFn: api.remove,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: [queryKey] }); message.success('Xoá thành công'); },
    onError:    (err) => message.error(err.response?.data?.message ?? 'Không thể xoá'),
  });

  const handleDelete = (id) => {
    modal.confirm({
      title:   'Xoá mục này?',
      content: 'Hành động này không thể hoàn tác.',
      okText:  'Xoá',
      okButtonProps: { danger: true },
      onOk:    () => delMut.mutate(id),
    });
  };

  const handleEdit = (row) => {
    setEditing(row);
    form.setFieldsValue(row);
  };

  const handleCreate = () => {
    setEditing({});
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then(values => saveMut.mutate(values));
  };

  const handleModalCancel = () => { setEditing(null); form.resetFields(); };

  // ── Table columns from field config ──────────────────────────────────────────
  const tableFields = fields.filter(f => !f.listHide);
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70,
      render: v => <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 11 }}>#{v}</Text> },
    ...tableFields.map(f => ({
      title:     f.label,
      dataIndex: f.key,
      key:       f.key,
      ellipsis:  true,
      render:    f.render
        ? (v, row) => f.render(v, row)
        : (v) => String(v ?? ''),
    })),
    {
      title: 'Thao tác', key: 'actions', width: 100, fixed: 'right',
      render: (_, row) => (
        <Space size={6}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(row)} />
          <Button size="small" danger icon={<DeleteOutlined />} loading={delMut.isPending} onClick={() => handleDelete(row.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm..."
            style={{ width: 220 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo mới
          </Button>
        </Space>
      </Flex>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 'max-content' }}
        pagination={{
          current:   page,
          pageSize:  15,
          total:     totalItems,
          showSizeChanger: false,
          showTotal: t => `${t} mục`,
          onChange:  p => setPage(p),
        }}
      />

      {/* ── Create / Edit Modal ────────────────────────────────────────── */}
      <Modal
        open={editing !== null}
        title={editing?.id
          ? <><EditOutlined style={{ marginRight: 8, color: '#3b82f6' }} />Chỉnh sửa {title}</>
          : <><PlusOutlined style={{ marginRight: 8, color: '#10b981' }} />Tạo mới {title}</>
        }
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Lưu"
        cancelText="Huỷ"
        confirmLoading={saveMut.isPending}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          {fields.map(f => (
            <Form.Item
              key={f.key}
              name={f.key}
              label={f.label}
              rules={f.required ? [{ required: true, message: `Vui lòng nhập ${f.label.toLowerCase()}` }] : []}
            >
              {f.type === 'textarea' ? (
                <TextArea rows={4} />
              ) : f.type === 'select' ? (
                <Select
                  placeholder="Chọn..."
                  options={f.options?.map(o => ({ label: o.label, value: o.value }))}
                />
              ) : (
                <Input type={f.type === 'number' ? 'number' : 'text'} />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
