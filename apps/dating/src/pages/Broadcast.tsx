import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { startStream } from '@/api/live';
import { useAuthStore } from '@/store/authStore';
import { Radio, Camera, Mic, X } from 'lucide-react';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

const CATEGORIES = ['Hẹn hò', 'Tâm sự', 'Game', 'Âm nhạc', 'Nghệ thuật'];

export default function Broadcast() {
  const navigate = useNavigate();
  useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => startStream({ title, category }),
    onSuccess: (data: any) => {
      toast.success('Đã bắt đầu live!');
      navigate(`/live/${data.stream.id}`);
    },
    onError: () => toast.error('Không thể bắt đầu live'),
  });

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400"><X size={22} /></button>
        <h1 className="text-white font-bold">Phát Live</h1>
        <div />
      </div>

      {/* Camera preview placeholder */}
      <div className="mx-4 rounded-2xl overflow-hidden bg-gray-800 aspect-[9/16] max-h-64 flex items-center justify-center mb-6">
        <Camera size={48} className="text-gray-600" />
      </div>

      <div className="flex-1 px-4 space-y-4">
        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Tiêu đề buổi live *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề hấp dẫn..."
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500" />
        </div>

        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Danh mục</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Camera size={18} className="text-green-400" /> Camera bật
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Mic size={18} className="text-green-400" /> Mic bật
          </div>
        </div>

        <Button onClick={() => !title.trim() ? toast.error('Nhập tiêu đề') : mutate()}
          loading={isPending} fullWidth size="lg">
          <Radio size={18} /> Bắt đầu Live ngay
        </Button>
      </div>
    </div>
  );
}
