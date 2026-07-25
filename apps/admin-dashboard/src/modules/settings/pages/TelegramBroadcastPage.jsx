// frontend/admin-dashboard/src/modules/settings/pages/TelegramBroadcastPage.jsx
// Route: /settings/telegram-broadcast
// Soạn & gửi tin nhắn Telegram tới channel / group / admin
import React from 'react';
import DOMPurify from 'dompurify';
import {
  App, Card, Form, Input, Select, Button, Alert, Tag,
  Table, Space, Tooltip, Badge, Typography,
} from 'antd';
import {
  SendOutlined, EyeOutlined, DeleteOutlined, ReloadOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { TextArea } = Input;
const { Text } = Typography;

// ── Template thư viện nhanh ────────────────────────────────────────────────────
const QUICK_TEMPLATES = [
  {
    label: '⚽ Trận đấu sắp diễn ra',
    content:
      '⚽🌟 <b>{team1} 🆚 {team2}</b>\n' +
      '⏳ Hôm nay · {time}\n\n' +
      '🤑 Đặt cược & Dự đoán: <a href="https://lkvip.group/sports">' +
      'lkvip.group/sports</a>',
  },
  {
    label: '🎁 Mã quà tặng Flashdrop',
    content:
      '🎁 <b>LKVIP FLASHDROP!</b>\n\n' +
      '🔑 Mã: <code>{code}</code>\n' +
      '💰 Thưởng: <b>{reward}</b>\n' +
      '⚡ Điều kiện: {condition}\n\n' +
      '⏰ Hết hạn lúc {expires} — nhận ngay!\n' +
      '🔗 <a href="https://lkvip.group/promotions">lkvip.group/promotions</a>',
  },
  {
    label: '⚠️ Cảnh báo bảo mật',
    content:
      '⚠️ <b>CẢNH BÁO AN NINH</b>\n\n' +
      'Phát hiện website giả mạo LKVIP.\n\n' +
      '✅ <b>Website chính thức duy nhất:</b> <a href="https://lkvip.group">lkvip.group</a>\n\n' +
      'Không nhập thông tin tài khoản vào các domain khác!\n' +
      'Liên hệ hỗ trợ nếu nghi ngờ bị lừa đảo.',
  },
  {
    label: '🔧 Thông báo bảo trì',
    content:
      '🔧 <b>Thông báo bảo trì hệ thống</b>\n\n' +
      '📅 Thời gian: <b>{date}</b>\n' +
      '⏱ Dự kiến: <b>{duration}</b>\n\n' +
      'Trong thời gian này hệ thống sẽ tạm ngừng hoạt động.\n' +
      'Chúng tôi xin lỗi vì sự bất tiện này.',
  },
  {
    label: '🏆 Cột mốc sản phẩm',
    content:
      '🏆 <b>LKVIP ĐẠT CỘT MỐC MỚI!</b>\n\n' +
      '📊 {metric}: <b>{amount}</b>\n\n' +
      'Cảm ơn toàn bộ cộng đồng LKVIP đã tin tưởng và đồng hành! 🙏\n\n' +
      '🚀 Tiếp tục hành trình tại: <a href="https://lkvip.group">lkvip.group</a>',
  },
  {
    label: '📊 Tổng kết tuần',
    content:
      '📊 <b>TỔNG KẾT TUẦN LKVIP</b>\n\n' +
      '👥 Người dùng active: <b>{active_users}</b>\n' +
      '💰 Doanh thu: <b>{revenue}</b>\n' +
      '🎮 Lượt chơi: <b>{total_bets}</b>\n\n' +
      'Cùng nhau xây dựng cộng đồng LKVIP lớn mạnh hơn! 💪',
  },
];

// ── Target options ─────────────────────────────────────────────────────────────
const TARGET_OPTIONS = [
  { value: 'channel', label: '📢 Kênh thông báo (Channel)', color: 'blue' },
  { value: 'group',   label: '👥 Nhóm cộng đồng (Group)',  color: 'green' },
  { value: 'admin',   label: '🔒 Admin nội bộ',            color: 'orange' },
];

const STATUS_COLOR = { sent: 'success', failed: 'error', pending: 'processing' };
const STATUS_LABEL = { sent: 'Đã gửi', failed: 'Thất bại', pending: 'Chờ' };

// ── Compose form ──────────────────────────────────────────────────────────────
function ComposeForm({ onSent }) {
  const { message } = App.useApp();
  const [form]      = Form.useForm();
  const [preview, setPreview] = React.useState('');

  const sendMutation = useMutation({
    mutationFn: (values) => api.post('/admin/telegram/broadcasts', values),
    onSuccess:  (res) => {
      message.success(`Đã gửi! Message ID: ${res.data?.data?.messageId ?? '—'}`);
      form.resetFields();
      setPreview('');
      onSent?.();
    },
    onError: (e) => message.error(e?.response?.data?.message || 'Gửi thất bại'),
  });

  const previewMutation = useMutation({
    mutationFn: (values) => api.post('/admin/telegram/broadcasts/preview', values),
    onSuccess:  (res) => setPreview(res.data?.data?.rendered || ''),
    onError:    () => message.error('Không thể render preview'),
  });

  const handleQuickTemplate = (tpl) => {
    form.setFieldValue('content', tpl.content);
    setPreview('');
  };

  const handlePreview = () => {
    const vals = form.getFieldsValue();
    previewMutation.mutate({ content: vals.content || '' });
  };

  return (
    <Form form={form} layout="vertical" onFinish={(v) => sendMutation.mutate(v)}>
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">Template nhanh:</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((t) => (
            <Tag
              key={t.label}
              className="cursor-pointer"
              color="geekblue"
              onClick={() => handleQuickTemplate(t)}
            >
              {t.label}
            </Tag>
          ))}
        </div>
      </div>

      <Form.Item
        name="target"
        label="Gửi tới"
        initialValue="channel"
        rules={[{ required: true }]}
      >
        <Select options={TARGET_OPTIONS} style={{ width: 280 }} />
      </Form.Item>

      <Form.Item
        name="parseMode"
        label="Parse Mode"
        initialValue="HTML"
      >
        <Select style={{ width: 160 }}>
          <Select.Option value="HTML">HTML</Select.Option>
          <Select.Option value="Markdown">Markdown</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="content"
        label={
          <span>
            Nội dung tin nhắn
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              Hỗ trợ HTML: &lt;b&gt;, &lt;i&gt;, &lt;a href&gt;, &lt;code&gt;
            </Text>
          </span>
        }
        rules={[{ required: true, message: 'Nội dung không được để trống' }]}
      >
        <TextArea
          rows={8}
          placeholder={'Nhập nội dung...\n\nVí dụ:\n<b>Tiêu đề</b>\nNội dung với {biến} sẽ được thay thế'}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Form.Item>

      {preview && (
        <Card
          size="small"
          title="Preview nội dung đã render"
          style={{ marginBottom: 16, background: '#0d1117' }}
          extra={<Button size="small" onClick={() => setPreview('')}>Đóng</Button>}
        >
          <pre
            style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#e2e8f0', margin: 0 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preview ?? '') }}
          />
        </Card>
      )}

      <Space>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SendOutlined />}
          loading={sendMutation.isPending}
          size="large"
        >
          Gửi ngay
        </Button>
        <Button
          icon={<EyeOutlined />}
          loading={previewMutation.isPending}
          onClick={handlePreview}
        >
          Preview
        </Button>
      </Space>
    </Form>
  );
}

// ── History table ──────────────────────────────────────────────────────────────
function BroadcastHistory() {
  const { message } = App.useApp();
  const qc          = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telegram-broadcasts'],
    queryFn:  () => api.get('/admin/telegram/broadcasts?limit=30').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/telegram/broadcasts/${id}`),
    onSuccess:  () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['telegram-broadcasts'] }); },
    onError:    () => message.error('Không thể xóa'),
  });

  const items = data?.data?.items ?? data?.data ?? [];

  const columns = [
    {
      title: 'Target', dataIndex: 'targetName', width: 110,
      render: (v) => {
        const opt = TARGET_OPTIONS.find((o) => o.value === v);
        return <Tag color={opt?.color ?? 'default'}>{opt?.label ?? v}</Tag>;
      },
    },
    {
      title: 'Nội dung', dataIndex: 'content',
      render: (v) => (
        <Tooltip title={v}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {v?.slice(0, 80)}{v?.length > 80 ? '…' : ''}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 100,
      render: (v) => <Badge status={STATUS_COLOR[v] ?? 'default'} text={STATUS_LABEL[v] ?? v} />,
    },
    {
      title: 'Gửi lúc', dataIndex: 'sentAt', width: 160,
      render: (v) => v ? new Date(v).toLocaleString('vi-VN') : '—',
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_, row) => (
        <Button
          danger size="small" icon={<DeleteOutlined />}
          onClick={() => deleteMutation.mutate(row.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">30 tin nhắn gần nhất</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          Làm mới
        </Button>
      </div>
      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={false}
        scroll={{ x: 600 }}
      />
    </div>
  );
}

// ── Config status bar ─────────────────────────────────────────────────────────
function ConfigStatus() {
  const { message } = App.useApp();
  const { data, refetch } = useQuery({
    queryKey: ['telegram-config'],
    queryFn:  () => api.get('/admin/telegram/config').then((r) => r.data?.data),
  });

  const reload = useMutation({
    mutationFn: () => api.post('/admin/telegram/config/reload'),
    onSuccess:  () => { message.success('Config đã reload!'); refetch(); },
    onError:    () => message.error('Reload thất bại'),
  });

  if (!data) return null;

  return (
    <Alert
      type={data.configured ? 'success' : 'warning'}
      showIcon
      message={
        <Space>
          <span>
            Bot: <b>{data.configured ? '✅ Đã cấu hình' : '⚠️ Chưa cấu hình'}</b>
            {data.channelId && <> · Channel: <code>{data.channelId}</code></>}
            {data.groupId   && <> · Group: <code>{data.groupId}</code></>}
          </span>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={reload.isPending}
            onClick={() => reload.mutate()}
          >
            Reload config
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            (Sau khi lưu token mới trong Cài đặt → Tích hợp)
          </Text>
        </Space>
      }
      style={{ marginBottom: 20 }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function TelegramBroadcastInner() {
  const qc = useQueryClient();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            ✈️ Telegram Broadcast
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Soạn và gửi tin nhắn tới Channel · Group · Admin — có lịch sử đầy đủ
          </p>
        </div>
        <Button
          icon={<SettingOutlined />}
          onClick={() => window.location.href = '/settings/integrations'}
        >
          Cấu hình Bot
        </Button>
      </div>

      <ConfigStatus />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="📝 Soạn tin nhắn">
          <ComposeForm onSent={() => qc.invalidateQueries({ queryKey: ['telegram-broadcasts'] })} />
        </Card>

        <Card title="📜 Lịch sử gửi">
          <BroadcastHistory />
        </Card>
      </div>
    </div>
  );
}

export default function TelegramBroadcastPage() {
  return <App><TelegramBroadcastInner /></App>;
}
