import { ProTable } from '@ant-design/pro-components';
import { Button, message, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import * as hubApi from '../api';

export default function AdminAcademyCoursesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => hubApi.getCourses({}),
  });

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'success' : 'warning'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    { title: 'Giá', dataIndex: 'price', key: 'price', render: (price: number) => `${price.toLocaleString()} VND` },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link">Sửa</Button>
          <Button type="link" danger onClick={() => message.info('Tính năng xóa đang cập nhật')}>Xóa</Button>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="Quản lý khóa học"
      dataSource={data?.data || []}
      loading={isLoading}
      columns={columns}
      rowKey="id"
      toolBarRender={() => [
        <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('Tính năng thêm đang cập nhật')}>
          Thêm khóa học
        </Button>,
      ]}
    />
  );
}
