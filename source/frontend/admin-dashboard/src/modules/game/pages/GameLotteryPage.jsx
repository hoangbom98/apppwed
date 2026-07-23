/**
 * admin-dashboard/src/modules/game/pages/GameLotteryPage.jsx
 * Route: /game/lottery
 * Admin management for Lottery draws, types, and bets.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN');
}
function fmtTime(s) {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN');
}

const STATUS_COLOR = {
  WAITING:   'bg-yellow-900/40 text-yellow-400',
  DRAWN:     'bg-green-900/40 text-green-400',
  CANCELLED: 'bg-gray-700 text-gray-400',
};
const BET_STATUS_COLOR = {
  PENDING:   'bg-yellow-900/40 text-yellow-400',
  WIN:       'bg-green-900/40 text-green-400',
  LOSE:      'bg-red-900/40 text-red-400',
  CANCELLED: 'bg-gray-700 text-gray-400',
};

export default function GameLotteryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('draws');
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [resultInput, setResultInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [newDraw, setNewDraw] = useState({ typeId: '', drawTime: '' });
  const [msg, setMsg] = useState('');

  // ── Types ─────────────────────────────────────────────────────────
  const { data: typesData } = useQuery({
    queryKey: ['admin-lottery-types'],
    queryFn: () => api.get('/game/lottery/types').then(r => r.data),
  });
  const types = typesData?.data ?? [];

  // ── Draws ─────────────────────────────────────────────────────────
  const { data: drawsData, isLoading: drawsLoading } = useQuery({
    queryKey: ['admin-lottery-draws'],
    queryFn: () => api.get('/game/lottery/draws', { params: { limit: 50 } }).then(r => r.data),
    refetchInterval: 15000,
  });
  const draws = drawsData?.data ?? [];

  // ── My Bets (for selected draw) ────────────────────────────────────
  const { data: betsData } = useQuery({
    queryKey: ['admin-lottery-bets', selectedDraw?.id],
    queryFn: () => api.get('/game/lottery/bets', { params: { drawId: selectedDraw?.id } }).then(r => r.data),
    enabled: !!selectedDraw,
  });
  const bets = betsData?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────
  const createDrawMut = useMutation({
    mutationFn: (body) => api.post('/game/lottery/admin/draws', body).then(r => r.data),
    onSuccess: () => {
      setMsg('✅ Tạo kỳ thành công');
      setCreating(false);
      setNewDraw({ typeId: '', drawTime: '' });
      qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] });
    },
    onError: (e) => setMsg(`❌ ${e.response?.data?.message ?? 'Lỗi tạo kỳ'}`),
  });

  const setResultMut = useMutation({
    mutationFn: ({ id, result }) => api.post(`/game/lottery/admin/draws/${id}/result`, { result }).then(r => r.data),
    onSuccess: () => {
      setMsg('✅ Cập nhật kết quả thành công');
      setSelectedDraw(null);
      setResultInput('');
      qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] });
    },
    onError: (e) => setMsg(`❌ ${e.response?.data?.message ?? 'Lỗi cập nhật'}`),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Game — Xổ số</h1>
          <p className="text-sm text-gray-400 mt-0.5">Quản lý kỳ quay, kết quả, đặt cược</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-colors"
        >
          + Tạo kỳ mới
        </button>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${msg.startsWith('✅') ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
          {msg}
          <button onClick={() => setMsg('')} className="ml-3 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create draw form */}
      {creating && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <h3 className="font-bold text-white">Tạo kỳ quay mới</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Loại xổ số</label>
              <select
                value={newDraw.typeId}
                onChange={e => setNewDraw(d => ({ ...d, typeId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="">— Chọn loại —</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Thời gian quay</label>
              <input
                type="datetime-local"
                value={newDraw.drawTime}
                onChange={e => setNewDraw(d => ({ ...d, drawTime: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => createDrawMut.mutate({ typeId: newDraw.typeId, drawTime: new Date(newDraw.drawTime).toISOString() })}
              disabled={createDrawMut.isPending || !newDraw.typeId || !newDraw.drawTime}
              className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {createDrawMut.isPending ? 'Đang tạo...' : 'Xác nhận'}
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 bg-gray-800 text-gray-400 font-semibold rounded-xl text-sm">
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-6">
        {[['draws', 'Kỳ quay'], ['bets', 'Lịch sử cược']].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`pb-2.5 text-sm font-semibold transition-colors relative ${tab === k ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {l}
            {tab === k && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Draws table */}
      {tab === 'draws' && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <th className="px-4 py-3 text-left">Kỳ</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-right">Tổng cược</th>
                <th className="px-4 py-3 text-right">Tổng trả</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Kết quả</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {drawsLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : draws.map(d => (
                    <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-white text-xs">{d.period}</td>
                      <td className="px-4 py-3 text-gray-300">{d.type?.name ?? d.typeId}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{fmtTime(d.drawTime)}</td>
                      <td className="px-4 py-3 text-right text-white">{fmt(d.totalBetAmount)}</td>
                      <td className="px-4 py-3 text-right text-white">{fmt(d.totalPayout)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[d.status] ?? 'bg-gray-700 text-gray-400'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.resultOfficial
                          ? <span className="text-green-400 font-mono text-xs">{JSON.stringify(d.resultOfficial)}</span>
                          : <span className="text-gray-600 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.status === 'WAITING' && (
                          <button
                            onClick={() => { setSelectedDraw(d); setTab('setResult'); }}
                            className="px-3 py-1 bg-blue-900/40 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Nhập kết quả
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Set result panel */}
      {tab === 'setResult' && selectedDraw && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4 max-w-md">
          <h3 className="font-bold text-white">Nhập kết quả kỳ <span className="text-yellow-400">{selectedDraw.period}</span></h3>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Kết quả (số / JSON)</label>
            <input
              type="text"
              value={resultInput}
              onChange={e => setResultInput(e.target.value)}
              placeholder='VD: 14 hoặc {"number":14,"sum":5}'
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                let result = resultInput.trim();
                try { result = JSON.parse(result); } catch { result = { number: parseInt(result) }; }
                setResultMut.mutate({ id: selectedDraw.id, result });
              }}
              disabled={setResultMut.isPending || !resultInput.trim()}
              className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {setResultMut.isPending ? 'Đang lưu...' : 'Xác nhận kết quả'}
            </button>
            <button onClick={() => { setSelectedDraw(null); setTab('draws'); }} className="px-4 py-2 bg-gray-800 text-gray-400 font-semibold rounded-xl text-sm">
              Huỷ
            </button>
          </div>
        </div>
      )}

      {/* Bets */}
      {tab === 'bets' && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🎯</p>
          <p>Chọn kỳ quay để xem lịch sử cược</p>
          <p className="text-xs mt-1">Tính năng đang được phát triển</p>
        </div>
      )}
    </div>
  );
}
