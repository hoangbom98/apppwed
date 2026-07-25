// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/GeneralSettings.jsx
// Route: /settings/general
// Cài đặt chung: hiển thị dịch vụ, đơn hàng, đăng ký tài khoản
import React from 'react';
import {
  App, Card, Form, Switch, InputNumber, Select, Input, Button,
  Tabs, Divider, Row, Col, Spin, Typography,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { Text } = Typography;

// ── helpers ────────────────────────────────────────────────────────────────────
function Label({ children, info }) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-200">{children}</span>
      {info && <div className="text-xs text-gray-500 mt-0.5">{info}</div>}
    </div>
  );
}

function SettingRow({ label, info, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
      <Label info={info}>{label}</Label>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── load / save helpers ────────────────────────────────────────────────────────
const GROUP_KEY = 'general';

function buildSettingMap(rows) {
  return rows.reduce((acc, r) => {
    try { acc[r.key] = r.value; } catch { /* ignore */ }
    return acc;
  }, {});
}

// ── inner page (uses App context for message) ──────────────────────────────────
function GeneralSettingsInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ['settings', GROUP_KEY],
    queryFn:  () => api.get(`/admin/settings?group=${GROUP_KEY}`).then(r => r.data?.data ?? r.data),
    onSuccess: (rows) => {
      const map = buildSettingMap(rows ?? []);
      form.setFieldsValue(map);
    },
  });

  // Set form values when data loads
  React.useEffect(() => {
    if (rows) {
      const map = buildSettingMap(Array.isArray(rows) ? rows : []);
      form.setFieldsValue(map);
    }
  }, [rows, form]);

  const save = useMutation({
    mutationFn: async (values) => {
      // Upsert each key-value pair
      const ops = Object.entries(values).map(([key, value]) =>
        api.post('/admin/settings', { key, value: String(value ?? ''), group: GROUP_KEY })
      );
      return Promise.all(ops);
    },
    onSuccess: () => {
      message.success('Đã lưu cài đặt chung');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => message.error('Lỗi khi lưu cài đặt'),
  });

  const tabs = [
    {
      key:      'service',
      label:    'Dịch vụ & Sản phẩm',
      children: (
        <div className="space-y-0">
          <Form.Item name="require_login_view" valuePropName="checked" noStyle>
            <SettingRow
              label="Yêu cầu đăng nhập để xem dịch vụ"
              info="Bật để yêu cầu khách hàng phải đăng nhập mới có thể xem danh sách dịch vụ"
            >
              <Form.Item name="require_login_view" valuePropName="checked" style={{ margin: 0 }}>
                <Switch />
              </Form.Item>
            </SettingRow>
          </Form.Item>

          <SettingRow
            label="Hiển thị số lượng đã bán"
            info="Bật để hiển thị số lượng đã bán của sản phẩm trên trang khách"
          >
            <Form.Item name="show_sold_count" valuePropName="checked" style={{ margin: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Cho phép đánh giá sản phẩm"
            info="Bật để cho phép khách hàng đánh giá sản phẩm sau khi mua hàng"
          >
            <Form.Item name="enable_reviews" valuePropName="checked" style={{ margin: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Ẩn gói sản phẩm khi hết hàng"
            info="Tự động ẩn gói/sản phẩm trên giao diện khách khi kho hàng = 0"
          >
            <Form.Item name="hide_out_of_stock" valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Cho phép đăng ký tài khoản"
            info="Tắt để ngừng nhận đăng ký mới từ khách hàng"
          >
            <Form.Item name="allow_registration" valuePropName="checked" style={{ margin: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
          </SettingRow>
        </div>
      ),
    },
    {
      key:      'order',
      label:    'Đơn hàng',
      children: (
        <div className="space-y-4 pt-2">
          <Form.Item
            label={<Label info="Chat ID Telegram nhận thông báo đơn hàng thủ công (bỏ trống = dùng chat ID trong Kết nối)">Chat ID nhận thông báo đơn hàng</Label>}
            name="order_notify_chat_id"
          >
            <Input placeholder="-100XXXXXXXXXX" style={{ maxWidth: 320 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<Label info="Kiểu ký tự tạo mã đơn hàng">Loại random mã đơn hàng</Label>}
                name="order_code_type"
              >
                <Select style={{ width: 220 }}>
                  <Select.Option value="number">Chỉ số (123456…)</Select.Option>
                  <Select.Option value="alphanumeric">Chữ + số (A1B2C3…)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<Label info="Tối thiểu 6, tối đa 20 ký tự">Số ký tự mã đơn hàng</Label>}
                name="order_code_length"
              >
                <InputNumber min={6} max={20} defaultValue={7} style={{ width: 120 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={<Label info="Prefix sẽ được thêm vào đầu mã đơn hàng — để trống = không dùng prefix">Prefix mã đơn hàng</Label>}
            name="order_code_prefix"
          >
            <Input placeholder="VD: PO" style={{ maxWidth: 200 }} />
          </Form.Item>

          <Divider />

          <SettingRow
            label="Tự động xác nhận đơn hàng"
            info="Bật để tự động chuyển trạng thái đơn sang 'Đã xử lý' mà không cần Admin duyệt thủ công"
          >
            <Form.Item name="order_auto_confirm" valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Cho phép khách hủy đơn"
            info="Bật để khách hàng có thể tự hủy đơn hàng đang chờ xử lý"
          >
            <Form.Item name="order_allow_cancel" valuePropName="checked" style={{ margin: 0 }}>
              <Switch defaultChecked />
            </Form.Item>
          </SettingRow>
        </div>
      ),
    },
    {
      key:      'registration',
      label:    'Đăng ký tài khoản',
      children: (
        <div className="space-y-4 pt-2">
          <SettingRow
            label="Xác minh email khi đăng ký"
            info="Yêu cầu khách hàng xác minh email trước khi kích hoạt tài khoản"
          >
            <Form.Item name="reg_require_email_verify" valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          </SettingRow>

          <SettingRow
            label="Yêu cầu mã giới thiệu khi đăng ký"
            info="Chỉ cho phép đăng ký khi có mã giới thiệu hợp lệ"
          >
            <Form.Item name="reg_require_referral" valuePropName="checked" style={{ margin: 0 }}>
              <Switch />
            </Form.Item>
          </SettingRow>

          <Form.Item
            label={<Label info="Tiền thưởng cộng vào tài khoản khi đăng ký thành công (0 = không có)">Thưởng đăng ký mới (VND)</Label>}
            name="reg_bonus_amount"
          >
            <InputNumber
              min={0}
              step={1000}
              defaultValue={0}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              style={{ width: 180 }}
            />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Cài đặt chung</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tuỳ chỉnh hoạt động của toàn bộ hệ thống</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : (
        <Card>
          <Form form={form} layout="vertical" onFinish={v => save.mutate(v)}>
            <Tabs items={tabs} />
            <Divider />
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={save.isPending}
              size="large"
            >
              Lưu cài đặt
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
}

export default function GeneralSettings() {
  return <App><GeneralSettingsInner /></App>;
}
