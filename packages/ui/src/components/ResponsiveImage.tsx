/**
 * @lkvip/ui — ResponsiveImage
 *
 * Drop-in image component that enforces the LKVIP image standard aspect ratios.
 * Uses Tailwind CSS v4 aspect-* utilities and lazy loading.
 *
 * Usage:
 *   <ResponsiveImage src={url} alt="Game banner" aspectRatio="3:2" />
 */
import React from 'react';
import { ASPECT } from '@lkvip/constants';

export type ImageAspect = '1:1' | '16:9' | '3:2' | '4:3' | '2:1' | '3:1' | '16:10' | '1.9:1';

const ASPECT_CLASS: Record<ImageAspect, string> = {
  '1:1':   ASPECT.SQUARE,
  '16:9':  ASPECT.VIDEO,
  '3:2':   ASPECT.BANNER,
  '4:3':   ASPECT.ARTICLE,
  '2:1':   ASPECT.HERO_MOBILE,
  '3:1':   ASPECT.HERO_DESK,
  '16:10': ASPECT.SPORTS,
  '1.9:1': ASPECT.OG,
};

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio: ImageAspect;
  /** Passed to <img sizes="…"> for srcset-based responsive delivery. */
  sizes?: string;
  className?: string;
  /** `cover` (default) fills frame. `contain` shows full image. */
  fit?: 'cover' | 'contain';
  /** Blur placeholder shown while loading. Provide a base64 LQIP string. */
  placeholder?: string;
  loading?: 'lazy' | 'eager';
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  aspectRatio,
  sizes,
  className = '',
  fit = 'cover',
  placeholder,
  loading = 'lazy',
}) => {
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';
  const aspectClass = ASPECT_CLASS[aspectRatio];

  return (
    <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
      {placeholder && (
        <img
          src={placeholder}
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
          alt=""
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        sizes={sizes ?? '100vw'}
        className={`absolute inset-0 w-full h-full ${fitClass}`}
      />
    </div>
  );
};

export default ResponsiveImage;
