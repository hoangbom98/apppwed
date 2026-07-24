import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '@/api/profile';
import { uploadAvatar } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'full_name',  label: 'Họ và tên', type: 'text' },
  { key: 'bio',        label: 'Giới thiệu bản thân', type: 'textarea' },
  { key: 'city',       label: 'Thành phố', type: 'text' },
  { key: 'height',     label: 'Chiều cao (cm)', type: 'number' },
  { key: 'weight',     label: 'Cân nặng (kg)', type: 'number' },
  { key: 'education',  label: 'Học vấn', type: 'text' },
  { key: 'job',        label: 'Nghề nghiệp', type: 'text' },
];

const MARRIAGE_OPTIONS = ['Độc thân', 'Đang hẹn hò', 'Đã kết hôn', 'Ly hôn'];
const SMOKING_OPTIONS = ['Không', 'Thỉnh thoảng', 'Thường xuyên'];
const DRINKING_OPTIONS = ['Không', 'Thỉnh thoảng', 'Thường xuyên'];

export default function EditProfile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState<Record<string, any>>(user || {});

  const updateMut = useMutation({
    mutationFn: () => updateProfile(form),
    onSuccess: (data: any) => {
      setUser(data.user || form);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Cập nhật thành công!');
      navigate('/profile');
    },
    onError: () => toast.error('Lỗi cập nhật'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const data = await uploadAvatar(fd);
      setUser({ avatar: data.avatar_url });
      setForm(f => ({ ...f, avatar: data.avatar_url }));
      toast.success('Ảnh đại diện đã cập nhật!');
    } catch { toast.error('Lỗi upload ảnh'); }
  };

  return (
    <div>
      <PageHeader title="Chỉnh sửa hồ sơ" />

      <div className="px-4 pb-8 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <label className="relative cursor-pointer">
            <img src={form.avatar || ''} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-pink-200 bg-gray-100" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white">
              <Camera size={14} className="text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <p className="text-xs text-gray-400 mt-2">Nhấn để đổi ảnh đại diện</p>
        </div>

        {/* Fields */}
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea rows={3} value={form[f.key] || ''}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400 resize-none"
                placeholder={f.label} />
            ) : (
              <input type={f.type} value={form[f.key] || ''}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-400"
                placeholder={f.label} />
            )}
          </div>
        ))}

        {/* Select fields */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tình trạng hôn nhân</label>
          <div className="flex flex-wrap gap-2">
            {MARRIAGE_OPTIONS.map(o => (
              <button key={o} onClick={() => setForm(f => ({ ...f, marriage: o }))}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${form.marriage === o ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={() => updateMut.mutate()} loading={updateMut.isPending} fullWidth size="lg">
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
