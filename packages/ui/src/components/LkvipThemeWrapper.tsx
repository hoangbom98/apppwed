import React from 'react';
import { ConfigProvider, ThemeConfig } from 'antd';

// Đây là nơi bạn sẽ lưu cấu hình theme (có thể fetch từ API hoặc lấy từ database)
export const LkvipThemeWrapper: React.FC<{
  children: React.ReactNode;
  themeConfig?: ThemeConfig;
}> = ({ children, themeConfig }) => {

  // Mặc định các quy chuẩn Ant Design cho dự án
  const defaultTheme: ThemeConfig = {
    token: {
      colorPrimary: '#FF6A00', // Màu thương hiệu LKVIP
      borderRadius: 8,
      fontSize: 14,
    },
    components: {
      Divider: {
        colorSplit: 'rgba(0, 0, 0, 0.06)',
      },
    },
  };

  return (
    <ConfigProvider theme={themeConfig || defaultTheme}>
      {children}
    </ConfigProvider>
  );
};
