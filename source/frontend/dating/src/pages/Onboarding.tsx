import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { completeOnboarding } from '@/api/auth';
import { GOALS, INTERESTS, GENDERS } from '@/utils/constants';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [genderPref, setGenderPref] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleFinish = async () => {
    if (interests.length < 3) return toast.error('Chọn ít nhất 3 sở thích');
    try {
      await completeOnboarding({ goals, interests, gender_pref: genderPref });
      setUser({ has_onboarded: true });
      navigate('/');
    } catch { toast.error('Lỗi, thử lại'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-50 flex flex-col px-6 pt-12 pb-8">
      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {[0,1,2].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-pink-400' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Bạn tìm kiếm ai?</h2>
          <p className="text-gray-500 text-sm mb-8">Chọn đối tượng bạn muốn gặp gỡ</p>
          <div className="space-y-3">
            {[
              { value: 'female', label: '♀ Tìm bạn gái', emoji: '👩' },
              { value: 'male',   label: '♂ Tìm bạn trai', emoji: '👨' },
              { value: 'all',    label: '⚧ Tất cả mọi người', emoji: '🌈' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setGenderPref(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${genderPref === opt.value ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-white'}`}>
                <span className="text-3xl">{opt.emoji}</span>
                <span className="font-semibold text-gray-900">{opt.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => genderPref ? setStep(1) : toast.error('Chọn một lựa chọn')} fullWidth className="mt-8">
            Tiếp tục →
          </Button>
        </>
      )}

      {step === 1 && (
        <>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Mục tiêu của bạn?</h2>
          <p className="text-gray-500 text-sm mb-8">Chọn tất cả điều bạn muốn</p>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(g => (
              <button key={g} onClick={() => toggle(goals, setGoals, g)}
                className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${goals.includes(g) ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 bg-white text-gray-700'}`}>
                {g}
              </button>
            ))}
          </div>
          <Button onClick={() => setStep(2)} fullWidth className="mt-8">Tiếp tục →</Button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Sở thích của bạn?</h2>
          <p className="text-gray-500 text-sm mb-4">Chọn ít nhất 3 sở thích <span className="text-pink-500 font-bold">({interests.length}/3+)</span></p>
          <div className="flex flex-wrap gap-2 mb-8">
            {INTERESTS.map(tag => (
              <button key={tag} onClick={() => toggle(interests, setInterests, tag)}
                className={`px-3 py-2 rounded-full border text-sm font-medium transition-all ${interests.includes(tag) ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600'}`}>
                {tag}
              </button>
            ))}
          </div>
          <Button onClick={handleFinish} fullWidth>
            Bắt đầu khám phá 🚀
          </Button>
        </>
      )}
    </div>
  );
}
