import React from 'react';
import { Layout, Row, Col, Flex, Splitter, LayoutProps } from 'antd';

// 1. Wrapper Layout Standard
export const LkvipLayout: React.FC<LayoutProps & { children: React.ReactNode }> = ({ children, ...props }) => {
  return (
    <Layout style={{ minHeight: '100vh' }} {...props}>
      {children}
    </Layout>
  );
};

// 2. Grid Wrapper Standard
export const LkvipGrid: React.FC<{ children: React.ReactNode; gutter?: number | [number, number] }> = ({ children, gutter = 16 }) => {
  return (
    <Row gutter={gutter}>
      {React.Children.map(children, (child) => (
        <Col span={24} md={12} lg={8} xl={6}>
          {child}
        </Col>
      ))}
    </Row>
  );
};

// 3. Splitter Wrapper Standard (Admin use cases)
export const LkvipSplitter: React.FC<{ left: React.ReactNode; right: React.ReactNode; defaultSize?: string }> = ({ left, right, defaultSize = '30%' }) => {
  return (
    <Splitter style={{ height: '100%', border: '1px solid #d9d9d9', borderRadius: 8 }}>
      <Splitter.Panel defaultSize={defaultSize} min="20%" max="70%">
        {left}
      </Splitter.Panel>
      <Splitter.Panel>
        {right}
      </Splitter.Panel>
    </Splitter>
  );
};

// Re-export Flex for standardization
export { Flex };
