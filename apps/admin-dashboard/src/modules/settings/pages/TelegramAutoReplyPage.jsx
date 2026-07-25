// frontend/admin-dashboard/src/modules/settings/pages/TelegramAutoReplyPage.jsx
// Route: /settings/telegram-bot
// CRUD auto-reply rules + test simulator cho CSKH Bot
import React from 'react';
import DOMPurify from 'dompurify';
import {
  App, Card, Form, Input, InputNumber, Switch, Select, Button,
  Table, Space, Tag, Tooltip, Alert, Modal, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  PlayCircleOutlined, ReloadOutlined, RobotOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { value: 'greeting', label: '👋 Chào hỏi',   color: 'cyan' },
  { value: 'finance',  label: '💰 Tài chính',   color: 'gold' },
  { value: 'support',  label: '🆘 Hỗ trợ',      color: 'blue' },
  { value: 'promo',    label: '🎁 Khuyến mãi',   color: 'purple' },
  { value: 'fallback', label: '📌 Fallback',     color: 'red' },
];

// ── Seed mặc định ─────────────────────────────────────────────────────────────
const DEFAULT_RULES = [
  { keyword: 'nạp tiền', category: 'finance', priority: 10, isRegex: false, ignoreCase: true,
    reply: '💳 <b>Hướng dẫn nạp tiền LKVIP:</b>\n\n• Chuyển khoản ngân hàng · Momo · ZaloPay · USDT\n• Nạp tối thiểu: <b>50,000 VND</b>\n• Xử lý trong 2–5 phút\n\n🔗 <a href="https://lkvip.group/deposit">lkvip.group/deposit</a>' },
  { keyword: 'rút tiền', category: 'finance', priority: 10, isRegex: false, ignoreCase: true,
    reply: '🏦 <b>Hướng dẫn rút tiền LKVIP:</b>\n\n• Rút về ngân hàng, Momo, ZaloPay, USDT\n• Tối thiểu: <b>100,000 VND</b>\n• Xử lý: 5–30 phút\n\n🔗 <a href="https://lkvip.group/withdraw">lkvip.group/withdraw</a>' },
  { keyword: 'khuyến mãi|bonus|ưu đãi', category: 'promo', priority: 8, isRegex: true, ignoreCase: true,
    reply: '🎁 <b>Khuyến mãi LKVIP:</b>\n\n🔥 Nạp lần đầu: Bonus 100%\n💎 VIP Daily: Hoàn tiền 0.5%\n🤝 Giới thiệu bạn: 5% hoa hồng\n\n📣 <a href="https://lkvip.group/promotions">Xem tất cả ưu đãi</a>' },
  { keyword: 'đăng ký|register|tạo tài khoản', category: 'support', priority: 9, isRegex: true, ignoreCase: true,
    reply: '📝 <b>Đăng ký tài khoản LKVIP:</b>\n\n1️⃣ <a href="https://lkvip.group/register">lkvip.group/register</a>\n2️⃣ Điền thông tin + mã giới thiệu\n3️⃣ Xác nhận email/SĐT\n4️⃣ Nhận ngay <b>50,000 VND</b> trải nghiệm! 🎁' },
  { keyword: 'hỗ trợ|liên hệ|support', category: 'support', priority: 5, isRegex: true, ignoreCase: true,
    reply: '🆘 <b>Liên hệ hỗ trợ LKVIP:</b>\n\n📧 Email: support@lkvip.group\n💬 Live chat: <a href="https://lkvip.group/support">lkvip.group/support</a>\n\n⚡ Phản hồi trong 5 phút' },
  { keyword: 'xin chào|hello|hi|chào', category: 'greeting', priority: 3, isRegex: true, ignoreCase: true,
    reply: '👋 <b>Xin chào!</b> Chào mừng bạn đến với LKVIP!\n\nNhập /help để xem danh sách lệnh hỗ trợ, hoặc mô tả vấn đề của bạn 🤝' },
];

// ── Rule Form Modal ───────────────────────────────────────────────────────────
function RuleModal({ open, onClose, initial, onSaved }) {
  const { message } = App.useApp();
  const [form]      = Form.useForm();
  const qc          = useQueryClient();
  const isEdit      = !!initial?.id;

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue(initial ?? {
        category: 'support', isRegex: false, ignoreCase: true, priority: 0, isActive: true,
      });
    }
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: (values) => isEdit
      ? api.patch(`/admin/telegram/auto-replies/${initial.id}`, values)
      : api.post('/admin/telegram/auto-replies', values),
    onSuccess: () => {
      message.success(isEdit ? 'Đã cập nhật rule' : 'Đã tạo rule mới');
      qc.invalidateQueries({ queryKey: ['telegram-auto-replies'] });
      onSaved?.();
      onClose();
    },
    onError: (e) => message.error(e?.response?.data?.message || 'Lỗi khi lưu'),
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEdit ? '✏️ Sửa Auto-Reply Rule' : '➕ Tạo Auto-Reply Rule mới'}
      footer={null}
      width={640}
    >
      <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} style={{ marginTop: 16 }}>
        <Form.Item
          name="keyword"
          label="Từ khoá / Pattern"
          rules={[{ required: true, message: 'Bắt buộc' }]}
          extra="Ví dụ: 'nạp tiền' hoặc regex 'nạp|deposit'"
        >
          <Input placeholder="nạp tiền" />
        </Form.Item>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item name="isRegex" label="Regex" valuePropName="checked">
            <Switch size="small" />
          </Form.Item>
          <Form.Item name="ignoreCase" label="Không phân biệt hoa/thường" valuePropName="checked">
            <Switch size="small" defaultChecked />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch size="small" defaultChecked />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="category" label="Danh mục">
            <Select options={CATEGORY_OPTIONS} />
          </Form.Item>
          <Form.Item name="priority" label="Ưu tiên (cao = khớp trước)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item
          name="reply"
          label="Nội dung trả lời (HTML Telegram)"
          rules={[{ required: true, message: 'Bắt buộc' }]}
          extra="Hỗ trợ: <b>, <i>, <a href='...'>, <code>"
        >
          <TextArea rows={6} style={{ fontFamily: 'monospace', fontSize: 13 }} />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            {isEdit ? 'Cập nhật' : 'Tạo rule'}
          </Button>
          <Button onClick={onClose}>Huỷ</Button>
        </Space>
      </Form>
    </Modal>
  );
}

// ── Test simulator panel ──────────────────────────────────────────────────────
function TestSimulator({ ruleId }) {
  const { message } = App.useApp();
  const [testText, setTestText]   = React.useState('');
  const [result,   setResult]     = React.useState(null);
  const [loading,  setLoading]    = React.useState(false);

  const runTest = async () => {
    if (!testText.trim()) { message.warning('Nhập văn bản test'); return; }
    setLoading(true);
    try {
      const res = await api.post(`/admin/telegram/auto-replies/${ruleId}/test`, { text: testText });
      setResult(res.data?.data);
    } catch {
      message.error('Test thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input.Search
        placeholder="Nhập văn bản mô phỏng tin nhắn user..."
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        onSearch={runTest}
        enterButton={<><PlayCircleOutlined /> Test</>}
        loading={loading}
      />
      {result && (
        <Alert
          type={result.matched ? 'success' : 'warning'}
          message={result.message}
          description={result.matched
            ? <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.preview ?? '') }} />
            : null
          }
          showIcon
        />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function TelegramAutoReplyInner() {
  const { message } = App.useApp();
  const qc          = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing,   setEditing]   = React.useState(null);
  const [testingId, setTestingId] = React.useState(null);

  const { data: rules, isLoading, refetch } = useQuery({
    queryKey: ['telegram-auto-replies'],
    queryFn:  () => api.get('/admin/telegram/auto-replies').then((r) => r.data?.data ?? r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/telegram/auto-replies/${id}`),
    onSuccess:  () => { message.success('Đã xóa rule'); qc.invalidateQueries({ queryKey: ['telegram-auto-replies'] }); },
    onError:    () => message.error('Không thể xóa'),
  });

  // Seed default rules
  const seedMutation = useMutation({
    mutationFn: () => Promise.all(DEFAULT_RULES.map((r) => api.post('/admin/telegram/auto-replies', r))),
    onSuccess:  () => { message.success('Đã tạo rules mặc định'); qc.invalidateQueries({ queryKey: ['telegram-auto-replies'] }); },
    onError:    () => message.error('Seed thất bại'),
  });

  const columns = [
    {
      title: 'Từ khoá', dataIndex: 'keyword', width: 200,
      render: (v, row) => (
        <Space size={4}>
          <code style={{ fontSize: 12 }}>{v}</code>
          {row.isRegex && <Tag color="purple" style={{ fontSize: 11 }}>regex</Tag>}
        </Space>
      ),
    },
    {
      title: 'Danh mục', dataIndex: 'category', width: 130,
      render: (v) => {
        const opt = CATEGORY_OPTIONS.find((o) => o.value === v);
        return <Tag color={opt?.color ?? 'default'}>{opt?.label ?? v}</Tag>;
      },
    },
    {
      title: 'Trả lời', dataIndex: 'reply',
      render: (v) => (
        <Tooltip title={<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(v ?? '') }} />}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {v?.replace(/<[^>]+>/g, '').slice(0, 60)}{v?.length > 60 ? '…' : ''}
          </span>
        </Tooltip>
      ),
    },
    { title: 'Hits', dataIndex: 'hitCount', width: 70, align: 'center' },
    { title: 'Ưu tiên', dataIndex: 'priority', width: 80, align: 'center' },
    {
      title: 'Bật', dataIndex: 'isActive', width: 70, align: 'center',
      render: (v) => <Badge status={v ? 'success' : 'default'} />,
    },
    {
      title: '', key: 'actions', width: 130,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Test rule">
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => setTestingId(testingId === row.id ? null : row.id)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => { setEditing(row); setModalOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button
              size="small" danger
              icon={<DeleteOutlined />}
              onClick={() => deleteMutation.mutate(row.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rows = Array.isArray(rules) ? rules : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RobotOutlined /> Bot CSKH — Auto-Reply
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Quy tắc trả lời tự động khi bot nhận tin nhắn — hỗ trợ từ khóa & regex
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>Làm mới</Button>
          {rows.length === 0 && (
            <Button type="dashed" loading={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
              Tạo rules mặc định
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            Thêm rule
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        message="Cách hoạt động: khi bot nhận tin nhắn, hệ thống duyệt từ rule có ưu tiên cao nhất → khớp keyword → gửi nội dung trả lời. Nếu không khớp, Groq AI sẽ trả lời (nếu đã cấu hình GROQ_API_KEY)."
      />

      <Card>
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          expandable={{
            expandedRowKeys: testingId ? [testingId] : [],
            onExpand: (_, row) => setTestingId((prev) => (prev === row.id ? null : row.id)),
            expandedRowRender: (row) => (
              <div className="py-2 max-w-lg">
                <div className="text-xs text-gray-400 mb-2">Simulator — nhập tin nhắn mô phỏng user:</div>
                <TestSimulator ruleId={row.id} />
              </div>
            ),
            expandIcon: () => null,
          }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <RuleModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        initial={editing}
        onSaved={() => setModalOpen(false)}
      />
    </div>
  );
}

export default function TelegramAutoReplyPage() {
  return <App><TelegramAutoReplyInner /></App>;
}
