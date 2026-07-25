// packages/shared-ui/src/components/AppDistributionPage.tsx
import React, { useState } from 'react';
import { Button, QRCode, Tabs } from 'antd';

interface AppDistributionPageProps {
  iosUrl?:      string;
  androidUrl?:  string;
  apkUrl?:      string;
  appName?:     string;
  // dating passes the whole app object as appData
  appData?:     Record<string, any>;
  config?:      Record<string, any>;
}

export const AppDistributionPage: React.FC<AppDistributionPageProps> = (rawProps) => {
  const merged     = { ...(rawProps.appData ?? {}), ...(rawProps as Record<string, any>) } as Record<string, any>;
  const iosUrl     = merged.iosUrl     ?? merged.iosLink;
  const androidUrl = merged.androidUrl ?? merged.androidLink;
  const apkUrl     = merged.apkUrl;
  const appName    = merged.appName    ?? merged.name ?? 'LKVIP';

  const [tab, setTab] = useState('android');

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 24 }}>Tải ứng dụng {appName}</h2>
      <Tabs activeKey={tab} onChange={setTab} centered items={[
        {
          key: 'android',
          label: '🤖 Android',
          children: (
            <div>
              {androidUrl && <QRCode value={androidUrl} size={180} style={{ margin: '0 auto 16px' }} />}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {androidUrl && <Button type="primary" href={androidUrl}>Google Play</Button>}
                {apkUrl     && <Button href={apkUrl}>Tải APK trực tiếp</Button>}
              </div>
            </div>
          ),
        },
        {
          key: 'ios',
          label: '🍎 iOS',
          children: (
            <div>
              {iosUrl
                ? <>
                    <QRCode value={iosUrl} size={180} style={{ margin: '0 auto 16px' }} />
                    <Button type="primary" href={iosUrl}>App Store</Button>
                  </>
                : <p style={{ color: '#8892b0' }}>Sắp ra mắt trên iOS</p>
              }
            </div>
          ),
        },
      ]} />
    </div>
  );
};
