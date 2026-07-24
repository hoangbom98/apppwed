import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getShopItems, buyItem } from '@/api/shop';
import PageHeader from '@/components/common/PageHeader';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'gift',  label: '🎁 Quà tặng' },
  { id: 'frame', label: '🖼 Khung ảnh' },
  { id: 'theme', label: '🎨 Theme' },
  { id: 'bubble', label: '💬 Bong bóng' },
  { id: 'avatar', label: '✨ Viền Avatar' },
];

export default function Shop() {
  const [cat, setCat] = useState('gift');
  const { data, isLoading } = useQuery({ queryKey: ['shop', cat], queryFn: () => getShopItems(cat) });
  const items = data?.items || [];

  const buyMut = useMutation({
    mutationFn: buyItem,
    onSuccess: () => toast.success('Mua thành công!'),
    onError: () => toast.error('Không đủ xu'),
  });

  return (
    <div>
      <PageHeader title="Cửa hàng" />

      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${cat === c.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 px-4">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 px-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                <span className="text-3xl">{item.icon || '🎁'}</span>
              </div>
              <p className="text-xs font-semibold text-gray-900 text-center">{item.name}</p>
              <p className="text-xs text-pink-500 font-bold">🪙 {item.price}</p>
              <button onClick={() => buyMut.mutate(item.id)}
                className="w-full py-1.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-xs font-semibold rounded-lg active:scale-95 transition-transform">
                Mua
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
