import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Users, ChevronRight } from 'lucide-react';
import { usePackages, type InvestPackage } from '../hooks/useInvest';

function PackageCard({ pkg }: { pkg: InvestPackage }) {
  const nav = useNavigate();
  const daily = Number(pkg.dailyProfit) * 100;
  const total = daily * pkg.duration;
  const slotsLeft = pkg.totalSlots > 0 ? pkg.totalSlots - pkg.usedSlots : null;

  return (
    <div
      onClick={() => nav(`/packages/${pkg.id}`)}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ border: '2px solid var(--inv-border)', background: 'var(--inv-surface)' }}
    >
      {/* Header strip */}
      <div className="px-5 py-4" style={{ background: 'var(--inv-card-bg)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white text-base">{pkg.name}</h3>
          <span className="text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
            {daily.toFixed(2)}%/ngày
          </span>
        </div>
        <p className="text-white/75 text-xs mt-1">{pkg.description ?? 'Gói đầu tư sinh lời ổn định'}</p>
      </div>

      {/* Details */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>Lợi nhuận</p>
            <p className="font-black text-lg" style={{ color: 'var(--inv-primary)' }}>{total.toFixed(0)}%</p>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>tổng {pkg.duration} ngày</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>Thời hạn</p>
            <p className="font-black text-lg">{pkg.duration}</p>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>ngày</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>Tối thiểu</p>
            <p className="font-black text-lg">${Number(pkg.minAmount).toFixed(0)}</p>
            <p className="text-xs" style={{ color: 'var(--inv-muted)' }}>USD</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--inv-muted)' }}>
            {slotsLeft !== null && (
              <span className="flex items-center gap-1">
                <Users size={12} />
                {slotsLeft > 0 ? `Còn ${slotsLeft} suất` : 'Hết slot'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {pkg.duration} ngày
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--inv-primary)' }}>
            Đầu tư ngay <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Packages() {
  const { data: packages, isLoading } = usePackages();

  return (
    <div className="px-4 pb-4">
      <div className="py-5">
        <h1 className="text-xl font-black">Gói đầu tư</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--inv-muted)' }}>Chọn gói phù hợp — lợi nhuận trả hàng ngày vào ví</p>
      </div>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--inv-primary) transparent transparent transparent' }} />
        </div>
      )}

      {!isLoading && packages?.length === 0 && (
        <div className="py-16 text-center">
          <TrendingUp size={40} color="var(--inv-muted)" className="mx-auto mb-3" />
          <p style={{ color: 'var(--inv-muted)' }}>Hiện chưa có gói đầu tư nào</p>
        </div>
      )}

      <div className="space-y-4">
        {packages?.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
      </div>
    </div>
  );
}
