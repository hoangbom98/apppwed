/**
 * XoSo.tsx — Lottery / Mini-Game page (Xổ số)
 * Route: /lottery  (also alias /xo-so)
 *
 * Features:
 * - List available lottery types (PC28, MARK6, K3, KENO …)
 * - View current open draw + countdown
 * - Place bet (TAI/XIU, BIG/SMALL, ODD/EVEN, exact number)
 * - My bets history for selected type
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

// ─── API helpers ──────────────────────────────────────────────────────────────
import api from '@/api/httpClient';

const getLotteryTypes  = () => api.get('/lottery/types').then(r => r.data);
const getCurrentDraw   = (typeId: string) =>
  api.get(`/lottery/draws/current/${typeId}`).then(r => r.data);
const getMyBets        = (typeId?: string) =>
  api.get('/lottery/my-bets', { params: typeId ? { typeId } : {} }).then(r => r.data);
const placeBet         = (body: {
  drawId: string; typeId: string;
  betType: string; betChoice?: string; amount: number;
}) => api.post('/lottery/bet', body).then(r => r.data);

// ─── Types ────────────────────────────────────────────────────────────────────
type BetOption = { key: string; label: string; odds: string };

const BET_OPTIONS: Record<string, BetOption[]> = {
  default: [
    { key: 'BIG',   label: 'Lớn',   odds: '1.95×' },
    { key: 'SMALL', label: 'Nhỏ',   odds: '1.95×' },
    { key: 'ODD',   label: 'Lẻ',    odds: '1.95×' },
    { key: 'EVEN',  label: 'Chẵn',  odds: '1.95×' },
    { key: 'TAI',   label: 'Tài',   odds: '1.95×' },
    { key: 'XIU',   label: 'Xỉu',   odds: '1.95×' },
  ],
};

const QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000, 1_000_000];
function fmtVND(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('vi-VN');
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ drawTime }: { drawTime: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(drawTime).getTime() - Date.now()) / 1000));
      setSecs(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [drawTime]);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  const isUrgent = secs < 60;
  return (
    <span className={`font-mono font-black text-2xl ${isUrgent ? 'text-red-400' : 'text-yellow-400'}`}>
      {m}:{s}
    </span>
  );
}

// ─── Result badge ─────────────────────────────────────────────────────────────
function ResultBadge({ result }: { result: any }) {
  if (!result) return <span className="text-gray-500 text-sm">Chưa có kết quả</span>;
  const num = result.number ?? result.result ?? '?';
  const isBig  = num > 14;
  const isOdd  = num % 2 !== 0;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-black text-dark text-lg">{num}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isBig ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-400'}`}>
        {isBig ? 'Lớn/Tài' : 'Nhỏ/Xỉu'}
      </span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOdd ? 'bg-purple-900/40 text-purple-400' : 'bg-green-900/40 text-green-400'}`}>
        {isOdd ? 'Lẻ' : 'Chẵn'}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function XoSo() {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;

  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<any>(null);
  const [selectedBet,  setSelectedBet]  = useState<string>('');
  const [amount,       setAmount]        = useState<number>(50_000);
  const [msg,          setMsg]           = useState({ text: '', ok: true });

  // ── Lottery types ──────────────────────────────────────────────
  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['lottery-types'],
    queryFn:  getLotteryTypes,
  });
  const types: any[] = typesData?.data ?? [];

  // Select first type once loaded
  useEffect(() => {
    if (!selectedType && types.length) setSelectedType(types[0]);
  }, [types, selectedType]);

  // ── Current draw ───────────────────────────────────────────────
  const { data: drawData, isLoading: drawLoading } = useQuery({
    queryKey: ['lottery-draw', selectedType?.id],
    queryFn:  () => getCurrentDraw(selectedType!.id),
    enabled:  !!selectedType,
    refetchInterval: 10_000,
  });
  const draw: any = drawData?.data ?? null;

  // ── My bets ────────────────────────────────────────────────────
  const { data: betsData } = useQuery({
    queryKey: ['lottery-my-bets', selectedType?.id],
    queryFn:  () => getMyBets(selectedType?.id),
    enabled:  !!selectedType,
    refetchInterval: 15_000,
  });
  const myBets: any[] = betsData?.data ?? [];

  // ── Place bet mutation ─────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: placeBet,
    onSuccess: () => {
      setMsg({ text: 'Đặt cược thành công!', ok: true });
      setSelectedBet('');
      qc.invalidateQueries({ queryKey: ['lottery-my-bets'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: any) => {
      setMsg({ text: e.response?.data?.message || 'Lỗi đặt cược', ok: false });
    },
  });

  const handleBet = () => {
    if (!draw) return setMsg({ text: 'Không có kỳ mở cược', ok: false });
    if (!selectedBet) return setMsg({ text: 'Chọn lựa đặt cược', ok: false });
    if (amount < 10_000) return setMsg({ text: 'Số tiền tối thiểu 10.000đ', ok: false });
    setMsg({ text: '', ok: true });
    mutation.mutate({ drawId: draw.id, typeId: selectedType.id, betType: selectedBet, amount });
  };

  const betOptions = BET_OPTIONS[selectedType?.code ?? ''] ?? BET_OPTIONS.default;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-yellow-500 flex items-center justify-center text-xs font-bold text-dark">XS</div>
        <div>
          <h1 className="font-extrabold text-base text-white">Xổ Số</h1>
          <p className="text-[10px] text-gray-400">Mini Game · Xổ số trực tuyến</p>
        </div>
        {user && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-gray-500">Số dư</p>
            <p className="text-sm font-black text-accent">{fmtVND((user as any).balance ?? 0)}đ</p>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* ── Type selector ──────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {typesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-8 bg-gray-800 rounded-full animate-pulse flex-shrink-0" />
              ))
            : types.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedType(t); setSelectedBet(''); }}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedType?.id === t.id
                      ? 'bg-yellow-500 text-dark'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t.name}
                </button>
              ))
          }
        </div>

        {/* ── Draw info card ─────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3 border border-white/5">
          {drawLoading
            ? <div className="h-24 bg-gray-800 animate-pulse rounded-xl" />
            : draw
              ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Kỳ quay</p>
                      <p className="font-mono text-white font-bold text-sm">{draw.period}</p>
                    </div>
                    <div className="text-right">
                      {draw.status === 'WAITING' ? (
                        <>
                          <p className="text-xs text-gray-500 mb-0.5">Đóng cược sau</p>
                          <Countdown drawTime={draw.drawTime} />
                        </>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-green-900/40 text-green-400 text-xs font-bold">
                          Đã quay
                        </span>
                      )}
                    </div>
                  </div>
                  {draw.resultOfficial && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kết quả</p>
                      <ResultBadge result={draw.resultOfficial} />
                    </div>
                  )}
                </>
              )
              : (
                <div className="text-center py-6 text-gray-500">
                  <p>Chưa có kỳ mở cược</p>
                </div>
              )
          }
        </div>

        {/* ── Bet panel (only when draw is WAITING) ─────────────── */}
        {draw?.status === 'WAITING' && (
          <div className="bg-gray-900 rounded-2xl p-4 space-y-4 border border-white/5">
            <p className="text-sm font-bold text-white">Đặt cược</p>

            {/* Bet options grid */}
            <div className="grid grid-cols-3 gap-2">
              {betOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedBet(opt.key)}
                  className={`p-3 rounded-xl text-center transition-all border ${
                    selectedBet === opt.key
                      ? 'bg-yellow-500 border-yellow-400 text-dark'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <p className="font-black text-base">{opt.label}</p>
                  <p className={`text-[10px] mt-0.5 ${selectedBet === opt.key ? 'text-dark/70' : 'text-gray-500'}`}>
                    {opt.odds}
                  </p>
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Số tiền cược</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {QUICK_AMOUNTS.map(v => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      amount === v ? 'bg-accent text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {fmtVND(v)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-accent"
                placeholder="Nhập số tiền..."
              />
            </div>

            {/* Summary */}
            {selectedBet && amount > 0 && (
              <div className="bg-gray-800/60 rounded-xl p-3 text-xs text-gray-400 flex justify-between">
                <span>Cược: <b className="text-white">{selectedBet}</b> · {fmtVND(amount)}đ</span>
                <span>Thắng tối đa: <b className="text-yellow-400">{fmtVND(amount * 1.95)}đ</b></span>
              </div>
            )}

            {/* Message */}
            {msg.text && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                msg.ok ? 'bg-green-900/40 text-green-400 border border-green-800/40'
                       : 'bg-red-900/40 text-red-400 border border-red-800/40'
              }`}>
                {msg.text}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleBet}
              disabled={mutation.isPending || !selectedBet}
              className="w-full py-3.5 rounded-xl font-black text-sm bg-yellow-500 text-dark hover:bg-yellow-400 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Đang xử lý...' : 'XÁC NHẬN ĐẶT CƯỢC'}
            </button>
          </div>
        )}

        {/* ── My bets history ────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">Lịch sử cược của tôi</p>
          </div>
          {myBets.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              <p>Chưa có lịch sử cược</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {myBets.slice(0, 20).map((bet: any) => (
                <div key={bet.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{bet.betType}</p>
                    <p className="text-[10px] text-gray-500">
                      Kỳ {bet.draw?.period ?? bet.drawId} · {fmtVND(bet.amount)}đ
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      bet.status === 'WIN'      ? 'bg-green-900/40 text-green-400' :
                      bet.status === 'LOSE'     ? 'bg-red-900/40 text-red-400'    :
                      bet.status === 'CANCELLED'? 'bg-gray-700 text-gray-400'     :
                                                  'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {bet.status === 'WIN' ? `+${fmtVND(bet.payout)}` :
                       bet.status === 'LOSE' ? 'Thua' :
                       bet.status === 'PENDING' ? 'Chờ' : bet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
