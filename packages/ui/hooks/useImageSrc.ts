// @ts-nocheck
/**
 * useImageSrc.ts — shared-ui/hooks
 * ----------------------------------
 * Lazy image loader hook with blur-up / low-quality placeholder support.
 * Returns the correct `src` to use based on loading state:
 *   - While loading: `placeholder` (blurred thumbnail or data URI)
 *   - On success:    the full-res `src`
 *   - On error:      `fallback` (a local error image path)
 *
 * Usage:
 *   const { src, isLoaded, isError } = useImageSrc({
 *     src:         post.thumbnail_url,
 *     placeholder: '/images/blur-placeholder.jpg',  // optional
 *     fallback:    '/images/no-image.png',           // optional
 *   });
 *
 *   <img src={src} className={isLoaded ? 'opacity-100' : 'opacity-0 blur-sm'} />
 */

import { useState, useEffect, useRef } from 'react';

export interface UseImageSrcOptions {
  /** The full-resolution image URL to load */
  src:          string | null | undefined;
  /** Low-quality placeholder shown while loading (data URI or small URL) */
  placeholder?: string;
  /** Fallback image shown on network error */
  fallback?:    string;
}

export interface UseImageSrcResult {
  /** The current src to bind to <img /> */
  src:      string;
  /** True once the full-res image has finished loading */
  isLoaded: boolean;
  /** True if the image failed to load and fallback is displayed */
  isError:  boolean;
}

const DEFAULT_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

export function useImageSrc({
  src,
  placeholder = DEFAULT_FALLBACK,
  fallback    = DEFAULT_FALLBACK,
}: UseImageSrcOptions): UseImageSrcResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError,  setIsError]  = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      setIsError(true);
      return;
    }

    // Reset state on src change
    setIsLoaded(false);
    setIsError(false);

    // Create an off-screen Image to preload
    const img = new Image();
    imgRef.current = img;

    img.onload  = () => { setIsLoaded(true);  setIsError(false); };
    img.onerror = () => { setIsLoaded(false); setIsError(true);  };
    img.src = src;

    return () => {
      // Abort pending load on cleanup
      img.onload  = null;
      img.onerror = null;
      img.src = '';
    };
  }, [src]);

  if (isError)  return { src: fallback,    isLoaded: false, isError: true  };
  if (isLoaded) return { src: src!,        isLoaded: true,  isError: false };
  return        { src: placeholder,        isLoaded: false, isError: false };
}
