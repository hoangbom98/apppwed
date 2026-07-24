import { useState, useEffect, useRef, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
  id: number;
  title?: string;
  image?: string;
  link?: string;
  description?: string;
}

interface BannerSliderProps {
  banners?: Banner[];
  showCta?: boolean;
  ctaLink?: string;
}

const GRADIENT_FALLBACKS = [
  'from-primary via-secondary to-primary/50',
  'from-purple-700 via-purple-500 to-indigo-600',
  'from-amber-600 via-orange-500 to-red-500',
];

export const BannerSlider: React.FC<BannerSliderProps> = ({
  banners = [],
  showCta = false,
  ctaLink = '/register',
}) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent(c => (c + 1) % banners.length);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
  };

  if (!banners.length) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary/50 h-44 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-accent font-black text-3xl tracking-widest drop-shadow">GAMEX</p>
          <p className="text-white/70 text-sm mt-2">Hệ thống giải trí trực tuyến hàng đầu</p>
          {showCta && (
            <Link to={ctaLink}
              className="mt-4 inline-block px-6 py-2 bg-accent text-dark font-bold rounded-full text-sm hover:bg-accent/90 transition-colors">
              Đăng ký ngay
            </Link>
          )}
        </div>
      </div>
    );
  }

  const active = banners[current];
  const gradient = GRADIENT_FALLBACKS[current % GRADIENT_FALLBACKS.length];

  return (
    <div
      className="relative rounded-2xl overflow-hidden h-44 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35 }}
          className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          {active.image ? (
            <img src={active.image} alt={active.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center px-4 z-10">
              <p className="text-accent font-black text-2xl tracking-wider drop-shadow">{active.title || 'GAMEX'}</p>
              {active.description && <p className="text-white/80 text-sm mt-1.5 max-w-xs mx-auto">{active.description}</p>}
              {showCta && active.link && (
                <Link to={active.link}
                  className="mt-3 inline-block px-5 py-1.5 bg-accent text-dark font-bold rounded-full text-xs hover:bg-accent/90 transition-colors">
                  Xem ngay
                </Link>
              )}
            </div>
          )}
          {/* Dark overlay for text legibility when image present */}
          {active.image && <div className="absolute inset-0 bg-black/30" />}
          {active.image && (
            <div className="absolute inset-0 flex items-center justify-center text-center px-4">
              <div>
                <p className="text-white font-black text-2xl drop-shadow-lg">{active.title}</p>
                {active.description && <p className="text-white/80 text-sm mt-1">{active.description}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicator dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-accent' : 'w-1.5 bg-white/60'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
