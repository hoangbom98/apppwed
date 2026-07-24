// frontend/hub/src/pages/PolicyPage.tsx
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Thu thập thông tin',
    content: 'Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản, bao gồm tên, email và thông tin liên hệ. Dữ liệu này được sử dụng để cải thiện dịch vụ và trải nghiệm người dùng.',
  },
  {
    title: '2. Sử dụng thông tin',
    content: 'Thông tin của bạn chỉ được sử dụng để cung cấp dịch vụ, gửi thông báo liên quan và cải thiện hệ thống. Chúng tôi không bán hay chia sẻ thông tin cá nhân với bên thứ ba vì mục đích thương mại.',
  },
  {
    title: '3. Bảo mật thông tin',
    content: 'Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật hiện đại để bảo vệ thông tin của bạn khỏi truy cập trái phép, mất mát hoặc lạm dụng.',
  },
  {
    title: '4. Cookie',
    content: 'Trang web sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể không hoạt động đầy đủ.',
  },
  {
    title: '5. Quyền của người dùng',
    content: 'Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào bằng cách liên hệ với chúng tôi qua email hỗ trợ.',
  },
  {
    title: '6. Thay đổi chính sách',
    content: 'Chính sách bảo mật này có thể được cập nhật định kỳ. Chúng tôi sẽ thông báo về các thay đổi quan trọng qua email hoặc thông báo trên ứng dụng.',
  },
];

export default function PolicyPage() {
  const navigate = useNavigate();
  return (
    <div className="hub-page">
      <button onClick={() => navigate(-1)} className="hub-view-all" style={{ marginBottom: 16 }}>
        ← Quay lại
      </button>

      <h1 className="hub-page-title">Chính sách bảo mật</h1>
      <p style={{ fontSize: 12, color: 'var(--hub-text-muted)', marginBottom: 20, marginTop: -8 }}>
        Cập nhật lần cuối: {new Date().getFullYear()}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map(s => (
          <div key={s.title} style={{
            background: 'var(--hub-bg-secondary)', borderRadius: 12, padding: 16,
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--hub-primary)' }}>{s.title}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--hub-text-secondary)', margin: 0 }}>{s.content}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 16, background: 'var(--hub-bg-secondary)', borderRadius: 12 }}>
        <p style={{ fontSize: 13, color: 'var(--hub-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Câu hỏi? Liên hệ:{' '}
          <a href="mailto:support@okviphub.com" style={{ color: 'var(--hub-primary)', fontWeight: 700 }}>
            support@okviphub.com
          </a>
        </p>
      </div>
    </div>
  );
}
