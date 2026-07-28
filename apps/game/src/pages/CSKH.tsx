// @ts-nocheck
// apps/game/src/pages/CSKH.tsx
// Trang Trung tâm CSKH — dùng component dùng chung, config từ backend (fallback về static config).
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CskhPage, api } from '@lkvip/ui';
import { gameCskhConfig } from '../configs/cskh.config';
import toast from 'react-hot-toast';

export default function CSKH() {
  // Load config từ backend — nếu admin chưa set, backend trả về default
  const { data: remoteConfig } = useQuery({
    queryKey: ['cskh-config', 'game'],
    queryFn: () => api.get('/admin/cskh/game').then(r => r.data?.data ?? r.data),
    staleTime: 5 * 60_000,  // cache 5 phút
    retry: false,
  });

  const config = remoteConfig ?? gameCskhConfig;

  const handleSubmitCode = async (code: string) => {
    await api.post('/admin/giftcodes/redeem', { code }).then(r => {
      if (!r.data?.success) throw new Error(r.data?.message ?? 'Mã không hợp lệ');
    });
    toast.success('Nhận quà thành công!');
  };

  return <CskhPage config={config} onSubmitCode={handleSubmitCode} />;
}
