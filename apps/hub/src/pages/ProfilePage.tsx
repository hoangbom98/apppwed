// frontend/hub/src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, changePassword } from '../api/hub';
import Spinner from '../components/Spinner';

export default function ProfilePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'password'>('info');
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ current_password: '', new_password: '' });

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const profile = data?.data?.data;

  // Controlled form state — initialized from profile once loaded (fixes uncontrolled/defaultValue mixing)
  const [form, setForm] = useState({ full_name: '', lang: '' });

  // Sync form when profile loads (only on first load via profile?.id change)
  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name ?? '', lang: profile.preferred_language ?? 'vi' });
    }
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); setMsg('Đã cập nhật!'); },
  });
  const pwMut = useMutation({
    mutationFn: changePassword,
    onSuccess: () => { setMsg('Đã đổi mật khẩu!'); setPw({ current_password: '', new_password: '' }); },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setMsg(error?.response?.data?.message || 'Lỗi');
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Tài khoản</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {(['info', 'password'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg(''); }}
            className={`px-4 py-1.5 text-sm rounded-t ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'info' ? 'Thông tin' : 'Mật khẩu'}
          </button>
        ))}
      </div>

      {msg && <p className="text-green-400 text-sm">{msg}</p>}

      {tab === 'info' && profile && (
        <form onSubmit={e => {
            e.preventDefault();
            updateMut.mutate({ full_name: form.full_name, preferred_language: form.lang });
          }}
          className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Họ tên</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-gray-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ngôn ngữ</label>
            <select
              value={form.lang}
              onChange={e => setForm({ ...form, lang: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-gray-100 focus:outline-none">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <button type="submit" disabled={updateMut.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60">
            Lưu thay đổi
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={e => { e.preventDefault(); pwMut.mutate(pw); }} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mật khẩu hiện tại</label>
            <input type="password" value={pw.current_password} onChange={e => setPw({...pw, current_password: e.target.value})} required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-gray-100 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mật khẩu mới</label>
            <input type="password" value={pw.new_password} onChange={e => setPw({...pw, new_password: e.target.value})} required
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm text-gray-100 focus:outline-none" />
          </div>
          <button type="submit" disabled={pwMut.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60">
            Đổi mật khẩu
          </button>
        </form>
      )}
    </div>
  );
}
