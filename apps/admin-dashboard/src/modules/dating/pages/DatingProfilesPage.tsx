import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Input, Select, Space, App, Typography, Flex } from 'antd';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_TAG = { active: 'success', suspended: 'warning', banned: 'error', inactive: 'default' };

export default function DatingProfilesPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dating-admin-profiles', page, gender, search],
    queryFn:  () => api.get('/dating/admin/profiles', {
      params: { page, limit: 20, gender: gender || undefined, search: search || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const toggleMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/dating/admin/profiles/${id}`, { status }),
    onSuccess: () => { message.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['dating-admin-profiles'] }); },
    onError:   () => message.error('Có lỗi xảy ra'),
  });

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => (
        <div>
          <div>{r.username ?? r.displayName ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.email ?? r.userId}</Text>
        </div>
      ),
    },
    { title: 'Giới tính', dataIndex: 'gender', key: 'gender', render: v => v ?? '—' },
    { title: 'Tuổi', dataIndex: 'age', key: 'age', render: v => v ?? '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{s ?? '—'}</Tag>,
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_, r) => new Date(r.createdAt ?? r.created_at).toLocaleString('vi'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) => r.status === 'active'
        ? (
          <Button
            danger size="small"
            onClick={() => modal.confirm({
              title: 'Khoá hồ sơ?',
              content: `Khoá hồ sơ ${r.username ?? r.userId}?`,
              okType: 'danger',
              onOk: () => toggleMut.mutateAsync({ id: r.userId ?? r.id, status: 'suspended' }),
            })}
          >Khoá</Button>
        ) : (
          <Button
            type="primary" size="small"
            onClick={() => toggleMut.mutate({ id: r.userId ?? r.id, status: 'active' })}
          >Mở khoá</Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Dating — Hồ sơ</div>
          <Text type="secondary">Quản lý hồ sơ người dùng trên nền tảng hẹn hò</Text>
        </div>
        <Space wrap>
          <Input.Search
            placeholder="Tìm tên / email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 200 }} allowClear
          />
          <Select
            value={gender}
            onChange={v => { setGender(v); setPage(1); }}
            style={{ width: 160 }}
            options={[
              { value: '', label: 'Tất cả giới tính' },
              { value: 'male', label: 'Nam' },
              { value: 'female', label: 'Nữ' },
              { value: 'other', label: 'Khác' },
            ]}
          />
        </Space>
      </Flex>

      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey={r => r.userId ?? r.id}
        size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
    </div>
  );
}
