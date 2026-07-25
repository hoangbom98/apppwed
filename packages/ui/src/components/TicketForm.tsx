// @ts-nocheck
// packages/shared-ui/src/components/TicketForm.tsx
import React, { useState } from 'react';
import { Button, Input, Select } from 'antd';

const { TextArea } = Input;

interface TicketFormProps {
  onSubmit?:   (data: { subject: string; category: string; content: string }) => void;
  loading?:    boolean;
  categories?: string[];
  apiClient?:  any;
  onSuccess?:  () => void;
  onCancel?:   () => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  onSubmit, loading = false,
  categories = ['Nạp tiền', 'Rút tiền', 'Tài khoản', 'Game', 'Khác'],
}) => {
  const [subject,  setSubject]  = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [content,  setContent]  = useState('');

  const handleSubmit = () => {
    if (!subject.trim() || !content.trim()) return;
    onSubmit?.({ subject, category, content });
    setSubject(''); setContent('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Select value={category} onChange={setCategory} options={categories.map(c => ({ value: c, label: c }))} />
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Tiêu đề" />
      <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mô tả vấn đề..." rows={4} />
      <Button type="primary" onClick={handleSubmit} loading={loading}>Gửi yêu cầu</Button>
    </div>
  );
};
