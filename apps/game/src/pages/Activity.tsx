import React, { useState } from 'react';

const VIP_LEVELS = [
  { level: 1,  minBet: 0,          bonus: 0 },
  { level: 2,  minBet: 2_000,      bonus: 8 },
  { level: 3,  minBet: 12_000,     bonus: 18 },
  { level: 4,  minBet: 62_000,     bonus: 38 },
  { level: 5,  minBet: 562_000,    bonus: 68 },
  { level: 6,  minBet: 2_562_000,  bonus: 108 },
  { level: 7,  minBet: 7_562_000,  bonus: 888 },
  { level: 8,  minBet: 27_562_000, bonus: 1_888 },
  { level: 9,  minBet: 77_562_000, bonus: 3_888 },
  { level: 10, minBet: 177_562_000, bonus: 5_888 },
];

const TABS = ['Hoạt động', 'VIP', 'Hoàn trả', 'Chưa nhận', 'Lợi tức', 'Lịch sử'];

const REBATE_CATS = [
  { label: 'Casino trực tiếp', rate: '0.8%' },
  { label: 'Bắn cá',           rate: '1.0%' },
  { label: 'Bài / Game',       rate: '0.6%' },
  { label: 'Xổ số',            rate: '0.5%' },
  { label: 'Thể thao',         rate: '0.4%' },
];

const PageActivity: React.FC = () => {
  const [activeTab, setActiveTab] = useState('VIP');

  const currentBet = 0;
  const nextLevel = VIP_LEVELS.find((l) => l.minBet > currentBet) ?? VIP_LEVELS[VIP_LEVELS.length - 1];
  const progress = nextLevel.minBet > 0 ? (currentBet / nextLevel.minBet) * 100 : 0;

  return (
    <div style={{ padding: '12px', paddingTop: 0 }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--game-border)',
          marginBottom: 12,
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              position: 'relative',
              color: activeTab === tab ? 'var(--game-primary)' : 'var(--game-text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--game-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* VIP tab */}
      {activeTab === 'VIP' && (
        <>
          {/* Progress card */}
          <div
            style={{
              background: 'var(--game-bg-white)',
              borderRadius: 'var(--game-radius-lg)',
              padding: 16,
              boxShadow: 'var(--game-shadow-sm)',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--game-text-secondary)' }}>Cấp độ hiện tại</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--game-primary)' }}>VIP 1</span>
            </div>
            <div style={{ margin: '8px 0 4px', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--game-text-secondary)' }}>
              <span>Tiến trình: {currentBet.toLocaleString('vi-VN')} / {nextLevel.minBet.toLocaleString('vi-VN')}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: 'var(--game-border-dark)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(progress, 100)}%`,
                  background: 'var(--game-primary)',
                  borderRadius: 4,
                  transition: 'width 0.4s',
                }}
              />
            </div>
            <button
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 0',
                background: 'var(--game-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Nhận tất cả
            </button>
          </div>

          {/* VIP table */}
          <div
            style={{
              background: 'var(--game-bg-white)',
              borderRadius: 'var(--game-radius-lg)',
              padding: 16,
              boxShadow: 'var(--game-shadow-sm)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--game-text-secondary)', borderBottom: '1px solid var(--game-border)' }}>
                  <th style={{ padding: '8px 0', textAlign: 'left' }}>Cấp</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Cược tối thiểu</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Thưởng</th>
                </tr>
              </thead>
              <tbody>
                {VIP_LEVELS.map((item) => (
                  <tr
                    key={item.level}
                    style={{ borderBottom: '1px solid var(--game-border)' }}
                  >
                    <td style={{ padding: '8px 0' }}>VIP {item.level}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      {item.minBet.toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--game-primary)', fontWeight: 600 }}>
                      {item.bonus.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Hoàn trả tab */}
      {activeTab === 'Hoàn trả' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REBATE_CATS.map((cat) => (
            <div
              key={cat.label}
              style={{
                background: 'var(--game-bg-white)',
                borderRadius: 'var(--game-radius)',
                padding: 14,
                boxShadow: 'var(--game-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
                <span>{cat.label}</span>
                <span style={{ color: 'var(--game-primary)' }}>Hoàn trả {cat.rate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--game-text-secondary)', marginTop: 4 }}>
                <span>Cược hợp lệ: 0.00</span>
                <span>Chưa nhận: 0.00</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other tabs — placeholder */}
      {!['VIP', 'Hoàn trả'].includes(activeTab) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'var(--game-text-secondary)',
            fontSize: 14,
          }}
        >
          {activeTab} — Không có dữ liệu
        </div>
      )}
    </div>
  );
};

export default PageActivity;
