import { ThemeConfig } from 'antd';

export const binanceThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#FCD535',
    colorTextBase: '#181a20', // Default ink color
    colorBgBase: '#ffffff',   // Default canvas light
    borderRadius: 6,
    fontFamily: '"BinanceNova", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontWeight: 600,
      colorPrimary: '#FCD535',
      colorPrimaryHover: '#f0b90b',
      colorTextLightSolid: '#181a20', // Text on primary
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 12,
    },
    Table: {
      headerColor: '#707a8a',
    }
  }
};
