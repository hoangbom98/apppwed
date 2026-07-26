import React from 'react';
import { Megaphone } from 'lucide-react';

interface NoticeBarProps {
  notices: string[];
}

const NoticeBar: React.FC<NoticeBarProps> = ({ notices }) => {
  if (!notices || notices.length === 0) return null;
  return (
    <div className="game-notice">
      <Megaphone size={16} className="icon" />
      <div className="marquee">
        <span>{notices.join('  •  ')}</span>
      </div>
    </div>
  );
};

export default NoticeBar;
