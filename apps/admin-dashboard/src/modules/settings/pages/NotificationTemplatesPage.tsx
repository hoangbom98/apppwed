// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/NotificationTemplatesPage.jsx
// Route: /settings/notification-tpl
// Quản lý template nội dung thông báo (Telegram + Email)
import React from 'react';
import DOMPurify from 'dompurify';
import {
  App, Card, Tabs, Form, Input, Select, Switch, Button,
  Alert, Space, Tag, Spin, Typography, Divider,
} from 'antd';
import { SaveOutlined, CopyOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { TextArea } = Input;
const { Text } = Typography;

// ── variable chips ─────────────────────────────────────────────────────────────
const ALL_VARIABLES = [
  '{domain}','{username}','{email}',
  '{order_count}','{total_amount}','{discount_amount}','{coupon_code}',
  '{order_ids}','{order_details}',
  '{amount}','{new_balance}','{method}',
  '{time}','{ip}','{device}',
  '{supplier_name}','{balance}','{error_message}',
  '{product_name}','{product_id}','{rating}','{review_content}',
  '{ticket_subject}','{ticket_content}','{reply_content}',
];

function VariableChips({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {ALL_VARIABLES.map(v => (
        <Tag
          key={v}
          color="blue"
          className="cursor-pointer select-none"
          onClick={() => onInsert?.(v)}
        >
          {v}
        </Tag>
      ))}
    </div>
  );
}

// ── template editor for one type ───────────────────────────────────────────────
function TemplateEditor({ tpl, onSaved }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [preview, setPreview] = React.useState(false);
  const qc = useQueryClient();

  React.useEffect(() => {
    if (tpl) {
      form.setFieldsValue({
        subject:   tpl.subject  ?? '',
        content:   tpl.content  ?? '',
        channel:   tpl.channel  ?? 'both',
        isActive:  tpl.isActive ?? true,
      });
    }
  }, [tpl, form]);

  const save = useMutation({
    mutationFn: (values) => api.put(`/admin/notification/templates/${tpl.type}`, values),
    onSuccess: () => {
      message.success('Đã lưu template');
      qc.invalidateQueries({ queryKey: ['notification-templates'] });
      onSaved?.();
    },
    onError: (e) => message.error(e?.response?.data?.message ?? 'Lỗi khi lưu'),
  });

  // Insert variable at cursor (basic append when no cursor tracking)
  const handleInsert = (variable) => {
    const cur = form.getFieldValue('content') ?? '';
    form.setFieldValue('content', cur + variable);
  };

  const contentValue = Form.useWatch('content', form) ?? '';

  return (
    <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
      <Alert
        type="info"
        showIcon
        message="Biến có thể sử dụng"
        description={
          <div>
            <div className="text-xs text-gray-400 mb-1">
              Nhấn vào biến để chèn vào nội dung:
            </div>
            <VariableChips onInsert={handleInsert} />
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      <Form.Item label="Kênh gửi" name="channel">
        <Select style={{ width: 220 }}>
          <Select.Option value="telegram">Telegram only</Select.Option>
          <Select.Option value="email">Email only</Select.Option>
          <Select.Option value="both">Cả hai</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={
          <span>
            Subject (tiêu đề Email)
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              Để trống nếu không gửi email
            </Text>
          </span>
        }
        name="subject"
      >
        <Input placeholder="Chủ đề email — hỗ trợ biến {domain}, {username}, …" />
      </Form.Item>

      <Form.Item
        label="Nội dung thông báo"
        name="content"
        rules={[{ required: true, message: 'Nội dung không được để trống' }]}
      >
        <TextArea
          rows={8}
          placeholder="Nhập nội dung thông báo. Hỗ trợ HTML cho email, Markdown cho Telegram."
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Form.Item>

      <Form.Item label="Kích hoạt" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Đang dùng" unCheckedChildren="Tắt" />
      </Form.Item>

      {preview && (
        <Card
          size="small"
          title="Xem trước nội dung"
          style={{ marginBottom: 16, background: '#1a1a2e' }}
        >
          <pre
            style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#e2e8f0', margin: 0 }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentValue ?? '') }}
          />
        </Card>
      )}

      <Space>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
          Lưu template
        </Button>
        <Button
          icon={<EyeOutlined />}
          onClick={() => setPreview(v => !v)}
        >
          {preview ? 'Ẩn' : 'Xem trước'}
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => { navigator.clipboard.writeText(contentValue); message.success('Đã sao chép'); }}
        >
          Sao chép
        </Button>
      </Space>
    </Form>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
function NotificationTemplatesInner() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['notification-templates'],
    queryFn:  () => api.get('/admin/notification/templates').then(r => r.data?.data ?? r.data),
  });

  const seed = useMutation({
    mutationFn: () => api.post('/admin/notification/templates/seed'),
    onSuccess: () => {
      message.success('Đã khởi tạo các template mặc định');
      qc.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => message.error('Không thể khởi tạo — cần quyền super_admin'),
  });

  const tplMap = React.useMemo(() =>
    (templates ?? []).reduce((acc, t) => { acc[t.type] = t; return acc; }, {}),
    [templates]
  );

  const tabItems = (templates ?? []).map(tpl => ({
    key:      tpl.type,
    label:    (
      <span className={!tpl.isActive ? 'opacity-40' : ''}>
        {tpl.name}
      </span>
    ),
    children: <TemplateEditor tpl={tpl} />,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Template thông báo</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Tuỳ chỉnh nội dung email và Telegram gửi đến admin / khách hàng
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Làm mới
          </Button>
          {(!templates || templates.length === 0) && (
            <Button
              type="dashed"
              loading={seed.isPending}
              onClick={() => seed.mutate()}
            >
              Khởi tạo template mặc định
            </Button>
          )}
        </Space>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : tabItems.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-400">
            <p>Chưa có template nào.</p>
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              loading={seed.isPending}
              onClick={() => seed.mutate()}
            >
              Tạo template mặc định
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Tabs
            tabPosition="left"
            items={tabItems}
            style={{ minHeight: 400 }}
          />
        </Card>
      )}
    </div>
  );
}

export default function NotificationTemplatesPage() {
  return <App><NotificationTemplatesInner /></App>;
}
