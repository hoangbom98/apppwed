// Reusable User Management Page for specific projects (Dating, Game, Trade, etc.)
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Input, Typography, Space, App } from 'antd';
import { SearchOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import client from '@admin/api/client';

const { Title, Text } = Typography;

/**
 * @param {{
 *   project: string,
 *   title:   string,
 *   columns: Array<{ key: string, label: string, render?: (val, user) => React.ReactNode }>
 * }}
 */
export default function ProjectUsersPage({ project, title, columns = [] }) {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [`${project}-admin-users`, page, search],
    queryFn:  () => client.get('/admin/users', {
      params: { page, limit: 20, search: search || undefined, project },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const toggleStatus = useMutation({
    mutationFn: (userId) => client.patch(`/admin/users/${userId}/status`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: [`${project}-admin-users`] }); message.success('Đã cập nhật trạng thái'); },
    onError:    () => message.error('Lỗi khi thay đổi trạng thái'),
  });

  const baseColumns = [
    {
      title: 'Thành viên', key: 'user',
      render: (_, u) => (
        <Space>
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : (u.username?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <Text strong>{u.username}</Text>
            {u.isVip && <Tag color="gold" className="ml-1" style={{ fontSize: 9 }}>VIP</Tag>}
            <div><Text type="secondary" className="text-xs">{u.email}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={v === 'active' ? 'success' : 'error'}>{v === 'active' ? 'Hoạt động' : 'Đã khoá'}</Tag>,
    },
    ...columns.map(col => ({
      title: col.label,
      dataIndex: col.key,
      key: col.key,
      render: col.render ? (v, u) => col.render(v, u) : v => String(v ?? '—'),
    })),
    {
      title: '', key: 'actions', width: 80,
      render: (_, u) => (
        <Button
          size="small"
          danger={u.status === 'active'}
          icon={u.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
          loading={toggleStatus.isPending}
          onClick={() => toggleStatus.mutate(u.id)}
          title={u.status === 'active' ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
        />
      ),
    },
  ];

  return (
    <div>
      <Space className="w-full justify-between mb-4" wrap>
        <Title level={4} className="m-0">{title}</Title>
        <Input
          allowClear prefix={<SearchOutlined />}
          placeholder="Tìm username, email, ID..."
          className="w-[280px]"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </Space>

      <Table
        dataSource={rows} columns={baseColumns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 700 }}
        pagination={{
          current: page, pageSize: 20, total,
          showSizeChanger: false,
          showTotal: (t, [s, e]) => `${s}–${e} / ${t}`,
          onChange: p => setPage(p),
        }}
        footer={() => <Text type="secondary" className="text-xs italic">Dữ liệu cập nhật theo thời gian thực</Text>}
      />
    </div>
  );
}
