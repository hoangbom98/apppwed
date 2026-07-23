import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  none:           { label: 'Chưa xác minh',   cls: 'text-gray-400' },
  pending_review: { label: 'Đang xét duyệt',  cls: 'text-yellow-400' },
  verified:       { label: 'Đã xác minh',     cls: 'text-green-400' },
  rejected:       { label: 'Bị từ chối',      cls: 'text-red-400' },
};

// ── File upload helper ────────────────────────────────────────────────────────
function FileUploader({
  label,
  name,
  accept = 'image/*',
  onChange,
  preview,
  disabled,
}: {
  label: string;
  name: string;
  accept?: string;
  onChange: (file: File, base64: string) => void;
  preview?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <div
        onClick={() => !disabled && ref.current?.click()}
        className={[
          'border-2 border-dashed rounded-xl flex flex-col items-center justify-center h-36 cursor-pointer transition-colors',
          preview ? 'border-blue-500/50' : 'border-gray-700 hover:border-gray-500',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover rounded-xl" />
        ) : (
          <>
            <span className="text-3xl text-gray-600">📷</span>
            <span className="text-xs text-gray-500 mt-1">Nhấn để chọn ảnh</span>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KYC() {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    fullName:   '',
    idNumber:   '',
    idType:     'cmnd',
    address:    '',
    idFront:    '',
    idBack:     '',
    selfie:     '',
  });
  const [previews, setPreviews] = useState({ idFront: '', idBack: '', selfie: '' });
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  // ── Fetch profile to know current KYC status ─────────────────────────────────
  const { data: profile } = useQuery({
    queryKey: ['tradeProfile'],
    queryFn:  () => api.get('/trade/auth/me').then(r => r.data?.data ?? r.data),
  });

  const kycStatus   = profile?.kycStatus ?? 'none';
  const kycDocuments = profile?.kycDocuments;
  const statusInfo   = STATUS_MAP[kycStatus] || STATUS_MAP.none;

  // ── Submit mutation ──────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/trade/kyc', data).then(r => r.data),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      qc.invalidateQueries({ queryKey: ['tradeProfile'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Gửi hồ sơ thất bại. Vui lòng thử lại.');
    },
  });

  // ── Field helpers ─────────────────────────────────────────────────────────────
  const setFile = (key: 'idFront' | 'idBack' | 'selfie') => (_file: File, base64: string) => {
    setForm(f => ({ ...f, [key]: base64 }));
    setPreviews(p => ({ ...p, [key]: base64 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { fullName, idNumber, idFront, idBack, selfie } = form;
    if (!fullName || !idNumber || !idFront || !idBack || !selfie) {
      setError('Vui lòng điền đầy đủ thông tin và tải lên đủ 3 ảnh.');
      return;
    }
    mutation.mutate(form);
  };

  // ── Already verified ─────────────────────────────────────────────────────────
  if (kycStatus === 'verified') {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl p-7 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-white">Tài khoản đã được xác minh</h2>
          <p className="text-sm text-gray-400">Hồ sơ KYC của bạn đã được phê duyệt. Bạn có đầy đủ quyền truy cập nền tảng.</p>
          {kycDocuments?.approvedAt && (
            <p className="text-xs text-gray-500">
              Ngày duyệt: {new Date(kycDocuments.approvedAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Pending review ───────────────────────────────────────────────────────────
  if (kycStatus === 'pending_review') {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl p-7 text-center space-y-4">
          <div className="text-5xl">⏳</div>
          <h2 className="text-xl font-bold text-white">Đang chờ xét duyệt</h2>
          <p className="text-sm text-gray-400">
            Hồ sơ của bạn đã được gửi và đang chờ bộ phận kiểm duyệt xem xét (thường 1–2 ngày làm việc).
          </p>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl p-7 text-center space-y-4">
          <div className="text-5xl">📨</div>
          <h2 className="text-xl font-bold text-white">Hồ sơ đã được gửi</h2>
          <p className="text-sm text-gray-400">
            Chúng tôi sẽ xem xét hồ sơ và thông báo kết quả qua email trong vòng 1–2 ngày làm việc.
          </p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1117] py-8 px-4">
      <div className="w-full max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white">Xác minh danh tính (KYC)</h1>
          <p className="text-sm text-gray-400 mt-1">
            Cần thiết để kích hoạt nạp/rút tiền và giao dịch không giới hạn.
          </p>
        </div>

        {/* Rejection notice */}
        {kycStatus === 'rejected' && kycDocuments?.rejectionReason && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-sm text-red-300">
            <strong>Hồ sơ bị từ chối:</strong> {kycDocuments.rejectionReason}
            <br />
            <span className="text-gray-400 text-xs">Vui lòng gửi lại hồ sơ với thông tin chính xác hơn.</span>
          </div>
        )}

        {/* Steps guide */}
        <div className="bg-[#1a1d27] rounded-2xl p-5 space-y-2">
          {[
            'Điền họ tên và số CMND/CCCD',
            'Tải ảnh mặt trước & mặt sau CMND/CCCD',
            'Tải ảnh selfie cầm CMND/CCCD',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <span className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs text-white font-bold mt-0.5">
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1a1d27] rounded-2xl p-6 space-y-5">
          {/* Full name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Họ và tên (theo CMND/CCCD)</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Nguyễn Văn A"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              disabled={mutation.isPending}
            />
          </div>

          {/* ID Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loại giấy tờ</label>
            <select
              value={form.idType}
              onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              disabled={mutation.isPending}
            >
              <option value="cmnd">CMND (9 số)</option>
              <option value="cccd">CCCD / Căn cước công dân</option>
              <option value="passport">Hộ chiếu</option>
            </select>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Số CMND / CCCD / Hộ chiếu</label>
            <input
              type="text"
              value={form.idNumber}
              onChange={e => setForm(f => ({ ...f, idNumber: e.target.value.replace(/\s/g, '') }))}
              placeholder="012345678901"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white font-mono focus:border-blue-500 focus:outline-none transition-colors"
              disabled={mutation.isPending}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              disabled={mutation.isPending}
            />
          </div>

          {/* Document photos */}
          <div className="grid grid-cols-2 gap-4">
            <FileUploader
              label="Mặt trước CMND/CCCD"
              name="idFront"
              onChange={setFile('idFront')}
              preview={previews.idFront}
              disabled={mutation.isPending}
            />
            <FileUploader
              label="Mặt sau CMND/CCCD"
              name="idBack"
              onChange={setFile('idBack')}
              preview={previews.idBack}
              disabled={mutation.isPending}
            />
          </div>

          <FileUploader
            label="Ảnh selfie cầm CMND/CCCD"
            name="selfie"
            onChange={setFile('selfie')}
            preview={previews.selfie}
            disabled={mutation.isPending}
          />

          {/* Privacy notice */}
          <p className="text-xs text-gray-500">
            🔒 Thông tin của bạn được mã hóa và chỉ được sử dụng cho mục đích xác minh danh tính theo quy định pháp luật.
          </p>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang gửi hồ sơ…' : 'Gửi hồ sơ xác minh'}
          </button>
        </form>
      </div>
    </div>
  );
}
