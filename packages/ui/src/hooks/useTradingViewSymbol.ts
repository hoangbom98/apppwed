// @ts-nocheck
import { useState, useEffect } from 'react';

export const useTradingViewSymbol = (defaultSymbol: string = 'NASDAQ:AAPL') => {
  const [symbol, setSymbol] = useState(defaultSymbol);

  useEffect(() => {
    // Lấy symbol từ URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const tvSymbol = urlParams.get('tvwidgetsymbol');
    if (tvSymbol) {
      setSymbol(tvSymbol);
    }
  }, []);

  return { symbol, setSymbol };
};
