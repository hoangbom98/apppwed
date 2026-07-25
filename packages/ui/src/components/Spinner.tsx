// packages/shared-ui/src/components/Spinner.tsx
import React from 'react';
import { Spin } from 'antd';

interface SpinnerProps {
  size?: 'small' | 'default' | 'large';
  fullPage?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'default', fullPage = false }) => {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size={size} />
      </div>
    );
  }
  return <Spin size={size} />;
};

export default Spinner;
