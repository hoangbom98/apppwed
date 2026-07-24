import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendOtp, verifyOtp } from '@/api/auth';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

export default function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as any)?.phone || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      toast.success('Xác minh thành công!');
      navigate('/');
    } catch { toast.error('OTP không đúng'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-2xl font-black text-gray-900">Xác minh OTP</h2>
        <p className="text-gray-500 mt-2 text-sm">Nhập mã 6 số gửi về <span className="font-semibold text-gray-900">{phone}</span></p>
      </div>

      <div className="flex gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <input key={i} maxLength={1} value={otp[i] || ''}
            onChange={e => {
              const val = e.target.value.replace(/\D/, '');
              const next = otp.split('');
              next[i] = val;
              setOtp(next.join('').slice(0, 6));
              if (val && e.target.nextSibling) (e.target.nextSibling as HTMLInputElement).focus();
            }}
            className="w-12 h-14 border-2 border-gray-200 rounded-2xl text-center text-2xl font-bold focus:outline-none focus:border-pink-400"
          />
        ))}
      </div>

      <Button onClick={handleVerify} loading={loading} fullWidth disabled={otp.length < 6} className="max-w-xs">
        Xác minh
      </Button>
      <button onClick={() => sendOtp(phone).then(() => toast.success('Đã gửi lại OTP'))}
        className="mt-4 text-sm text-pink-500">
        Gửi lại OTP
      </button>
    </div>
  );
}
