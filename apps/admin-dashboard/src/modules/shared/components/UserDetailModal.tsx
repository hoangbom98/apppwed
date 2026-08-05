// Reusable user detail panel with wallet display + manual balance adjustment.
import { useState } from 'react';

interface Wallet {
  currency: string;
  balance: number | string;
}

interface UserData {
  id: number | string;
  username?: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  wallets?: Wallet[];
  createdAt?: string;
}

interface UserDetailModalProps {
  user: UserData;
  onAdjustBalance?: (amount: number, reason: string) => void;
  onClose?: () => void;
}

const UserDetailModal = ({ user, onAdjustBalance, onClose }: UserDetailModalProps) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4">
      {/* Header */}
      {onClose && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Chi tiết người dùng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >×</button>
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {([
          ['ID',          user.id],
          ['Username',    user.username],
          ['Họ tên',      user.fullName ?? '—'],
          ['Email',       user.email],
          ['Role',        user.role],
          ['Trạng thái',  user.status],
          ['Ngày tạo',    user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '—'],
        ] as [string, string | number | undefined][]).map(([k, v]) => (
          <div key={k} className="space-y-0.5">
            <p className="text-xs text-gray-500">{k}</p>
            <p className="text-sm text-gray-200 break-all">{v ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Wallets */}
      {user.wallets && user.wallets.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold text-gray-200 mb-2">Số dư ví</h4>
          {user.wallets.map(w => (
            <div key={w.currency} className="flex justify-between py-1 text-sm">
              <span className="text-gray-400">{w.currency}</span>
              <span className="text-white font-mono">{Number(w.balance).toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Balance adjustment */}
      {onAdjustBalance && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="font-semibold text-gray-200 mb-3 text-sm">Điều chỉnh số dư</h4>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Số tiền (+/-) — vd: 100000 hoặc -50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Lý do (tùy chọn)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                const n = Number(amount);
                if (amount && !isNaN(n)) onAdjustBalance(n, reason);
              }}
              disabled={!amount || isNaN(Number(amount))}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cập nhật số dư
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailModal;
