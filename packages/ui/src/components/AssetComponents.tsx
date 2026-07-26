import React from 'react';
import { ASSET_STANDARDS } from '@lkvip/constants';

interface AssetProps {
  src: string;
  alt: string;
  className?: string;
}

export const Logo: React.FC<AssetProps & { type?: 'main' | 'partner' }> = ({ src, alt, className = '', type = 'main' }) => {
  const styles = type === 'main'
    ? `${ASSET_STANDARDS.logo.main.height} ${ASSET_STANDARDS.logo.main.width}`
    : `${ASSET_STANDARDS.logo.partner.width} ${ASSET_STANDARDS.logo.partner.height}`;

  return (
    <img
      src={src}
      alt={alt}
      className={`${styles} object-contain ${className}`}
      loading="lazy"
    />
  );
};

export const Banner: React.FC<AssetProps & { type?: 'main' | 'card' }> = ({ src, alt, className = '', type = 'main' }) => {
  const styles = type === 'main'
    ? ASSET_STANDARDS.banner.main
    : ASSET_STANDARDS.banner.card;

  return (
    <img
      src={src}
      alt={alt}
      className={`${styles} w-full ${className}`}
      loading="lazy"
    />
  );
};

export const Icon: React.FC<AssetProps> = ({ src, alt, className = '' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`${ASSET_STANDARDS.logo.icon.size} object-contain ${className}`}
      loading="lazy"
    />
  );
};
