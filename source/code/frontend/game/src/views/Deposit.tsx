import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { createDeposit, getBalance, getDepositHistory } from '@/api/apiViTien';
import { useWalletStore } from '@/store/walletStore';
import { TransactionList, DepositMethodCard } from '@/components/vi-tien/DanhSachGiaoDich';
import { formatVND } from '@/utils/dinhDang';
import { PAYMENT_ICONS } from '@/utils/tainguyen';

const schema = yup.object({
  amount: yup
    .number()
    .typeError('Vui lòng nhập số tiền')
    .min(10_000, 'Tối thiểu 10,000 ₫')
    .required('Vui lòng nhập số tiền'),
});
type FormValues = yup.InferType<typeof schema>;

const METHODS = [
  { key: 'banking',    label: 'Ngân hàng',  icon: PAYMENT_ICONS.banking },
  { key: 'momo',       label: 'MoMo',        icon: PAYMENT_ICONS.momo },
  { key: 'zalopay',   label: 'ZaloPay',     icon: PAYMENT_ICONS.zalopay },
  { key: 'usdt',      label: 'USDT',         icon: PAYMENT_ICONS.usdt },
];
const QUICK = [100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

// Static VA info (simulated) — in production this comes from the backend
const MOCK_VA = {
  bankName: 'MB Bank',
  accountNumber: '0389 1234 5678',
  accountName: 'CONG TY TNHH GAMEX',
  memo: 'GAME',
};

// ── Bank Transfer Info Panel ──────────────────────────────────────────────
function BankTransferInfo({ amount }: { amount: number }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const content = `${MOCK_VA.memo}${String(amount).replace(/\./g, '')}`;

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Đã sao chép!');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const rows = [
    { label: 'Ngân hàng',       value: MOCK_VA.bankName,       field: 'bank' },
    { label: 'Số tài khoản',    value: MOCK_VA.accountNumber,  field: 'acc' },
    { label: 'Tên tài khoản',   value: MOCK_VA.accountName,    field: 'name' },
    { label: 'Số tiền',         value: formatVND(amount),       field: 'amount' },
    { label: 'Nội dung CK',     value: content,                 field: 'memo' },
  ];

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2.5">
      <p className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-wide mb-3">Thông tin chuyển khoản</p>
      {rows.map(({ label, value, field }) => (
        <div key={field} className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value}</p>
          </div>
          {(field === 'acc' || field === 'memo') && (
            <button
              onClick={() => copy(value.replace(/\s/g, ''), field)}
              className="shrink-0 p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {copiedField === field
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <Copy className="w-4 h-4 text-primary dark:text-secondary" />
              }
            </button>
          )}
        </div>
      ))}
      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1">
        <img src="/wap/img/home_notice.png" alt="" className="w-3.5 h-3.5 object-contain mt-px shrink-0" />
        Nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận.
      </p>
    </div>
  );
}

// ── QR / E-wallet Info Panel ──────────────────────────────────────────────
function EwalletInfo({ method }: { method: string }) {
  const configs: Record<string, { phone: string; name: string; color: string }> = {
    momo:     { phone: '0901 234 567', name: 'GAMEX VN', color: '#a50064' },
    zalopay:  { phone: '0901 234 567', name: 'GAMEX VN', color: '#0068ff' },
  };
  const cfg = configs[method];
  if (!cfg) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
      {/* QR placeholder grid */}
      <div className="w-32 h-32 mx-auto mb-3 relative">
        <svg viewBox="0 0 64 64" className="w-full h-full rounded-xl border-2 border-gray-300 dark:border-gray-600" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" fill="white"/>
          {/* QR grid pattern simulation */}
          {[0,8,16,24,32,40,48,56].map(x =>
            [0,8,16,24,32,40,48,56].map(y =>
              ((x + y) % 16 === 0 || (x * y) % 32 === 0) ? (
                <rect key={`${x}${y}`} x={x+1} y={y+1} width="6" height="6" fill="#1a1a1a"/>
              ) : null
            )
          )}
          {/* Center logo */}
          <rect x="22" y="22" width="20" height="20" rx="4" fill={cfg.color}/>
        </svg>
        <p className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-[9px] font-bold px-1.5" style={{ color: cfg.color }}>QR CODE</p>
      </div>
      <p className="text-xs text-gray-500">Số điện thoại nhận</p>
      <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{cfg.phone}</p>
      <p className="text-xs text-gray-500 mt-0.5">{cfg.name}</p>
      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
        Quét QR hoặc chuyển đến số điện thoại trên.
      </p>
    </div>
  );
}

export default function Deposit() {
  const qc = useQueryClient();
  const [method, setMethod] = useState('banking');
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const { setBalance } = useWalletStore();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });
  const amountVal = watch('amount');

  const depositMut = useMutation({
    mutationFn: (data: FormValues) => createDeposit({ amount: data.amount, payment_method: method }),
    onSuccess: async (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['deposit-history'] });
      const d = await getBalance();
      setBalance(d.balance);
      if (method === 'banking') {
        setPendingAmount(vars.amount);
        toast.success('Tạo lệnh nạp thành công! Vui lòng chuyển khoản theo thông tin bên dưới.');
      } else {
        toast.success('Yêu cầu nạp tiền đã được gửi!');
        reset();
      }
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Nạp tiền thất bại');
    },
  });

  const { data: history } = useQuery({
    queryKey: ['deposit-history'],
    queryFn: getDepositHistory,
    enabled: tab === 'history',
  });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-5">Nạp tiền</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['form', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {t === 'form' ? 'Nạp ngay' : 'Lịch sử'}
          </button>
        ))}
      </div>

      {tab === 'form' && (
        <form onSubmit={handleSubmit((d) => { setPendingAmount(null); depositMut.mutate(d); })} className="space-y-5">
          {/* Payment method */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Phương thức thanh toán</p>
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(m => (
                <DepositMethodCard
                  key={m.key}
                  method={m}
                  selected={method === m.key}
                  onSelect={() => { setMethod(m.key); setPendingAmount(null); }}
                />
              ))}
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Chọn nhanh</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setValue('amount', q, { shouldValidate: true })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    amountVal === q
                      ? 'border-primary bg-primary/10 text-primary dark:text-secondary'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {formatVND(q)}
                </button>
              ))}
            </div>
          </div>

          {/* Manual amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Số tiền</label>
            <input
              {...register('amount')}
              type="number"
              placeholder="Nhập số tiền khác..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={depositMut.isPending}
            className="w-full py-4 bg-primary hover:bg-secondary text-white font-black rounded-2xl disabled:opacity-50 transition-colors text-base"
          >
            {depositMut.isPending ? 'Đang xử lý...' : 'Nạp tiền ngay'}
          </button>

          {/* Bank transfer info — shown after submitting banking method */}
          {method === 'banking' && pendingAmount && (
            <BankTransferInfo amount={pendingAmount} />
          )}

          {/* E-wallet QR — shown before submitting for momo/zalopay */}
          {(method === 'momo' || method === 'zalopay') && (
            <EwalletInfo method={method} />
          )}
        </form>
      )}

      {tab === 'history' && (
        <TransactionList
          transactions={history?.data || []}
          type="deposit"
        />
      )}
    </div>
  );
}
