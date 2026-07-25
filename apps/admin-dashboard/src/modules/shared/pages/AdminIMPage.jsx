// frontend/admin-dashboard/src/modules/shared/pages/AdminIMPage.jsx
// Admin IM / Chat Panel — học từ ImController.php + IMService.php Boyue
// Route: /im
// Tabs: Rooms (phòng chat) | Tickets (yêu cầu hỗ trợ) | Broadcast
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Select, Modal, Form, Tabs, Typography,
  Space, App, Flex, List, Avatar, Descriptions, Badge,
} from 'antd';
import {
  MessageOutlined, SendOutlined, StopOutlined, CheckOutlined,
  NotificationOutlined, UserOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

const TICKET_PRIORITY_COLOR = { critical: 'red', high: 'orange', medium: 'gold', low: 'blue' };
const TICKET_STATUS_COLOR   = { open: 'processing', in_progress: 'warning', resolved: 'success', closed: 'default' };

// ── Support Rooms Tab ─────────────────────────────────────────────────────────
function RoomsTab() {
  const [page,       setPage]   = useState(1);
  const [selectedRoom, setRoom] = useState(null);
  const [msgContent,   setMsg]  = useState('');
  const { message: antMsg }     = App.useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-im-rooms', page],
    queryFn:  () => api.get('/admin/im/rooms', { params: { page, limit: 20 } }).then(r => r.data),
    staleTime: 30_000,
  });
  const rooms = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['admin-im-messages', selectedRoom?.id],
    queryFn:  () => api.get(`/admin/im/rooms/${selectedRoom.id}/messages`, { params: { page: 1, limit: 30 } }).then(r => r.data),
    enabled:  !!selectedRoom?.id,
    staleTime: 10_000,
  });
  const messages = (msgData?.data ?? []).slice().reverse();

  const sendMut = useMutation({
    mutationFn: () => api.post(`/admin/im/rooms/${selectedRoom.id}/messages`, { content: msgContent }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-im-messages', selectedRoom?.id] });
      setMsg('');
      antMsg.success('Đã gửi');
    },
    onError: () => antMsg.error('Lỗi gửi tin'),
  });

  const columns = [
    {
      title: 'Phòng',
      key: 'room',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.name || `Room #${r.id.slice(0,8)}`}</Text>
          <div><Text type="secondary" style={{ fontSize: 11 }}>{r.lastMessage ? r.lastMessage.slice(0, 60) : '—'}</Text></div>
        </div>
      ),
    },
    { title: 'Loại',    dataIndex: 'type',   render: v => <Tag>{v}</Tag> },
    { title: 'Tin nhắn', key: 'msgs',         render: (_, r) => r._count?.messages ?? 0 },
    { title: 'Thành viên', key: 'parts',      render: (_, r) => r._count?.participants ?? 0 },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => <Button size="small" icon={<MessageOutlined />} onClick={() => setRoom(r)}>Xem</Button>,
    },
  ];

  return (
    <div>
      <Table dataSource={rooms} columns={columns} rowKey="id" loading={isLoading} size="small"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showSizeChanger: false }} />

      {/* Chat modal */}
      <Modal
        open={!!selectedRoom}
        title={<span><MessageOutlined /> {selectedRoom?.name || `Room #${selectedRoom?.id?.slice(0,8)}`}</span>}
        onCancel={() => { setRoom(null); setMsg(''); }}
        footer={null}
        width={560}
        destroyOnHidden
      >
        {/* Messages */}
        <div style={{ height: 300, overflowY: 'auto', padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 12 }}>
          {msgLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Text type="secondary">Đang tải...</Text></div>
          ) : messages.map((m, i) => (
            <div key={m.id ?? i} style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                  {m.senderId} · {new Date(m.createdAt).toLocaleString('vi')}
                </div>
                <div style={{ background: '#f7f8fa', borderRadius: 6, padding: '4px 10px', fontSize: 13 }}>{m.content}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Send input */}
        <Flex gap={8}>
          <Input
            value={msgContent}
            onChange={e => setMsg(e.target.value)}
            onPressEnter={() => msgContent.trim() && sendMut.mutate()}
            placeholder="Nhập tin nhắn..."
            style={{ flex: 1 }}
          />
          <Button type="primary" icon={<SendOutlined />} loading={sendMut.isPending}
            disabled={!msgContent.trim()} onClick={() => sendMut.mutate()}>Gửi</Button>
        </Flex>
      </Modal>
    </div>
  );
}

// ── Tickets Tab ───────────────────────────────────────────────────────────────
function TicketsTab() {
  const { message: antMsg } = App.useApp();
  const qc = useQueryClient();
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState('open');
  const [replyModal, setReplyModal] = useState(null);
  const [replyText,  setReplyText]  = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-im-tickets', page, status],
    queryFn:  () => api.get('/admin/im/tickets', { params: { page, limit: 20, status: status || undefined } }).then(r => r.data),
    staleTime: 15_000,
  });
  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/admin/im/tickets/${id}`, body),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-im-tickets'] }); antMsg.success('Đã cập nhật'); },
    onError:    () => antMsg.error('Lỗi'),
  });

  const replyMut = useMutation({
    mutationFn: () => api.post(`/admin/im/tickets/${replyModal.id}/reply`, { content: replyText }),
    onSuccess:  () => { setReplyModal(null); setReplyText(''); antMsg.success('Đã trả lời'); },
    onError:    () => antMsg.error('Lỗi gửi trả lời'),
  });

  const columns = [
    {
      title: 'Tiêu đề',
      key: 'subject',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.subject}</Text>
          <div><Text type="secondary" style={{ fontSize: 11 }}>#{r.id.slice(0,8)} · User: {r.userId}</Text></div>
        </div>
      ),
    },
    { title: 'Danh mục', dataIndex: 'category', render: v => <Tag>{v}</Tag> },
    { title: 'Ưu tiên',  dataIndex: 'priority',  render: v => <Tag color={TICKET_PRIORITY_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Trạng thái',dataIndex: 'status',   render: v => <Badge status={v === 'open' ? 'processing' : 'default'} text={<Tag color={TICKET_STATUS_COLOR[v] ?? 'default'}>{v}</Tag>} /> },
    { title: 'Trả lời',   key: 'replies',        render: (_, r) => r._count?.replies ?? 0 },
    { title: 'Thời gian', dataIndex: 'createdAt', render: v => <Text type="secondary" style={{ fontSize: 11 }}>{new Date(v).toLocaleString('vi')}</Text> },
    {
      title: '', key: 'actions', width: 160,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button size="small" icon={<SendOutlined />} onClick={() => { setReplyModal(r); setReplyText(''); }}>Trả lời</Button>
          {r.status === 'open' && (
            <Button size="small" icon={<CheckOutlined />} type="primary"
              loading={updateMut.isPending} onClick={() => updateMut.mutate({ id: r.id, status: 'resolved' })}>Giải quyết</Button>
          )}
        </Space>
      ),
    },
  ];

  const STATUS_TABS = [['open','Mở'],['in_progress','Đang xử lý'],['resolved','Đã giải quyết'],['closed','Đóng'],['','Tất cả']];

  return (
    <div className="space-y-3">
      <Space size={4}>
        {STATUS_TABS.map(([v, l]) => (
          <Button key={v} size="small" type={status === v ? 'primary' : 'default'} onClick={() => { setStatus(v); setPage(1); }}>{l}</Button>
        ))}
      </Space>
      <Table dataSource={rows} columns={columns} rowKey="id" loading={isLoading} size="small" scroll={{ x: 800 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `${t} tickets`, onChange: p => setPage(p) }} />

      <Modal open={!!replyModal} title={`Trả lời: ${replyModal?.subject}`}
        onOk={() => replyText.trim() && replyMut.mutate()}
        onCancel={() => { setReplyModal(null); setReplyText(''); }}
        okText="Gửi trả lời" cancelText="Huỷ"
        confirmLoading={replyMut.isPending} destroyOnClose>
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Nội dung trả lời">
            <Input.TextArea rows={4} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập nội dung..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────
function BroadcastTab() {
  const { message: antMsg } = App.useApp();
  const [content,  setContent]  = useState('');
  const [segment,  setSegment]  = useState('all');
  const [preview,  setPreview]  = useState(false);

  const broadMut = useMutation({
    mutationFn: () => api.post('/admin/im/broadcast', { content, segment }),
    onSuccess:  (res) => {
      antMsg.success(`Đã gửi tới ${res.data?.data?.sentCount ?? 0} phòng chat`);
      setContent('');
      setPreview(false);
    },
    onError: () => antMsg.error('Lỗi broadcast'),
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <Form layout="vertical">
        <Form.Item label="Đối tượng gửi">
          <Select
            value={segment}
            onChange={setSegment}
            style={{ width: 200 }}
            options={[
              { label: 'Tất cả người dùng', value: 'all' },
              { label: 'VIP',               value: 'vip' },
              { label: 'Người dùng mới',    value: 'new' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Nội dung tin nhắn" required>
          <Input.TextArea
            rows={5}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập nội dung thông báo broadcast..."
            showCount
            maxLength={1000}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<NotificationOutlined />}
              disabled={!content.trim()}
              onClick={() => setPreview(true)}
            >
              Xem trước & Gửi
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        open={preview}
        title="Xác nhận Broadcast"
        onOk={() => broadMut.mutate()}
        onCancel={() => setPreview(false)}
        okText="Gửi ngay" cancelText="Huỷ"
        confirmLoading={broadMut.isPending}
        okButtonProps={{ danger: true }}
      >
        <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
          <Descriptions.Item label="Đối tượng"><Tag>{segment}</Tag></Descriptions.Item>
          <Descriptions.Item label="Nội dung">
            <div style={{ background: '#f7f8fa', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>{content}</div>
          </Descriptions.Item>
        </Descriptions>
        <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
          Tin sẽ được gửi tới TẤT CẢ phòng chat của nhóm "{segment}". Không thể thu hồi.
        </Text>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminIMPage() {
  const TAB_ITEMS = [
    { key: 'rooms',     label: 'Phòng Chat',       children: <RoomsTab /> },
    { key: 'tickets',   label: 'Support Tickets',  children: <TicketsTab /> },
    { key: 'broadcast', label: 'Broadcast',        children: <BroadcastTab /> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>IM / Chat & Support</Title>
      <Tabs defaultActiveKey="rooms" items={TAB_ITEMS} />
    </div>
  );
}
