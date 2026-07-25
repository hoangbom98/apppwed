import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getVipPlans, subscribeVip } from '@/api/vip';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { Crown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const VIP_COLORS_BG: Record<string, string> = {
  gold:    'from-yellow-400 to-amber-500',
  diamond: 'from-cyan-400 to-blue-500',
  royal:   'from-purple-500 to-pink-500',
};

const VIP_PERKS: Record<string, string[]> = {
  gold:    ['Unlimited Like', 'Ẩn khoảng cách', 'Xem ai Like bạn', '1 Super Like/ngày', 'Badge Gold'],
  diamond: ['Tất cả Gold', '5 Boost/tháng', 'Ẩn Online', 'Xem đã xem profile', 'Badge Diamond'],
  royal:   ['Tất cả Diamond', 'Boost không giới hạn', 'Ưu tiên hiển thị', 'Profile nổi bật', 'Badge Royal'],
};

export default function Vip() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['vip-plans'], queryFn: getVipPlans });
  const plans = data?.plans || [];

  const subMut = useMutation({
    mutationFn: subscribeVip,
    onSuccess: () => { toast.success('Nâng cấp VIP thành công!'); navigate('/profile'); },
    onError: () => toast.error('Không đủ xu hoặc lỗi thanh toán'),
  });

  return (
    <div>
      <PageHeader title="VIP Membership" />

      {/* Hero */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-5 text-center mb-6">
          <Crown size={40} className="text-amber-300 mx-auto mb-2" />
          <h2 className="text-white font-black text-xl">Nâng cấp VIP</h2>
          <p className="text-white/80 text-sm mt-1">Mở khóa toàn bộ tính năng cao cấp</p>
        </div>

        {plans.length === 0 ? (
          <div className="space-y-4">
            {Object.entries(VIP_PERKS).map(([tier, perks]) => (
              <div key={tier} className={`rounded-2xl overflow-hidden bg-gradient-to-br ${VIP_COLORS_BG[tier]} p-0.5`}>
                <div className="bg-white rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${VIP_COLORS_BG[tier]} text-white text-sm font-bold`}>
                        <Crown size={14} /> {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900">---</p>
                      <p className="text-xs text-gray-400">xu/tháng</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {perks.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check size={14} className="text-green-500 flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                  <Button fullWidth variant="secondary">Đăng ký ngay</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan: any) => {
              // features may be a JSON string, an array, or undefined
              const rawFeatures = plan.features;
              const perks: string[] =
                Array.isArray(rawFeatures)
                  ? rawFeatures
                  : typeof rawFeatures === 'string'
                  ? (() => { try { return JSON.parse(rawFeatures); } catch { return []; } })()
                  : VIP_PERKS[plan.tier] || [];

              return (
                <div key={plan.id} className={`rounded-2xl overflow-hidden bg-gradient-to-br ${VIP_COLORS_BG[plan.tier] || 'from-gray-400 to-gray-500'} p-0.5`}>
                  <div className="bg-white rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${VIP_COLORS_BG[plan.tier] || ''} text-white text-sm font-bold`}>
                        <Crown size={14} /> {plan.name}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">{plan.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">xu/tháng</p>
                      </div>
                    </div>
                    {perks.length > 0 && (
                      <ul className="space-y-2 mb-5">
                        {perks.map((p: string) => (
                          <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check size={14} className="text-green-500 flex-shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button onClick={() => subMut.mutate(plan.id)} loading={subMut.isPending} fullWidth>
                      Đăng ký ngay
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
