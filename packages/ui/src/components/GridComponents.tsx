import React from 'react';
import { Row, Col, RowProps } from 'antd';

// Standardized Responsive Grid
export const LkvipGrid: React.FC<RowProps & { children: React.ReactNode }> = ({ children, gutter = [16, 16], ...props }) => {
  return (
    <Row gutter={gutter} {...props}>
      {React.Children.map(children, (child) => (
        // Enforce responsive column behavior:
        // 1 column on mobile, 2 on tablet, 4 on desktop
        <Col xs={24} sm={12} lg={6}>
          {child}
        </Col>
      ))}
    </Row>
  );
};
