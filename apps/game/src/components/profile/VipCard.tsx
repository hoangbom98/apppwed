import React from 'react';

interface VipCardProps {
  level: number;
  progress: number; // 0–100
  target: string;
}

const VipCard: React.FC<VipCardProps> = ({ level, progress, target }) => {
  return (
    <div className="vip-card">
      <div className="vip-level">
        <span>Cấp độ VIP</span>
        <span className="level">VIP {level}</span>
      </div>
      <div className="progress">
        <div className="bar" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <div className="progress-label">
        Tiến trình: {progress}% · Cần {target} nữa
      </div>
    </div>
  );
};

export default VipCard;
