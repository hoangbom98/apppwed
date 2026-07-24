import React from 'react';

interface Props {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  isOnline?: boolean;
}

export default function Avatar({ src, name, size = 40, className = '', isOnline }: Props) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '??';
  const [imgError, setImgError] = React.useState(false);
  const showImg = src && !imgError;
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {showImg ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          style={{ width: size, height: size }}
          onError={() => setImgError(true)}
        />
      ) : (
        <img
          src="/icons/ui/userpic.png"
          alt={name || 'user'}
          className="w-full h-full rounded-full object-cover bg-gray-100"
          style={{ width: size, height: size }}
          onError={(e) => {
            // Ultimate fallback: initials
            const t = e.target as HTMLImageElement;
            t.style.display = 'none';
            const div = t.nextElementSibling as HTMLElement;
            if (div) div.style.display = 'flex';
          }}
        />
      )}
      {/* Hidden initials fallback */}
      <div
        className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-rose-500 items-center justify-center text-white font-bold absolute inset-0"
        style={{ fontSize: size * 0.35, display: 'none' }}
      >
        {initials}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
