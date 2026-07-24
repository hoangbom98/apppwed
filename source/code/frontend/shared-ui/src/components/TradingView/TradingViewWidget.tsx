import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  widgetType: string;
  widgetOptions: any;
  containerId?: string;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  widgetType,
  widgetOptions,
  containerId = 'tradingview-widget',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Xóa script cũ nếu có
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Tạo container
    const container = containerRef.current;
    if (!container) return;

    // Xóa nội dung cũ
    container.innerHTML = '';

    // Tạo div chứa widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    // Tạo copyright
    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright';
    copyright.innerHTML = `
      <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
        <span class="blue-text">Track all markets on TradingView</span>
      </a>
    `;
    container.appendChild(copyright);

    // Tạo script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
    script.async = true;

    // Thêm options vào script
    const options = {
      ...widgetOptions,
      container_id: containerId,
    };
    script.textContent = JSON.stringify(options);

    container.appendChild(script);
    scriptRef.current = script;

    // Cleanup
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [widgetType, widgetOptions, containerId]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
