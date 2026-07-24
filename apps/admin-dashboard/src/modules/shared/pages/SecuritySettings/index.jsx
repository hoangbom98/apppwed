/**
 * SecuritySettings/index.jsx
 * Route: /settings/security
 *
 * System Security Settings page — tabbed layout with:
 *   Tab 1: Brute Force Protection
 *   Tab 2: Access Control
 *   Tab 3: Captcha Settings
 *   Tab 4: Other Security
 */
import React, { useState } from 'react';
import {
  App, Tabs, Button, Modal, Alert, Spin, Space,
} from 'antd';
import {
  LockOutlined, TeamOutlined, SafetyOutlined, SettingOutlined,
  SaveOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useSecuritySettings } from './hooks/useSecuritySettings';
import BruteForceProtection from './components/BruteForceProtection';
import AccessControl        from './components/AccessControl';
import CaptchaSettings      from './components/CaptchaSettings';
import OtherSecurity        from './components/OtherSecurity';

const TABS = [
  { key: 'bruteforce', label: 'Brute Force',        icon: <LockOutlined />,    component: BruteForceProtection },
  { key: 'access',     label: 'Kiểm soát truy cập', icon: <TeamOutlined />,    component: AccessControl },
  { key: 'captcha',    label: 'Captcha',             icon: <SafetyOutlined />,  component: CaptchaSettings },
  { key: 'other',      label: 'Bảo mật khác',        icon: <SettingOutlined />, component: OtherSecurity },
];

function SecuritySettingsInner() {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState('bruteforce');

  const {
    settings,
    isLoading,
    isError,
    isDirty,
    isSaving,
    isResetting,
    saveError,
    handleChange,
    save,
    discardDraft,
    resetToDefault,
  } = useSecuritySettings();

  const handleSave = async () => {
    try {
      await save();
      message.success('Đã lưu cài đặt bảo mật thành công!');
    } catch {
      message.error(saveError || 'Lưu cài đặt thất bại!');
    }
  };

  const handleReset = () => {
    modal.confirm({
      title: 'Xác nhận Reset',
      content: (
        <p>
          Bạn có chắc muốn reset <strong>toàn bộ cài đặt bảo mật</strong>{' '}
          về giá trị mặc định của hệ thống? Hành động này không thể hoàn tác.
        </p>
      ),
      okText: 'Reset mặc định',
      okButtonProps: { danger: true, loading: isResetting },
      cancelText: 'Huỷ',
      onOk: () =>
        resetToDefault(undefined, {
          onSuccess: () => message.success('Đã reset cài đặt về mặc định.'),
          onError:   () => message.error('Reset thất bại!'),
        }),
    });
  };

  const tabItems = TABS.map(tab => ({
    key:      tab.key,
    label:    <span>{tab.icon} {tab.label}</span>,
    children: (
      <tab.component settings={settings} onChange={handleChange} />
    ),
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Spin size="large" />
        <span className="text-sm">Đang tải cài đặt bảo mật...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <SafetyOutlined style={{ fontSize: 20, color: '#f87171' }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Cài đặt bảo mật hệ thống</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Cấu hình bảo vệ chống tấn công, kiểm soát truy cập, Captcha và các tuỳ chọn bảo mật khác
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <Space size={8} className="flex-shrink-0">
          {isDirty && (
            <Button onClick={discardDraft}>Huỷ thay đổi</Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Reset mặc định
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </Space>
      </div>

      {/* API error banner */}
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải cài đặt từ server. Đang hiển thị giá trị mặc định."
        />
      )}

      {/* Unsaved changes banner */}
      {isDirty && (
        <Alert
          type="warning"
          showIcon
          message={<span>Bạn có thay đổi chưa được lưu. Nhấn <strong>Lưu cài đặt</strong> để áp dụng.</span>}
        />
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="line"
      />

      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky bottom-4 z-10 flex items-center gap-4 p-4 bg-gray-900 border border-blue-600/50 rounded-xl shadow-2xl">
          <p className="flex-1 text-sm text-yellow-300">Bạn có thay đổi chưa lưu.</p>
          <Button onClick={discardDraft}>Huỷ</Button>
          <Button type="primary" loading={isSaving} onClick={handleSave}>
            Lưu cài đặt
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <App>
      <SecuritySettingsInner />
    </App>
  );
}
