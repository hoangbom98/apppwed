// @ts-nocheck
// packages/shared-ui/src/components/DownloadModal.tsx
import React from 'react';
import { Modal, QRCode } from 'antd';

interface DownloadModalProps {
  open:          boolean;
  onClose:       () => void;
  appName?:      string;
  appIcon?:      string;
  iosUrl?:       string;
  androidUrl?:   string;
  iosLink?:      string;
  androidLink?:  string;
  primaryColor?: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  open, onClose, appName = 'LKVIP', iosUrl, androidUrl, iosLink, androidLink,
}) => {
  const ios     = iosUrl     ?? iosLink;
  const android = androidUrl ?? androidLink;

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={`Tải ${appName}`} centered>
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', padding: '16px 0' }}>
        {android && (
          <div style={{ textAlign: 'center' }}>
            <QRCode value={android} size={128} />
            <div style={{ marginTop: 8 }}>Android</div>
          </div>
        )}
        {ios && (
          <div style={{ textAlign: 'center' }}>
            <QRCode value={ios} size={128} />
            <div style={{ marginTop: 8 }}>iOS</div>
          </div>
        )}
      </div>
    </Modal>
  );
};
