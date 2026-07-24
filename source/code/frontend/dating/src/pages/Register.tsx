import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { sendOtp } from '@/api/auth';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { ASSET_UI } from '@/utils/constants';

const STEPS = ['SĐT', 'OTP', 'Thông tin', 'Avatar'];

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [step, setStep]   = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp]     = useState('');
  const [name, setName]   = useState('');
  const [dob, setDob]     = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity]   = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [file, setFile]   = useState<File | null>(null);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 9) return toast.error('Nhập số điện thoại hợp lệ');
    try { await sendOtp(phone); toast.success('OTP đã gửi!'); setStep(1); }
    catch { toast.error('Lỗi gửi OTP'); }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) setStep(2);
    else toast.error('OTP phải 6 số');
  };

  const handleInfo = () => {
    if (!name || !dob || !gender || !city) return toast.error('Điền đầy đủ thông tin');
    setStep(3);
  };

  const handleFinish = async () => {
    try { await register({ phone, otp, full_name: name, dob, gender, city, avatar }); navigate('/onboarding'); }
    catch { toast.error('Đăng ký thất bại'); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setAvatar(URL.createObjectURL(f)); }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `url(${ASSET_UI.LOGIN_BG}) no-repeat 0 0`,
        backgroundSize: 'auto 100%',
        animation: 'bgSlide 30s linear infinite',
      }}
    >
      <style>{`
        @keyframes bgSlide {
          0%, 100% { background-position-x: 0; }
          50%       { background-position-x: 100%; }
        }
      `}</style>

      {/* Dark overlay */}
      <div className="flex-1 flex flex-col px-6 pt-12 pb-8" style={{ background: 'rgba(40,40,40,0.51)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="text-white/70 hover:text-white">
              <ChevronLeft size={24} />
            </button>
          )}
          {/* Progress */}
          <div className="flex gap-1.5 flex-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-pink-400' : 'bg-white/20'
              }`} />
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-1">
          {['Số điện thoại', 'Xác minh OTP', 'Thông tin cá nhân', 'Ảnh đại diện'][step]}
        </h2>
        <p className="text-white/60 text-sm mb-8">
          {['Nhập SĐT để đăng ký', 'Nhập mã OTP đã gửi', 'Điền thông tin của bạn', 'Chọn ảnh đẹp nhất'][step]}
        </p>

        {step === 0 && (
          <div className="space-y-4">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0987 654 321"
              type="tel"
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400" />
            <button onClick={handleSendOtp}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
              Tiếp tục →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <input key={i} maxLength={1} value={otp[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/, '');
                    const next = otp.split('');
                    next[i] = val;
                    setOtp(next.join('').slice(0, 6));
                    if (val && e.target.nextSibling) (e.target.nextSibling as HTMLInputElement).focus();
                  }}
                  className="w-11 h-12 bg-black/30 border-2 border-white/20 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-pink-400"
                />
              ))}
            </div>
            <button onClick={handleVerifyOtp} disabled={otp.length < 6}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              Xác minh
            </button>
            <button onClick={handleSendOtp} className="w-full text-sm text-pink-400 text-center">Gửi lại OTP</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {[
              { val: name, set: setName, ph: 'Họ và tên', type: 'text' },
              { val: dob,  set: setDob,  ph: 'Ngày sinh', type: 'date' },
              { val: city, set: setCity, ph: 'Thành phố (VD: Hà Nội)', type: 'text' },
            ].map(f => (
              <input key={f.ph} value={f.val} onChange={e => f.set(e.target.value)}
                placeholder={f.ph} type={f.type}
                className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-pink-400" />
            ))}
            <div className="flex gap-3">
              {['male', 'female', 'other'].map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className={`flex-1 py-3 text-sm rounded-xl border-2 transition-all ${
                    gender === g
                      ? 'border-pink-400 bg-pink-500/20 text-pink-300 font-semibold'
                      : 'border-white/20 text-white/60'
                  }`}>
                  {g === 'male' ? '♂ Nam' : g === 'female' ? '♀ Nữ' : '⚧ Khác'}
                </button>
              ))}
            </div>
            <button onClick={handleInfo}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
              Tiếp tục →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 flex flex-col items-center">
            <label className="w-32 h-32 rounded-full border-4 border-dashed border-pink-400/50 cursor-pointer flex flex-col items-center justify-center bg-black/20 hover:bg-black/30 transition-colors relative overflow-hidden">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover rounded-full" />
                : <><Camera size={32} className="text-pink-400" /><span className="text-xs text-pink-400 mt-2">Chọn ảnh</span></>}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <div className="w-full space-y-3">
              <button onClick={handleFinish} disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Hoàn tất đăng ký 🎉
              </button>
              <button onClick={handleFinish} className="w-full text-sm text-white/40 text-center">
                Bỏ qua, thêm sau
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto pt-6 text-center">
          <p className="text-sm text-white/60">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-pink-400 font-semibold">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
