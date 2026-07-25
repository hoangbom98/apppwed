// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const schema = yup.object({
  username:      yup.string().min(3).max(30).required('Vui lòng nhập tên đăng nhập'),
  email:         yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password:      yup.string().min(6, 'Tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
  full_name:     yup.string().optional(),
  referral_code: yup.string().optional(),
});
type FormValues = yup.InferType<typeof schema>;

export const RegisterForm: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore() as any;
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await registerUser(data);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {[
        { name: 'username'      as const, label: 'Tên đăng nhập',           placeholder: 'user123',          type: 'text' },
        { name: 'email'         as const, label: 'Email',                    placeholder: 'email@example.com', type: 'email' },
        { name: 'password'      as const, label: 'Mật khẩu',                 placeholder: '••••••••',         type: 'password' },
        { name: 'full_name'     as const, label: 'Họ tên (tuỳ chọn)',        placeholder: 'Nguyễn Văn A',     type: 'text' },
        { name: 'referral_code' as const, label: 'Mã giới thiệu (tuỳ chọn)', placeholder: 'XXXXXXXX',         type: 'text' },
      ].map(({ name, label, placeholder, type }) => (
        <div key={name}>
          <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
          <div className="relative">
            <input
              {...register(name)}
              type={name === 'password' ? (showPwd ? 'text' : 'password') : type}
              placeholder={placeholder}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
            {name === 'password' && (
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          {errors[name] && <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors[name]?.message}</p>}
        </div>
      ))}
      <button type="submit" disabled={isLoading}
        className="w-full py-3.5 bg-accent hover:bg-accent/90 text-dark font-black rounded-xl disabled:opacity-50 transition-colors mt-2">
        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
      <p className="text-center text-sm text-gray-400">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-accent font-bold hover:text-accent/80">Đăng nhập</Link>
      </p>
    </form>
  );
};
