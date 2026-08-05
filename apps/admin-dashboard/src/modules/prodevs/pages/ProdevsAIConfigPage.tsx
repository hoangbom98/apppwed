import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Button, App, Typography, Flex, Card, Select, Switch } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const AI_PROVIDERS = [
  { value: 'openai',     label: 'OpenAI (GPT-4)' },
  { value: 'anthropic',  label: 'Anthropic (Claude)' },
  { value: 'gemini',     label: 'Google Gemini' },
  { value: 'local',      label: 'Local Model (Ollama)' },
];

export default function ProdevsAIConfigPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['prodevs-ai-config'],
    queryFn:  () => api.get('/admin/prodevs/ai-config').then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (values: any) => api.put('/admin/prodevs/ai-config', values),
    onSuccess: () => {
      message.success('Đã lưu cấu hình AI');
      qc.invalidateQueries({ queryKey: ['prodevs-ai-config'] });
    },
    onError: () => message.error('Lưu thất bại'),
  });

  return (
    <div className="space-y-4">
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>ProDevs — Cấu hình AI</div>
        <Text type="secondary">Cấu hình model AI cho tính năng code generation</Text>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={saveMut.mutate} disabled={isLoading}>
          <Form.Item name="provider" label="AI Provider" rules={[{ required: true }]}>
            <Select options={AI_PROVIDERS} placeholder="Chọn provider" style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key">
            <Input.Password placeholder="sk-..." style={{ maxWidth: 400 }} />
          </Form.Item>
          <Form.Item name="model" label="Model">
            <Input placeholder="gpt-4-turbo, claude-3-5-sonnet, ..." style={{ maxWidth: 300 }} />
          </Form.Item>
          <Form.Item name="maxTokens" label="Max Tokens">
            <Input type="number" placeholder="4096" style={{ maxWidth: 200 }} />
          </Form.Item>
          <Form.Item name="enabled" label="Kích hoạt AI" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saveMut.isPending}>
            Lưu cấu hình
          </Button>
        </Form>
      </Card>
    </div>
  );
}
