// @ts-nocheck
// packages/shared-ui/src/components/CskhPage.tsx
// Trang CSKH (Trung tâm dịch vụ khách hàng) dùng chung cho 5 project.
// Mỗi project truyền `config: CskhConfig` từ file cskh.config.ts của mình.
// Config có thể được override bởi dữ liệu từ backend (API /admin/cskh/:project).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones, Smartphone, Gift, PhoneCall, Mail, ExternalLink,
  ChevronRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CskhButton {
  id: string;
  label: string;
  path: string;
  isExternal?: boolean;
}

export interface CskhConfig {
  projectName: string;       // "KJC Game"
  projectKey: string;        // "game"
  logoUrl?: string;
  primaryColor: string;      // "#26A17B"
  slogan?: string;
  chatButtons: CskhButton[];       // 6 nút chat nhanh
  experienceButtons: CskhButton[]; // iOS, Android, Hướng dẫn
  showCodeSection?: boolean;
  codePlaceholder?: string;
  codeSubmitLabel?: string;
  footerText?: string;
  supportPhone?: string;
  supportEmail?: string;
}

interface CskhPageProps {
  config: CskhConfig;
  /** Callback khi user submit code free. Nhận (code: string) → trả Promise<void> */
  onSubmitCode?: (code: string) => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Hex → rgba với opacity */
function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Component ─────────────────────────────────────────────────────────────────
const CskhPage: React.FC<CskhPageProps> = ({ config, onSubmitCode }) => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const pc = config.primaryColor || '#26A17B';
  const slogan = config.slogan
    ?? `Sự hài lòng của bạn chính là thành công của đội ngũ CSKH ${config.projectName}`;
  const footer = config.footerText
    ?? `LIÊN MINH QUỐC TẾ ${config.projectName} 2025-2026`;

  const handleBtn = (btn: CskhButton) => {
    if (btn.isExternal) {
      window.open(btn.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(btn.path);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) return;
    if (onSubmitCode) {
      setSubmitting(true);
      setCodeMsg(null);
      try {
        await onSubmitCode(code.trim());
        setCodeMsg({ type: 'ok', text: 'Nhận quà thành công!' });
        setCode('');
      } catch (err) {
        setCodeMsg({ type: 'err', text: err?.message ?? 'Mã không hợp lệ hoặc đã được sử dụng.' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', paddingBottom: 32 }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#fff',
        borderBottom: `3px solid ${pc}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {config.logoUrl && (
          <img src={config.logoUrl} alt={config.projectName} style={{ height: 32, width: 'auto' }} />
        )}
        <span style={{ fontWeight: 800, fontSize: 18, color: pc }}>
          {config.projectName}
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── Title block ───────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', margin: '16px 0 8px' }}>
            TRUNG TÂM DỊCH VỤ KHÁCH HÀNG
          </h1>
          <p style={{ fontSize: 13, color: '#57606a', lineHeight: 1.6 }}>{slogan}</p>
        </div>

        {/* ── Chat nhanh 24/7 ───────────────────────────────────── */}
        <Section
          icon={<Headphones size={18} color={pc} />}
          title="CHAT NHANH 24/7"
          primaryColor={pc}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {config.chatButtons.map((btn) => (
              <ChatBtn key={btn.id} btn={btn} primaryColor={pc} onClick={() => handleBtn(btn)} />
            ))}
          </div>
        </Section>

        {/* ── Trải nghiệm ──────────────────────────────────────── */}
        <Section
          icon={<Smartphone size={18} color={pc} />}
          title="TRẢI NGHIỆM"
          primaryColor={pc}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {config.experienceButtons.map((btn, i) => (
              <button
                key={btn.id}
                onClick={() => handleBtn(btn)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: i < 2 ? pc : '#f0f1f4',
                  color: i < 2 ? '#fff' : '#1a1a2e',
                }}
              >
                {btn.isExternal && i < 2 && <ExternalLink size={11} />}
                {btn.label}
              </button>
            ))}
          </div>
        </Section>

        {/* ── Nhập code free ──────────────────────────────────── */}
        {config.showCodeSection !== false && (
          <Section
            icon={<Gift size={18} color={pc} />}
            title="NHẬP CODE FREE"
            primaryColor={pc}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeMsg(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                placeholder={config.codePlaceholder ?? 'Nhập mã code...'}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: `1.5px solid ${codeMsg?.type === 'err' ? '#ff4d4f' : '#e5e7eb'}`,
                  fontSize: 13, outline: 'none', background: '#fff',
                }}
              />
              <button
                onClick={handleCodeSubmit}
                disabled={submitting || !code.trim()}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: pc, color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting || !code.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {submitting ? '...' : (config.codeSubmitLabel ?? 'Nhận quà')}
              </button>
            </div>
            {codeMsg && (
              <p style={{
                marginTop: 6, fontSize: 12,
                color: codeMsg.type === 'ok' ? '#16a34a' : '#dc2626',
              }}>
                {codeMsg.text}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#8b92a5', marginTop: 4 }}>
              Mỗi code chỉ dùng 1 lần · Không chuyển nhượng
            </p>
          </Section>
        )}

        {/* ── Thông tin liên hệ ────────────────────────────────── */}
        {(config.supportPhone || config.supportEmail) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
            {config.supportPhone && (
              <a href={`tel:${config.supportPhone}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: pc, textDecoration: 'none' }}
              >
                <PhoneCall size={14} /> {config.supportPhone}
              </a>
            )}
            {config.supportEmail && (
              <a href={`mailto:${config.supportEmail}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: pc, textDecoration: 'none' }}
              >
                <Mail size={14} /> {config.supportEmail}
              </a>
            )}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: 11, color: '#8b92a5',
        }}>
          {footer}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  primaryColor: string;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ icon, title, primaryColor, children }) => (
  <div style={{
    background: '#fff', borderRadius: 14,
    padding: '14px 14px 16px',
    marginBottom: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
      {icon}
      <span style={{ fontWeight: 800, fontSize: 13, color: '#1a1a2e', letterSpacing: 0.3 }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

interface ChatBtnProps {
  btn: CskhButton;
  primaryColor: string;
  onClick: () => void;
}
const ChatBtn: React.FC<ChatBtnProps> = ({ btn, primaryColor, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '10px 6px', minHeight: 64,
      borderRadius: 10, border: `1.5px solid ${hexAlpha(primaryColor, 0.25)}`,
      background: hexAlpha(primaryColor, 0.05),
      color: primaryColor, fontWeight: 700, fontSize: 11,
      cursor: 'pointer', gap: 4, textAlign: 'center', lineHeight: 1.3,
    }}
  >
    <ChevronRight size={14} style={{ opacity: 0.6 }} />
    {btn.label}
  </button>
);

export default CskhPage;
