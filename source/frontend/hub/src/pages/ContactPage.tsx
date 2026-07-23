// frontend/hub/src/pages/ContactPage.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitFeedback } from '../api/hub';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => setDone(true),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate(form);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Liên hệ / Phản hồi</h1>
      {done ? (
        <div className="bg-green-900/40 border border-green-700 rounded-lg p-6 text-green-400 text-center">
          ✅ Cảm ơn! Chúng tôi đã nhận được phản hồi của bạn.
        </div>
      ) : (
        <form onSubmit={submit} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Họ tên</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nội dung *</label>
            <textarea required rows={5} value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
          <button type="submit" disabled={mut.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg disabled:opacity-60">
            {mut.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </form>
      )}
    </div>
  );
}
