/**
 * trade/src/constants/mock.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fallback mock data used when the API has not yet returned data
 * (e.g. on first load before QueryClient cache is populated).
 *
 * NOTE: These are display-only. Never persist to store or send to backend.
 */
import type { TradePair } from '@/types';

export const MOCK_PAIRS: TradePair[] = [
  { id:1,  symbol:'BTC/USDT',   baseAsset:'BTC',  quoteAsset:'USDT', lastPrice:43250.50, priceChange:2.35,  volume24h:1_240_000_000, high24h:44100,  low24h:42100  },
  { id:2,  symbol:'ETH/USDT',   baseAsset:'ETH',  quoteAsset:'USDT', lastPrice:2285.30,  priceChange:-1.12, volume24h:580_000_000,   high24h:2340,   low24h:2250   },
  { id:3,  symbol:'BNB/USDT',   baseAsset:'BNB',  quoteAsset:'USDT', lastPrice:315.80,   priceChange:0.88,  volume24h:120_000_000,   high24h:320,    low24h:310    },
  { id:4,  symbol:'SOL/USDT',   baseAsset:'SOL',  quoteAsset:'USDT', lastPrice:98.45,    priceChange:4.21,  volume24h:310_000_000,   high24h:102,    low24h:94     },
  { id:5,  symbol:'XRP/USDT',   baseAsset:'XRP',  quoteAsset:'USDT', lastPrice:0.6230,   priceChange:-0.45, volume24h:90_000_000,    high24h:0.635,  low24h:0.611  },
  { id:6,  symbol:'ADA/USDT',   baseAsset:'ADA',  quoteAsset:'USDT', lastPrice:0.5810,   priceChange:1.67,  volume24h:74_000_000,    high24h:0.593,  low24h:0.571  },
  { id:7,  symbol:'DOGE/USDT',  baseAsset:'DOGE', quoteAsset:'USDT', lastPrice:0.0920,   priceChange:3.10,  volume24h:188_000_000,   high24h:0.095,  low24h:0.088  },
  { id:8,  symbol:'AVAX/USDT',  baseAsset:'AVAX', quoteAsset:'USDT', lastPrice:37.20,    priceChange:-2.05, volume24h:55_000_000,    high24h:38.5,   low24h:36.1   },
  { id:9,  symbol:'MATIC/USDT', baseAsset:'MATIC',quoteAsset:'USDT', lastPrice:0.8910,   priceChange:1.23,  volume24h:62_000_000,    high24h:0.905,  low24h:0.875  },
  { id:10, symbol:'DOT/USDT',   baseAsset:'DOT',  quoteAsset:'USDT', lastPrice:7.540,    priceChange:-0.92, volume24h:44_000_000,    high24h:7.72,   low24h:7.45   },
];
