import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { PhoneOutlined, MessageOutlined, MailOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const FAQS = [
  { q: 'Làm sao để nạp xu?', a: 'Vào Ví → Nạp xu, chọn phương thức thanh toán và mệnh giá. Hỗ trợ Momo, ZaloPay, VNPay, chuyển khoản ngân hàng.' },
  { q: 'Làm sao để lấy lại tài khoản?', a: 'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập số điện thoại đã đăng ký để nhận OTP xác nhận.' },
  { q: 'Xu có thể rút ra không?', a: 'Bạn có thể rút xu sang tiền mặt nếu là streamer/creator đã xác minh. Vào Ví → Rút tiền.' },
  { q: 'Làm sao để trở thành VIP?', a: 'Vào trang VIP, chọn gói phù hợp và thanh toán bằng xu hoặc tiền thật.' },
  { q: 'Báo cáo người dùng vi phạm?', a: 'Vào trang hồ sơ của người đó → nhấn ⋯ → Báo cáo. Chúng tôi xử lý trong 24 giờ.' },
];

export default function Support() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <PageHeader title="Hỗ trợ" />

      <div className="px-4 pb-8 space-y-6">
        {/* Contact channels */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3"><PhoneOutlined /> Liên hệ nhanh</h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { icon: <MessageOutlined />, label: 'Live Chat', color: 'bg-pink-50 text-pink-600' },
              { icon: <PhoneOutlined />,   label: 'Telegram',  color: 'bg-blue-50 text-blue-600' },
              { icon: <MailOutlined />,    label: 'Email',     color: 'bg-green-50 text-green-600' },
            ] as { icon: React.ReactNode; label: string; color: string }[]).map(c => (
              <button key={c.label} className={`flex flex-col items-center gap-2 p-4 ${c.color} rounded-2xl`}>
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3"><QuestionCircleOutlined /> Câu hỏi thường gặp</h3>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                  <p className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</p>
                  {open === i ? <ChevronUp size={16} className="text-pink-500 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                {open === i && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket */}
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-gray-600 mb-3">Không tìm thấy câu trả lời?</p>
          <button className="px-6 py-2.5 bg-pink-500 text-white text-sm font-semibold rounded-xl">
            Gửi ticket hỗ trợ
          </button>
        </div>
      </div>
    </div>
  );
}
