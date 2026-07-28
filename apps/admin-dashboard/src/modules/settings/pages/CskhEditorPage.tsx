// @ts-nocheck
// admin-dashboard/src/modules/settings/pages/CskhEditorPage.tsx
// Route: /settings/cskh
// Quản lý nội dung trang CSKH cho tất cả 5 project.
// Super Admin có thể chỉnh: slogan, danh sách nút chat, nút trải nghiệm,
// phần nhập code, footer — lưu vào ContentItem qua /admin/cskh/:project.
import React, { useState } from 'react';
import {
  App, Tabs, Card, Form, Input, Button, Switch, Space,
  Typography, Flex, Tag, Divider,
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCskhConfig, saveCskhConfig, CSKH_PROJECTS } from '../api/cskhApi';

const { Title, Text } = Typography;

// ── Màu & tên dự án ──────────────────────────────────────────────────────────
const PROJECT_META = {
  game:   { label: 'KJC Game',   color: '#26A17B' },
  hub:    { label: 'KJC Hub',    color: '#2563EB' },
  dating: { label: 'KJC Dating', color: '#EC4899' },
  sports: { label: 'KJC Sports', color: '#16A34A' },
  trade:  { label: 'KJC Trade',  color: '#D97706' },
};

// ── Helper: parse JSON textarea ────────────────────────────────────────────────
function safeParse(value, fallback) {
  try { return typeof value === 'string' ? JSON.parse(value) : (value ?? fallback); }
  catch { return fallback; }
}

// ── Editor form cho một project ────────────────────────────────────────────────
function ProjectEditor({ projectSlug }) {
  const { message } = App.useApp();
  const qc          = useQueryClient();
  const [form]      = Form.useForm();
  const meta        = PROJECT_META[projectSlug] ?? { label: projectSlug, color: '#888' };

  const { data, isLoading } = useQuery({
    queryKey: ['cskh-config-admin', projectSlug],
    queryFn:  () => getCskhConfig(projectSlug),
    staleTime: 60_000,
  });

  // Đẩy dữ liệu vào form khi load xong
  React.useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      slogan:            data.slogan ?? '',
      footerText:        data.footerText ?? '',
      primaryColor:      data.primaryColor ?? '',
      supportPhone:      data.supportPhone ?? '',
      supportEmail:      data.supportEmail ?? '',
      showCodeSection:   data.showCodeSection !== false,
      codePlaceholder:   data.codePlaceholder ?? '',
      codeSubmitLabel:   data.codeSubmitLabel ?? '',
      chatButtonsJson:   JSON.stringify(data.chatButtons ?? [], null, 2),
      experienceButtonsJson: JSON.stringify(data.experienceButtons ?? [], null, 2),
    });
  }, [data, form]);

  const saveMut = useMutation({
    mutationFn: (values) => {
      const payload = {
        projectName:       meta.label,
        projectKey:        projectSlug,
        slogan:            values.slogan,
        footerText:        values.footerText,
        primaryColor:      values.primaryColor,
        supportPhone:      values.supportPhone || undefined,
        supportEmail:      values.supportEmail || undefined,
        showCodeSection:   values.showCodeSection,
        codePlaceholder:   values.codePlaceholder || undefined,
        codeSubmitLabel:   values.codeSubmitLabel || undefined,
        chatButtons:       safeParse(values.chatButtonsJson, data?.chatButtons ?? []),
        experienceButtons: safeParse(values.experienceButtonsJson, data?.experienceButtons ?? []),
      };
      return saveCskhConfig(projectSlug, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cskh-config-admin', projectSlug] });
      message.success(`Đã lưu cấu hình CSKH cho ${meta.label}`);
    },
    onError: (err) => message.error(err?.response?.data?.message ?? 'Lưu thất bại'),
  });

  return (
    <Form form={form} layout="vertical" onFinish={saveMut.mutate} disabled={isLoading}>

      {/* ── Thông tin chung ──────────────────────────────────────── */}
      <Card
        size="small"
        title={<Text strong>Thông tin chung</Text>}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="slogan" label="Slogan" style={{ marginBottom: 12 }}>
          <Input.TextArea rows={2} placeholder={`Sự hài lòng của bạn chính là thành công của đội ngũ CSKH ${meta.label}`} />
        </Form.Item>

        <Form.Item name="footerText" label="Footer" style={{ marginBottom: 12 }}>
          <Input placeholder={`LIÊN MINH QUỐC TẾ ${meta.label} 2025-2026`} />
        </Form.Item>

        <Flex gap={12} wrap="wrap">
          <Form.Item name="primaryColor" label="Màu chủ đạo" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
            <Input prefix={<span style={{ width: 14, height: 14, borderRadius: 3, background: form.getFieldValue('primaryColor') || meta.color, display: 'inline-block' }} />} placeholder={meta.color} />
          </Form.Item>
          <Form.Item name="supportPhone" label="Số điện thoại" style={{ marginBottom: 0, flex: 1, minWidth: 140 }}>
            <Input placeholder="1900 xxxx" />
          </Form.Item>
          <Form.Item name="supportEmail" label="Email hỗ trợ" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <Input placeholder={`${projectSlug}@kjc.com`} />
          </Form.Item>
        </Flex>
      </Card>

      {/* ── Phần nhập code ──────────────────────────────────────── */}
      <Card size="small" title={<Text strong>Phần nhập code miễn phí</Text>} style={{ marginBottom: 16 }}>
        <Flex gap={12} wrap="wrap" align="center">
          <Form.Item name="showCodeSection" label="Hiển thị" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch />
          </Form.Item>
          <Form.Item name="codePlaceholder" label="Placeholder" style={{ marginBottom: 0, flex: 1 }}>
            <Input placeholder="Nhập mã code..." />
          </Form.Item>
          <Form.Item name="codeSubmitLabel" label="Nút submit" style={{ marginBottom: 0, width: 130 }}>
            <Input placeholder="Nhận quà" />
          </Form.Item>
        </Flex>
      </Card>

      {/* ── Nút chat nhanh ──────────────────────────────────────── */}
      <Card size="small"
        title={
          <Flex align="center" justify="space-between">
            <Text strong>Danh sách nút Chat nhanh 24/7 (JSON)</Text>
            <Tag color="blue">Tối đa 6 nút</Tag>
          </Flex>
        }
        style={{ marginBottom: 16 }}
      >
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
          Mỗi phần tử: <code>{'{"id":"consult","label":"Tư Vấn","path":"/cskh/consult","isExternal":false}'}</code>
        </Text>
        <Form.Item name="chatButtonsJson" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            placeholder='[{"id":"consult","label":"Tư Vấn","path":"/cskh/consult","isExternal":false}]'
          />
        </Form.Item>
      </Card>

      {/* ── Nút trải nghiệm ─────────────────────────────────────── */}
      <Card size="small"
        title={<Text strong>Danh sách nút Trải nghiệm (JSON)</Text>}
        style={{ marginBottom: 16 }}
      >
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
          Thông thường 3 nút: iOS, Android, Hướng dẫn.
        </Text>
        <Form.Item name="experienceButtonsJson" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={6}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
            placeholder='[{"id":"ios","label":"TẢI APP IOS","path":"/download/ios","isExternal":true}]'
          />
        </Form.Item>
      </Card>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <Flex justify="flex-end" gap={8}>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => qc.invalidateQueries({ queryKey: ['cskh-config-admin', projectSlug] })}
        >
          Tải lại
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          htmlType="submit"
          loading={saveMut.isPending}
          style={{ background: meta.color, borderColor: meta.color }}
        >
          Lưu cấu hình
        </Button>
      </Flex>
    </Form>
  );
}

// ── Page chính ─────────────────────────────────────────────────────────────────
export default function CskhEditorPage() {
  const tabs = CSKH_PROJECTS.map(slug => ({
    key:      slug,
    label:    (
      <span>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: PROJECT_META[slug]?.color,
          marginRight: 6,
        }} />
        {PROJECT_META[slug]?.label}
      </span>
    ),
    children: <ProjectEditor projectSlug={slug} />,
  }));

  return (
    <App>
      <div className="space-y-4">
        <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
          <div>
            <Title level={4} style={{ margin: 0 }}>CSKH — Cấu hình trang hỗ trợ</Title>
            <Text type="secondary">
              Quản lý nội dung trang "Trung tâm dịch vụ khách hàng" cho từng dự án.
              Thay đổi sẽ được hiển thị ngay trên ứng dụng (cache 5 phút).
            </Text>
          </div>
        </Flex>

        <Tabs
          type="card"
          items={tabs}
          size="middle"
          destroyInactiveTabPane={false}
        />
      </div>
    </App>
  );
}
