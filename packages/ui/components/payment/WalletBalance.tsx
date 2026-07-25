// @ts-nocheck
/**
 * WalletBalance.jsx — Shared wallet balance card.
 *
 * Usage (any sub-project):
 *   import { WalletBalance } from '@ui';
 *   <WalletBalance showCoins showDiamonds onDeposit={() => nav('/deposit')} onWithdraw={() => nav('/withdraw')} />
 */
import React from 'react';
import { useWalletStore } from '../../store/walletStore';
import { formatVND, formatCoins } from '../../utils/formatters';
import Spinner from '../Spinner';

/**
 * @param {{
 *   showCoins?:    boolean  – show coins / diamonds row (Game, Dating)
 *   showFiat?:     boolean  – show VND balance (default true)
 *   onDeposit?:    () => void
 *   onWithdraw?:   () => void
 *   className?:    string
 * }} props
 */
export default function WalletBalance({
  showCoins    = false,
  showFiat     = true,
  onDeposit,
  onWithdraw,
  className    = '',
}) {
  const { balance, coins, diamonds, isLoading, fetchBalance } = useWalletStore();

  React.useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return (
    <div className={`bg-gray-800 rounded-2xl p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 uppercase tracking-widest">Số dư tài khoản</span>
        <button
          onClick={fetchBalance}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
          aria-label="Làm mới số dư"
        >
          {isLoading ? <Spinner size="xs" /> : '↻'}
        </button>
      </div>

      {/* Fiat balance */}
      {showFiat && (
        <div className="mb-3">
          {isLoading ? (
            <div className="h-8 w-40 bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatVND(balance)}
            </p>
          )}
        </div>
      )}

      {/* Virtual currency row (Game / Dating) */}
      {showCoins && (
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-base">🪙</span>
            <span className="text-sm font-semibold text-white">{formatCoins(coins)}</span>
            <span className="text-xs text-gray-400">Xu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 text-base">💎</span>
            <span className="text-sm font-semibold text-white">{formatCoins(diamonds)}</span>
            <span className="text-xs text-gray-400">Kim cương</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(onDeposit || onWithdraw) && (
        <div className="flex gap-3 mt-4">
          {onDeposit && (
            <button
              onClick={onDeposit}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
            >
              + Nạp tiền
            </button>
          )}
          {onWithdraw && (
            <button
              onClick={onWithdraw}
              className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 active:scale-95 transition-all"
            >
              ↑ Rút tiền
            </button>
          )}
        </div>
      )}
    </div>
  );
}
