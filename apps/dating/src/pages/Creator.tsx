import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Upload, BarChart2, DollarSign, ArrowUpRight } from 'lucide-react';
import { EyeOutlined, HeartOutlined, DollarOutlined } from '@ant-design/icons';

export default function Creator() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Creator Center" />
      <div className="px-4 pb-8 space-y-4">

        {/* Overview */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <h2 className="font-black text-lg mb-1">Trung tâm sáng tạo</h2>
          <p className="text-white/80 text-sm">Chia sẻ nội dung, xây dựng fan base và kiếm thu nhập</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Người xem', value: '---', icon: <EyeOutlined /> },
            { label: 'Fan',       value: '---', icon: <HeartOutlined /> },
            { label: 'Thu nhập',  value: '0 xu', icon: <DollarOutlined /> },
          ] as { label: string; value: string; icon: React.ReactNode }[]).map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="font-black text-gray-900 text-base">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        {[
          { icon: Upload,      label: 'Đăng Short Video',   sublabel: 'Upload & chia sẻ video ngắn',   path: '/shorts' },
          { icon: BarChart2,   label: 'Xem Analytics',      sublabel: 'Thống kê lượt xem & tương tác', path: '/creator/analytics' },
          { icon: DollarSign,  label: 'Thu nhập & Rút tiền', sublabel: 'Quản lý doanh thu creator',      path: '/wallet' },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-left active:scale-[0.98] transition-transform">
            <div className="w-11 h-11 bg-pink-50 rounded-xl flex items-center justify-center">
              <item.icon size={20} className="text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sublabel}</p>
            </div>
            <ArrowUpRight size={16} className="text-gray-300" />
          </button>
        ))}

        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700 font-medium mb-2">Yêu cầu xác minh để rút tiền</p>
          <button className="px-5 py-2 bg-amber-400 text-white text-sm font-semibold rounded-xl">
            Xác minh ngay
          </button>
        </div>
      </div>
    </div>
  );
}
