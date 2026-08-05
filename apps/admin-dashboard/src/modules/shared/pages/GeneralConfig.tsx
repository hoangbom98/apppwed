/**
 * GeneralConfig.jsx
 * Admin page for managing per-project UI / branding / social / feature configurations.
 * Route: /config/general
 *
 * Features:
 * - Select project (hub, game, trade, dating, sports)
 * - Groups configs by module + group in collapsible sections
 * - Renders type-appropriate inputs (text, number, boolean toggle, image URL)
 * - Bulk save with a single PUT /admin/ui-config
 * - Inline cache bust after save
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Segmented,
  Collapse,
  Switch,
  Input,
  InputNumber,
  Spin,
  Alert,
  Empty,
  Button,
} from 'antd';
import api from '@admin/api/client';
import ThemeLivePreview from '../components/ThemeLivePreview';

const PROJECTS = [
  { code: 'hub',    label: 'Hub Portal' },
  { code: 'game',   label: 'Game Center' },
  { code: 'trade',  label: 'Trade Pro' },
  { code: 'dating', label: 'VietDating' },
  { code: 'sports', label: 'Sports Live' },
];

const MODULE_LABELS = {
  general: 'Giao diện & Thương hiệu',
  social:  'Mạng xã hội & Liên hệ',
  feature: 'Tính năng',
};

const GROUP_LABELS = {
  brand:   'Thương hiệu',
  colors:  'Màu sắc',
  social:  'Mạng xã hội',
  feature: 'Tính năng',
};

function buildPreviewConfig(configs, changes) {
  return (configs ?? []).reduce((acc, item) => {
    const group = item.group || item.module || 'general';
    if (!acc[group]) acc[group] = {};
    acc[group][item.key] = changes[item.id] !== undefined ? changes[item.id] : item.value;
    return acc;
  }, {});
}

// ── Type-aware input ─────────────────────────────────────────────────────────���─
function ConfigInput({ item, value, onChange }) {
  if (item.type === 'boolean') {
    return <Switch checked={value} onChange={onChange} />;
  }

  if (item.type === 'image') {
    return (
      <div className="space-y-1">
        <Input
          value={value ?? ''}
          placeholder="URL hoặc đường dẫn ảnh"
          onChange={e => onChange(e.target.value)}
        />
        {value && (
          <img
            src={value}
            alt="preview"
            className="h-12 w-auto object-contain rounded border border-gray-700"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    );
  }

  if (item.type === 'number') {
    return (
      <InputNumber
        className="w-full"
        value={value ?? ''}
        onChange={onChange}
      />
    );
  }

  return (
    <Input
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── Inner page (needs App context for message) ────────────────────────────────
function GeneralConfigInner() {
  const { message } = App.useApp();
  const [project, setProject] = useState('hub');
  const [changes, setChanges] = useState({});
  const qc = useQueryClient();

  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['uiConfig', project],
    queryFn:  () =>
      api.get('/admin/ui-config', { params: { project } }).then(r => r.data?.data ?? r.data ?? []),
  });

  const sections = useMemo(() => {
    const map = {};
    (configs ?? []).filter(c => c.editable !== false).forEach(c => {
      const key = `${c.module}||${c.group}`;
      if (!map[key]) map[key] = { module: c.module, group: c.group, items: [] };
      map[key].items.push(c);
    });
    return Object.values(map);
  }, [configs]);

  const valueOf = (item) => {
    const changed = changes[item.id];
    return changed !== undefined ? changed : item.value;
  };

  const handleChange = (item, val) => {
    setChanges(prev => ({ ...prev, [item.id]: val }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const updatedIds = Object.keys(changes);
      if (!updatedIds.length) return Promise.resolve();
      const items = configs.filter(c => updatedIds.includes(c.id));
      const updates = items.map(c => ({
        module: c.module,
        group:  c.group,
        key:    c.key,
        value:  changes[c.id],
        type:   c.type,
      }));
      return api.put('/admin/ui-config', { project, updates });
    },
    onSuccess: () => {
      setChanges({});
      qc.invalidateQueries({ queryKey: ['uiConfig', project] });
      message.success('Đã lưu cấu hình thành công');
    },
    onError: (err) => message.error(err?.response?.data?.message || 'Lỗi khi lưu'),
  });

  const hasChanges = Object.keys(changes).length > 0;
  const previewConfig = useMemo(() => buildPreviewConfig(configs, changes), [configs, changes]);

  const collapseItems = sections.map(sec => {
    const secKey   = `${sec.module}||${sec.group}`;
    const secTitle = `${MODULE_LABELS[sec.module] || sec.module} › ${GROUP_LABELS[sec.group] || sec.group}`;
    return {
      key:      secKey,
      label:    <span className="font-semibold text-sm">{secTitle}</span>,
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sec.items.map(item => (
            <div key={item.id} className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-300">
                {item.description || item.key}
                <span className="ml-1 text-[10px] text-gray-600 font-mono">[{item.key}]</span>
              </label>
              <ConfigInput
                item={item}
                value={valueOf(item)}
                onChange={val => handleChange(item, val)}
              />
            </div>
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page title + project selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Cấu hình giao diện</h1>
          <p className="text-sm text-gray-400 mt-0.5">Thay đổi thương hiệu, màu sắc, liên hệ theo dự án</p>
        </div>
        <div className="sm:ml-auto">
          <Segmented
            options={PROJECTS.map(p => ({ label: p.label, value: p.code }))}
            value={project}
            onChange={val => { setProject(val); setChanges({}); }}
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-16 flex justify-center">
          <Spin size="large" />
        </div>
      )}

      {isError && !isLoading && (
        <Alert type="error" message="Không thể tải cấu hình. Kiểm tra kết nối." showIcon />
      )}

      {!isLoading && !isError && sections.length === 0 && (
        <Empty
          description={
            <span>
              Chưa có cấu hình nào. Chạy seed:{' '}
              <code className="text-blue-400">node backend/src/prisma/seeds/ui-config.seed.js</code>
            </span>
          }
        />
      )}

      {!isLoading && sections.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5 items-start">
          <div className="min-w-0">
            <Collapse
              defaultActiveKey={sections.map(sec => `${sec.module}||${sec.group}`)}
              items={collapseItems}
            />
          </div>
          <div className="xl:sticky xl:top-20">
            <ThemeLivePreview config={previewConfig} project={project} />
          </div>
        </div>
      )}

      {!isLoading && sections.length > 0 && (
        <div className={`sticky bottom-4 flex items-center gap-4 p-4 rounded-xl border transition-colors ${
          hasChanges ? 'bg-gray-900 border-blue-600/60' : 'bg-gray-900/60 border-gray-800'
        }`}>
          {hasChanges
            ? <p className="text-sm text-yellow-400 flex-1">Có <strong>{Object.keys(changes).length}</strong> thay đổi chưa lưu.</p>
            : <p className="text-sm text-gray-500 flex-1">Mọi thay đổi đã được lưu.</p>
          }
          <Button onClick={() => setChanges({})} disabled={!hasChanges || saveMutation.isPending}>
            Huỷ
          </Button>
          <Button
            type="primary"
            loading={saveMutation.isPending}
            disabled={!hasChanges}
            onClick={() => saveMutation.mutate()}
          >
            Lưu cấu hình
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GeneralConfig() {
  return (
    <App>
      <GeneralConfigInner />
    </App>
  );
}
