// @ts-nocheck
// apps/dating/src/pages/CSKH.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CskhPage, api } from '@lkvip/ui';
import { datingCskhConfig } from '../configs/cskh.config';
import toast from 'react-hot-toast';

export default function CSKH() {
  const { data: remoteConfig } = useQuery({
    queryKey: ['cskh-config', 'dating'],
    queryFn: () => api.get('/admin/cskh/dating').then(r => r.data?.data ?? r.data),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const config = remoteConfig ?? datingCskhConfig;

  const handleSubmitCode = async (code: string) => {
    await api.post('/admin/giftcodes/redeem', { code }).then(r => {
      if (!r.data?.success) throw new Error(r.data?.message ?? 'Mã không hợp lệ');
    });
    toast.success('Nhận quà thành công!');
  };

  return <CskhPage config={config} onSubmitCode={handleSubmitCode} />;
}
