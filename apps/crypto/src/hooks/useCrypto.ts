import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TradingPair {
  id: string;
  code: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'active' | 'inactive' | string;
  minQty: number;
  maxQty: number;
  minPrice: number;
  tickSize: number;
  lotSize: number;
  lastPrice?: number;
  priceChange?: number;    // % change
  volume?: number;
  high24h?: number;
  low24h?: number;
  market?: { code: string; name: string; type: string };
}

export interface PriceCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  symbolId: string;
  sortOrder: number;
  symbol: { id: string; code: string; name: string; baseAsset: string; quoteAsset: string; status: string };
}

// ── Market hooks ──────────────────────────────────────────────────────────────

/** Lấy danh sách tất cả cặp giao dịch (public) */
export function usePairs(search?: string) {
  return useQuery<TradingPair[]>({
    queryKey: ['crypto', 'pairs', search],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.q = search;
      const { data } = await api.get('/trade/pairs', { params });
      return data.data ?? data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

/** Chi tiết một cặp theo symbol code (ví dụ: BTCUSDT) */
export function usePairDetail(symbol: string) {
  return useQuery<TradingPair>({
    queryKey: ['crypto', 'pair', symbol],
    queryFn: async () => {
      const { data } = await api.get(`/trade/pairs/${symbol}`);
      return data.data ?? data;
    },
    enabled: !!symbol,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

/** Lịch sử giá theo nến (OHLCV) */
export function usePriceHistory(symbol: string, interval = '1h', limit = 100) {
  return useQuery<PriceCandle[]>({
    queryKey: ['crypto', 'history', symbol, interval, limit],
    queryFn: async () => {
      const { data } = await api.get(`/trade/pairs/${symbol}/history`, {
        params: { interval, limit: String(limit) },
      });
      return data.data ?? data;
    },
    enabled: !!symbol,
    staleTime: 60_000,
  });
}

// ── Watchlist hooks ───────────────────────────────────────────────────────────

/** Lấy danh sách watchlists của user */
export function useWatchlists() {
  return useQuery<Watchlist[]>({
    queryKey: ['crypto', 'watchlists'],
    queryFn: async () => {
      const { data } = await api.get('/trade/watchlists');
      return data.data ?? data;
    },
  });
}

/** Tạo watchlist mới */
export function useCreateWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post('/trade/watchlists', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }),
  });
}

/** Xoá watchlist */
export function useDeleteWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/trade/watchlists/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }),
  });
}

/** Thêm symbol vào watchlist */
export function useAddToWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, symbolCode }: { watchlistId: string; symbolCode: string }) =>
      api.post(`/trade/watchlists/${watchlistId}/items`, { symbolCode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }),
  });
}

/** Xoá symbol khỏi watchlist */
export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ watchlistId, symbolId }: { watchlistId: string; symbolId: string }) =>
      api.delete(`/trade/watchlists/${watchlistId}/items/${symbolId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crypto', 'watchlists'] }),
  });
}
