// @ts-nocheck
/**
 * OptimisticImage.tsx — shared-ui/components
 * --------------------------------------------
 * Drop-in <img> replacement with:
 *   - Blur-up placeholder while loading
 *   - Graceful fallback on error
 *   - Shimmer skeleton before src is known
 *   - Lazy loading + async decoding by default
 *
 * Built on top of useImageSrc hook — no extra state needed in consumers.
 *
 * Usage:
 *   <OptimisticImage
 *     src={user.avatar}
 *     alt={user.name}
 *     className="w-10 h-10 rounded-full object-cover"
 *     placeholder="/images/avatar-blur.jpg"
 *     fallback="/images/default-avatar.png"
 *   />
 */

import React from 'react';
import { useImageSrc } from '../hooks/useImageSrc';

export interface OptimisticImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Full-resolution image URL */
  src:          string | null | undefined;
  /** Low-quality placeholder URL or data URI shown during load (optional) */
  placeholder?: string;
  /** Fallback image shown on load error (optional) */
  fallback?:    string;
  /**
   * Extra CSS class applied while loading (blur, opacity, etc.)
   * Default: 'opacity-0'
   */
  loadingClassName?: string;
  /**
   * Extra CSS class applied once loaded.
   * Default: 'opacity-100 transition-opacity duration-300'
   */
  loadedClassName?: string;
  /** Wrap with a container div (useful for aspect-ratio boxes). Default: false */
  wrapperClassName?: string;
}

export function OptimisticImage({
  src,
  alt = '',
  placeholder,
  fallback,
  loadingClassName = 'opacity-0',
  loadedClassName  = 'opacity-100 transition-opacity duration-300',
  wrapperClassName,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: OptimisticImageProps) {
  const { src: resolvedSrc, isLoaded, isError } = useImageSrc({ src, placeholder, fallback });

  const stateClass = (isLoaded && !isError) ? loadedClassName : loadingClassName;

  const img = (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={`${className} ${stateClass}`.trim()}
      {...rest}
    />
  );

  if (!wrapperClassName) return img;

  return (
    <div className={wrapperClassName}>
      {img}
    </div>
  );
}

export default OptimisticImage;
