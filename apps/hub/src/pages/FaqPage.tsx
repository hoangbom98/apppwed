// frontend/hub/src/pages/FaqPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  {
    q: 'LKVIP Hub là gì?',
    a: 'LKVIP Hub là cổng thông tin tổng hợp cung cấp danh sách games, websites, công cụ hữu ích và tin tức được cập nhật liên tục.',
  },
  {
    q: 'Tôi cần đăng ký tài khoản không?',
    a: 'Bạn có thể duyệt hầu hết nội dung mà không cần đăng ký. Tuy nhiên, một số tính năng như lưu yêu thích và nhận thông báo cần tài khoản.',
  },
  {
    q: 'Làm thế nào để tải ứng dụng?',
    a: 'Truy cập trang Tải ứng dụng và chọn phiên bản phù hợp (Android APK hoặc iOS). Đảm bảo bạn cho phép cài đặt từ nguồn không rõ trên Android.',
  },
  {
    q: 'Tôi không tìm thấy game mình muốn?',
    a: 'Sử dụng chức năng tìm kiếm hoặc lọc theo danh mục. Nếu vẫn không tìm thấy, hãy gửi yêu cầu qua trang Liên hệ.',
  },
  {
    q: 'Làm sao để đặt lại mật khẩu?',
    a: 'Tại trang đăng nhập, nhấn "Quên mật khẩu?" và làm theo hướng dẫn gửi đến email của bạn.',
  },
  {
    q: 'Thông tin cá nhân của tôi có được bảo mật không?',
    a: 'Có. Chúng tôi áp dụng mã hóa SSL và các biện pháp bảo mật tiêu chuẩn. Xem Chính sách bảo mật để biết thêm chi tiết.',
  },
  {
    q: 'Làm sao để báo cáo nội dung không phù hợp?',
    a: 'Sử dụng nút "Báo cáo" trên từng nội dung hoặc liên hệ qua trang Phản hồi. Chúng tôi sẽ xem xét và xử lý trong 24 giờ.',
  },
];

export default function FaqPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="hub-page">
      <button onClick={() => navigate(-1)} className="hub-view-all" style={{ marginBottom: 16 }}>
        ← Quay lại
      </button>

      <h1 className="hub-page-title">Câu hỏi thường gặp</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQS.map((item, i) => (
          <div key={i} style={{
            background: 'var(--hub-bg-secondary)', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${open === i ? 'var(--hub-primary)' : 'transparent'}`,
            transition: 'border-color 0.2s',
          }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', textAlign: 'left', gap: 8,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--hub-text)', flex: 1 }}>{item.q}</span>
              <span style={{
                fontSize: 20, color: 'var(--hub-primary)', fontWeight: 300, flexShrink: 0, lineHeight: 1,
                transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'block',
              }}>+</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 16px 14px', borderTop: `1px solid var(--hub-border)` }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--hub-text-secondary)', margin: '10px 0 0' }}>
                  {item.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--hub-text-muted)', marginBottom: 10 }}>
          Không tìm thấy câu trả lời?
        </p>
        <button onClick={() => navigate('/contact')}
          className="hub-btn hub-btn--primary">
          Liên hệ với chúng tôi
        </button>
      </div>
    </div>
  );
}
