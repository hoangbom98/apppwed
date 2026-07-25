import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBettingEvents, placeBet } from '@/api/sports';
import { useAuthStore } from '@/store/authStore';
import { Trophy, TrendingUp, AlertCircle, Clock, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@ui';

// ── Types ─────────────────────────────────────────────────────────────────────
type BetEvent = {
  id: string;
  matchId: string;
  status: string;        // live | scheduled | finished
  homeTeam: string;
  awayTeam: string;
  leagueName: string;
  kickoff: string;
  minute?: number;
  markets: Array<{
    id: string;
    marketType: string;
    odds: Array<{ id: string; selection: string; label: string; odds: number }>;
  }>;
};

type BetSlip = {
  eventId: string;
  oddsId: string;
  marketId: string;
  homeTeam: string;
  awayTeam: string;
  label: string;
  odds: number;
};

export default function BettingPage() {
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [betSlip, setBetSlip]  = useState<BetSlip[]>([]);
  const [stake, setStake]       = useState('');
  const [filter, setFilter]     = useState<'all'|'live'|'upcoming'>('all');
  const [showSlip, setShowSlip] = useState(false);

  // ── Fetch betting events (matches with open markets + odds) ─────────────────
  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['bettingEvents', filter],
    queryFn: () => getBettingEvents({ status: filter === 'all' ? undefined : filter }),
    refetchInterval: 30_000,
  });

  const events: BetEvent[] = eventsRes?.data ?? [];

  // ── Place bet mutation ────────────────────────────────────────────────────────
  const placeBetMutation = useMutation({
    mutationFn: () => placeBet({
      type: 'single',
      stake: parseFloat(stake),
      items: betSlip.map(b => ({
        marketId:  b.marketId,
        oddsId:    b.oddsId,
        selection: b.label,
        oddsValue: b.odds,
      })),
    }),
    onSuccess: () => {
      toast.success('Đặt cược thành công!');
      setBetSlip([]);
      setStake('');
      setShowSlip(false);
      qc.invalidateQueries({ queryKey: ['myBets'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Đặt cược thất bại. Vui lòng thử lại.');
    },
  });

  const totalOdds    = betSlip.reduce((acc, b) => acc * b.odds, 1);
  const potentialWin = betSlip.length > 0 ? parseFloat(stake || '0') * totalOdds : 0;

  const MARKET_LABELS: Record<string, string> = { home: 'Chủ nhà', draw: 'Hòa', away: 'Khách', over: 'Tài', under: 'Xỉu' };

  const addToBetSlip = (event: BetEvent, marketId: string, oddsItem: { id: string; selection: string; label: string; odds: number }) => {
    if (!isLoggedIn) return;
    const existing = betSlip.findIndex(b => b.eventId === event.id);
    const newItem: BetSlip = {
      eventId: event.id, oddsId: oddsItem.id, marketId,
      homeTeam: event.homeTeam, awayTeam: event.awayTeam,
      label: oddsItem.label, odds: oddsItem.odds,
    };
    if (existing >= 0) {
      if (betSlip[existing].oddsId === oddsItem.id) {
        setBetSlip(prev => prev.filter(b => b.eventId !== event.id));
      } else {
        setBetSlip(prev => prev.map(b => b.eventId === event.id ? newItem : b));
      }
    } else {
      setBetSlip(prev => [...prev, newItem]);
      setShowSlip(true);
    }
  };

  // ── Fallback display from real match data if no events yet ───────────────────
  const displayItems = events.length > 0 ? events : [];

  return (
    <div className="pb-20 px-3 py-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" /> Cá cược thể thao
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Tỉ lệ cược realtime</p>
        </div>
        {betSlip.length > 0 && (
          <button onClick={() => setShowSlip(!showSlip)}
            className="relative flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold">
            <TrendingUp size={14} />
            Phiếu cược
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {betSlip.length}
            </span>
          </button>
        )}
      </div>

      {/* Auth notice */}
      {!isLoggedIn && (
        <div className="flex items-center gap-3 p-4 bg-yellow-950/50 border border-yellow-900/50 rounded-xl text-yellow-400">
          <AlertCircle size={16} />
          <p className="text-sm">
            <Link to="/login" className="font-semibold underline">Đăng nhập</Link>{' '}
            để đặt cược và nhận thưởng
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['all','live','upcoming'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filter === f ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {f === 'all' ? 'Tất cả' : f === 'live' ? <><Zap size={10} className="inline mr-1" />Trực tiếp</> : <><Clock size={10} className="inline mr-1" />Sắp diễn ra</>}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-2" />
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[0,1,2].map(j => <div key={j} className="h-10 bg-gray-800 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match cards */}
      {!isLoading && (
        <div className="space-y-3">
          {displayItems.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
              <p className="text-gray-400 text-sm">Không có trận đấu nào khả dụng</p>
            </div>
          ) : (
            displayItems.map(event => {
              const isLive = event.status === 'live';
              // Get 1x2 market (or first available)
              const market1x2 = event.markets?.find(m => m.marketType === '1x2') ?? event.markets?.[0];
              const homeOdds = market1x2?.odds?.find(o => o.selection === 'home');
              const drawOdds = market1x2?.odds?.find(o => o.selection === 'draw');
              const awayOdds = market1x2?.odds?.find(o => o.selection === 'away');

              return (
                <div key={event.id} className={`bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
                  isLive ? 'border-green-700/60' : 'border-gray-800'
                }`}>
                  {/* Match header */}
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
                    <span className="text-xs text-gray-400 font-medium">{event.leagueName}</span>
                    {isLive ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        LIVE {event.minute ? `${event.minute}'` : ''}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500">
                        {new Date(event.kickoff).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="font-bold text-white text-sm leading-tight">{event.homeTeam}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Chủ nhà</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-white font-black text-lg">VS</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-white text-sm leading-tight">{event.awayTeam}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Khách</p>
                    </div>
                  </div>

                  {/* Odds buttons (1x2) */}
                  {market1x2 && (
                    <div className="grid grid-cols-3 gap-2 px-4 pb-4">
                      {[homeOdds, drawOdds, awayOdds].filter(Boolean).map(oddsItem => {
                        if (!oddsItem) return null;
                        const isSelected = betSlip.some(b => b.oddsId === oddsItem.id);
                        return (
                          <button
                            key={oddsItem.id}
                            onClick={() => addToBetSlip(event, market1x2.id, oddsItem)}
                            disabled={!isLoggedIn}
                            className={`relative py-2.5 rounded-xl text-sm font-bold transition-all ${
                              !isLoggedIn ? 'opacity-60 cursor-not-allowed bg-gray-800 text-gray-500' :
                              isSelected
                                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                            }`}
                          >
                            {!isLoggedIn && <Lock size={10} className="absolute top-1 right-1 text-gray-600" />}
                            <p className="text-[10px] font-normal text-gray-400 mb-0.5">
                              {MARKET_LABELS[oddsItem.selection] ?? oddsItem.label}
                            </p>
                            <p>{oddsItem.odds.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bet slip drawer */}
      {showSlip && betSlip.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />
                Phiếu cược ({betSlip.length})
              </h3>
              <button onClick={() => setBetSlip([])} className="text-xs text-red-400 hover:text-red-300">Xóa tất cả</button>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {betSlip.map(b => (
                <div key={b.oddsId} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs text-gray-400">{b.homeTeam} vs {b.awayTeam}</p>
                    <p className="text-[11px] font-semibold text-green-400">{b.label}</p>
                  </div>
                  <span className="font-bold text-white text-sm">{b.odds.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Số tiền cược (₫)</label>
              <input type="number" placeholder="Nhập số tiền..."
                value={stake}
                onChange={e => setStake(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>Tổng tỉ lệ: <b className="text-white">{totalOdds.toFixed(2)}</b></span>
              <span>Thắng tiềm năng: <b className="text-green-400">{potentialWin.toLocaleString('vi-VN')} ₫</b></span>
            </div>

            <button
              onClick={() => placeBetMutation.mutate()}
              disabled={placeBetMutation.isPending || !stake || parseFloat(stake) <= 0}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {placeBetMutation.isPending ? 'Đang đặt cược…' : 'Xác nhận đặt cược'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
