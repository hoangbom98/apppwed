import React, { useState } from 'react';

/**
 * RegisterForm — reusable registration form
 * Usage:
 *   <RegisterForm
 *     onSubmit={async ({ email, password, fullName, phone }) => { ... }}
 *     loading={false}
 *     error="Email already exists"
 *     fields={['email', 'phone', 'fullName', 'password']}  // optional field selection
 *   />
 */
export default function RegisterForm({
  onSubmit,
  loading = false,
  error,
  title = 'Đăng ký',
  fields = ['fullName', 'email', 'password'],
}) {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key) => (e) => setFormData((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (fields.includes('password') && formData.password !== formData.confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (onSubmit) onSubmit(formData);
  };

  const displayError = error || formError;

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">{title}</h1>

      {displayError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.includes('fullName') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input type="text" required value={formData.fullName} onChange={set('fullName')}
              placeholder="Nguyễn Văn A" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
        )}

        {fields.includes('email') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={set('email')}
              placeholder="your@email.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
        )}

        {fields.includes('phone') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input type="tel" value={formData.phone} onChange={set('phone')}
              placeholder="0901234567" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
        )}

        {fields.includes('password') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={formData.password} onChange={set('password')}
                placeholder="Tối thiểu 8 ký tự" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        )}

        {fields.includes('password') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input type="password" required value={formData.confirmPassword} onChange={set('confirmPassword')}
              placeholder="Nhập lại mật khẩu" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
}
