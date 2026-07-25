// @ts-nocheck
// packages/shared-ui/src/components/DownloadButton.tsx
import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';

export interface DownloadButtonProps extends ButtonProps {
  platform?:     'ios' | 'android';
  androidLink?:  string;
  iosLink?:      string;
  primaryColor?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  platform, children, androidLink, iosLink, primaryColor, style, ...rest
}) => {
  const label = platform === 'ios' ? '📱 App Store' : platform === 'android' ? '🤖 Google Play' : children ?? '📥 Tải App';
  const href  = platform === 'ios' ? iosLink : platform === 'android' ? androidLink : undefined;
  const btnStyle = primaryColor ? { ...style, background: primaryColor, borderColor: primaryColor } : style;
  return (
    <Button type="primary" size="large" href={href} style={btnStyle} {...rest}>
      {label}
    </Button>
  );
};
