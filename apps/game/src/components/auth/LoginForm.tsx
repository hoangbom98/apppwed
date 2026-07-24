import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const schema = yup.object({
  email:    yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
});
type FormValues = yup.InferType<typeof schema>;

export const LoginForm: React.FC = () => {
  const [showPwd, setShowPwd] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data);
      toast.success('Đăng nhập thành công!');
      navigate(redirect);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
        <input
          {...register('email')} type="email" placeholder="email@example.com"
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
        />
        {errors.email && <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>}
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Mật khẩu</label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPwd ? 'text' : 'password'} placeholder="••••••••"
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isLoading}
        className="w-full py-3.5 bg-accent hover:bg-accent/90 text-dark font-black rounded-xl disabled:opacity-50 transition-colors text-base">
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
      <p className="text-center text-sm text-gray-400">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-accent font-bold hover:text-accent/80">Đăng ký ngay</Link>
      </p>
    </form>
  );
};
