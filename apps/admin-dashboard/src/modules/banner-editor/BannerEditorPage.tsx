// @ts-nocheck
// apps/admin-dashboard/src/modules/banner-editor/BannerEditorPage.tsx
// Smart Banner Editor — Visual template builder + batch image generator.
//
// Layout:
//   Left sidebar  — Layer list + "Add layer" buttons
//   Centre canvas — react-konva live preview (drag-to-reposition)
//   Right panel   — Layer property editor + Generate controls
//   Bottom tabs   — Generated images gallery + Batch CSV upload
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal, Form, Input, InputNumber, Select, Slider,
  Upload, Button, Table, Tabs, Tag, Spin, App, Tooltip, Space,
  Typography, Divider, Popconfirm,
} from 'antd';
import {
  Plus, Trash2, Image, Type, Square, Layers,
  Download, UploadCloud, RefreshCw, ChevronLeft, Eye,
} from 'lucide-react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { bannerTemplateApi, bannerLayerApi, bannerGenerateApi } from './api';
import type { BannerTemplate, BannerLayer, GeneratedImage } from './api';

const { Option } = Select;

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_SCALE       = 0.75;   // preview scale (keeps UI compact)
const LAYER_TYPE_ICONS   = { background: <Square size={14} />, image: <Image size={14} />, text: <Type size={14} />, button: <Square size={14} /> };
const LAYER_TYPE_COLORS  = { background: 'blue', image: 'green', text: 'orange', button: 'purple' };
const TEMPLATE_CATEGORIES = [
  'card-banner', 'hero-banner', 'thumbnail', 'popup', 'qr', 'vip-card', 'custom',
];

// ── Utility: parse CSV text → array of objects ─────────────────────────────
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return headers.reduce((acc, h, i) => ({ ...acc, [h]: (vals[i] ?? '').trim() }), {});
  });
}

// ── KonvaLayer: renders one layer node on the canvas ─────────────────────────
function KonvaLayerNode({ layer, isSelected, onSelect, onChange }) {
  const shapeRef = useRef(null);
  const trRef    = useRef(null);
  const [img]    = useImage(layer.type === 'image' ? (layer.data?.src || '') : '');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const common = {
    ref:       shapeRef,
    x:         layer.x      * CANVAS_SCALE,
    y:         layer.y      * CANVAS_SCALE,
    draggable: true,
    onClick:   () => onSelect(layer.id),
    onTap:     () => onSelect(layer.id),
    onDragEnd: (e) => onChange(layer.id, { x: e.target.x() / CANVAS_SCALE, y: e.target.y() / CANVAS_SCALE }),
    onTransformEnd: (_e) => {
      const node = shapeRef.current;
      onChange(layer.id, {
        x:      node.x() / CANVAS_SCALE,
        y:      node.y() / CANVAS_SCALE,
        width:  node.width()  * node.scaleX() / CANVAS_SCALE,
        height: node.height() * node.scaleY() / CANVAS_SCALE,
      });
      node.scaleX(1);
      node.scaleY(1);
    },
  };

  return (
    <>
      {layer.type === 'image' && img && (
        <KonvaImage
          {...common}
          image={img}
          width={(layer.width  || 200) * CANVAS_SCALE}
          height={(layer.height || 200) * CANVAS_SCALE}
          opacity={0.92}
        />
      )}
      {layer.type === 'text' && (
        <KonvaText
          {...common}
          text={layer.data?.text || ''}
          fontSize={(layer.data?.fontSize || 24) * CANVAS_SCALE}
          fill={layer.data?.color || '#ffffff'}
          fontStyle={layer.data?.fontWeight === 'bold' ? 'bold' : 'normal'}
          align={layer.data?.textAlign || 'left'}
        />
      )}
      {layer.type === 'button' && (
        <>
          <Rect
            {...common}
            width={(layer.width || 140) * CANVAS_SCALE}
            height={(layer.height || 44) * CANVAS_SCALE}
            fill={layer.data?.backgroundColor || '#0064e0'}
            cornerRadius={(layer.data?.borderRadius || 8) * CANVAS_SCALE}
          />
          <KonvaText
            x={common.x + 10 * CANVAS_SCALE}
            y={common.y + 12 * CANVAS_SCALE}
            text={layer.data?.text || 'Click'}
            fontSize={(layer.data?.fontSize || 16) * CANVAS_SCALE}
            fill={layer.data?.textColor || '#ffffff'}
            fontStyle="bold"
            listening={false}
          />
        </>
      )}
      {layer.type === 'background' && (
        <Rect
          {...common}
          draggable={false}
          listening={false}
          width={100 * CANVAS_SCALE}
          height={30 * CANVAS_SCALE}
          fill="transparent"
        />
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
        />
      )}
    </>
  );
}

// ── LayerPropertyEditor ───────────────────────────────────────────────────────
function LayerPropertyEditor({ layer, onUpdate }: { layer: BannerLayer | null; onUpdate: (id: string, data: Partial<BannerLayer>) => void }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (layer) form.setFieldsValue({ ...layer, ...layer.data });
  }, [layer?.id]);

  if (!layer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-2 py-12">
        <Layers size={32} className="text-gray-600" />
        <span>Chọn một layer để chỉnh sửa</span>
      </div>
    );
  }

  const handleChange = (_: unknown, all: Record<string, unknown>) => {
    const { x, y, width, height, zIndex, name, ...dataFields } = all;
    onUpdate(layer.id, {
      ...(name   !== undefined ? { name }         : {}),
      ...(x      !== undefined ? { x: Number(x) } : {}),
      ...(y      !== undefined ? { y: Number(y) } : {}),
      ...(width  !== undefined ? { width: Number(width) }   : {}),
      ...(height !== undefined ? { height: Number(height) } : {}),
      ...(zIndex !== undefined ? { zIndex: Number(zIndex) } : {}),
      data: { ...layer.data, ...dataFields },
    });
  };

  return (
    <Form form={form} layout="vertical" size="small" onValuesChange={handleChange} className="px-1">
      <Form.Item label="Tên layer" name="name">
        <Input />
      </Form.Item>
      <div className="grid grid-cols-2 gap-x-2">
        <Form.Item label="X" name="x"><InputNumber className="w-full" /></Form.Item>
        <Form.Item label="Y" name="y"><InputNumber className="w-full" /></Form.Item>
        <Form.Item label="W" name="width"><InputNumber className="w-full" /></Form.Item>
        <Form.Item label="H" name="height"><InputNumber className="w-full" /></Form.Item>
      </div>
      <Form.Item label="Z-Index" name="zIndex"><InputNumber className="w-full" min={0} /></Form.Item>

      {layer.type === 'image' && (
        <>
          <Divider orientation="left" className="!text-xs !text-gray-400">Ảnh</Divider>
          <Form.Item label="URL ảnh" name="src"><Input placeholder="https://..." /></Form.Item>
        </>
      )}

      {(layer.type === 'text' || layer.type === 'button') && (
        <>
          <Divider orientation="left" className="!text-xs !text-gray-400">Văn bản</Divider>
          <Form.Item label="Nội dung" name="text">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Cỡ chữ" name="fontSize">
            <Slider min={10} max={96} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-2">
            <Form.Item label="Màu chữ" name="color">
              <Input placeholder="#ffffff" />
            </Form.Item>
            <Form.Item label="Font weight" name="fontWeight">
              <Select>
                <Option value="normal">Normal</Option>
                <Option value="bold">Bold</Option>
              </Select>
            </Form.Item>
          </div>
        </>
      )}

      {layer.type === 'button' && (
        <>
          <Divider orientation="left" className="!text-xs !text-gray-400">Button</Divider>
          <Form.Item label="Màu nền" name="backgroundColor"><Input placeholder="#0064e0" /></Form.Item>
          <Form.Item label="Màu text" name="textColor"><Input placeholder="#ffffff" /></Form.Item>
          <div className="grid grid-cols-2 gap-x-2">
            <Form.Item label="Border radius" name="borderRadius"><InputNumber className="w-full" min={0} /></Form.Item>
            <Form.Item label="Padding X" name="paddingX"><InputNumber className="w-full" min={0} /></Form.Item>
          </div>
        </>
      )}

      {layer.type === 'text' && (
        <>
          <Form.Item label="Màu nền text" name="backgroundColor"><Input placeholder="transparent" /></Form.Item>
          <Form.Item label="Padding" name="padding"><InputNumber className="w-full" min={0} /></Form.Item>
          <Form.Item label="Căn chữ" name="textAlign">
            <Select>
              <Option value="left">Trái</Option>
              <Option value="center">Giữa</Option>
              <Option value="right">Phải</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Đổ bóng" name="shadow" valuePropName="checked">
            <Select>
              <Option value={true}>Có</Option>
              <Option value={false}>Không</Option>
            </Select>
          </Form.Item>
        </>
      )}
    </Form>
  );
}

// ── AddLayerModal ─────────────────────────────────────────────────────────────
function AddLayerModal({ open, onOk, onCancel, loading }) {
  const [form] = Form.useForm();
  return (
    <Modal
      open={open}
      title="Thêm layer mới"
      onOk={() => form.validateFields().then(v => { onOk(v); form.resetFields(); }).catch(() => {})}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Thêm"
      cancelText="Huỷ"
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'text', x: 0, y: 0, zIndex: 0 }}>
        <Form.Item label="Loại layer" name="type" rules={[{ required: true }]}>
          <Select>
            <Option value="image">🖼 Ảnh (Image)</Option>
            <Option value="text">🔤 Chữ (Text)</Option>
            <Option value="button">🔘 Nút bấm (Button)</Option>
            <Option value="background">🎨 Nền (Background)</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Tên layer" name="name">
          <Input placeholder="Tên hiển thị" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item label="X" name="x"><InputNumber className="w-full" /></Form.Item>
          <Form.Item label="Y" name="y"><InputNumber className="w-full" /></Form.Item>
          <Form.Item label="Z-Index" name="zIndex"><InputNumber className="w-full" min={0} /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

// ── CreateTemplateModal ───────────────────────────────────────────────────────
function CreateTemplateModal({ open, onOk, onCancel, loading }) {
  const [form] = Form.useForm();
  return (
    <Modal
      open={open}
      title="Tạo template banner mới"
      onOk={() => form.validateFields().then(v => { onOk(v); form.resetFields(); }).catch(() => {})}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Tạo"
      cancelText="Huỷ"
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={{ category: 'card-banner', width: 800, height: 400, background: '#1a1a2e' }}>
        <Form.Item label="Tên template" name="name" rules={[{ required: true, message: 'Nhập tên template' }]}>
          <Input placeholder="VD: Banner khuyến mãi tháng 7" />
        </Form.Item>
        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item label="Loại" name="category">
            <Select>
              {TEMPLATE_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Màu nền / URL ảnh nền" name="background">
            <Input placeholder="#1a1a2e" />
          </Form.Item>
          <Form.Item label="Chiều rộng (px)" name="width"><InputNumber className="w-full" min={100} max={3840} /></Form.Item>
          <Form.Item label="Chiều cao (px)" name="height"><InputNumber className="w-full" min={50} max={2160} /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main: BannerTemplateListPage (route: /banner-editor)
// ═══════════════════════════════════════════════════════════════════════════
export function BannerTemplateListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['banner-templates'],
    queryFn:  () => bannerTemplateApi.list().then(r => r?.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: bannerTemplateApi.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['banner-templates'] });
      setShowCreate(false);
      message.success('Đã tạo template');
      navigate(`/banner-editor/${res.data.id}`);
    },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi tạo template'),
  });

  const deleteMutation = useMutation({
    mutationFn: bannerTemplateApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banner-templates'] });
      message.success('Đã xoá template');
    },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi xoá template'),
  });

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      render: (v: string, row: any) => (
        <button onClick={() => navigate(`/banner-editor/${row.id}`)} className="text-blue-400 hover:underline font-medium text-left">
          {v}
        </button>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'category',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Kích thước',
      render: (_: unknown, row: any) => <span className="font-mono text-gray-400 text-xs">{row.width} × {row.height}</span>,
    },
    {
      title: 'Layers',
      render: (_: unknown, row: any) => <Tag>{row._count?.layers ?? 0} layers</Tag>,
    },
    {
      title: 'Ảnh đã tạo',
      render: (_: unknown, row: any) => <Tag color="green">{row._count?.images ?? 0}</Tag>,
    },
    {
      title: '',
      render: (_: unknown, row: any) => (
        <Space>
          <Button size="small" icon={<Eye size={13} />} onClick={() => navigate(`/banner-editor/${row.id}`)}>
            Mở Editor
          </Button>
          <Popconfirm title="Xoá template?" onConfirm={() => deleteMutation.mutate(row.id)}>
            <Button size="small" danger icon={<Trash2 size={13} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Smart Banner Editor</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tạo và quản lý template banner, thumbnail, card khuyến mãi</p>
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          Tạo template mới
        </Button>
      </div>

      <Table
        dataSource={data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
        size="middle"
      />

      <CreateTemplateModal
        open={showCreate}
        onOk={(v) => createMutation.mutate(v)}
        onCancel={() => setShowCreate(false)}
        loading={createMutation.isPending}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main: BannerEditorPage (route: /banner-editor/:id)
// ═══════════════════════════════════════════════════════════════════════════
export default function BannerEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const stageRef          = useRef(null);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [localLayers, setLocalLayers]       = useState<BannerLayer[]>([]);
  const [showAddLayer, setShowAddLayer]     = useState(false);
  const [batchVariants, setBatchVariants]   = useState<Record<string, string>[]>([]);
  const [activeTab, setActiveTab]           = useState('gallery');
  const [variantDataJson, setVariantDataJson] = useState('{}');

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data: template, isLoading } = useQuery<BannerTemplate>({
    queryKey: ['banner-template', id],
    queryFn:  () => bannerTemplateApi.get(id!),
    enabled:  !!id,
  });

  const { data: imagesData } = useQuery({
    queryKey: ['banner-images', id, activeTab],
    queryFn:  () => bannerGenerateApi.listImages(id!).then(r => r?.data ?? []),
    enabled:  !!id && activeTab === 'gallery',
  });

  // Sync layers from server into local state
  useEffect(() => {
    if (template?.layers) setLocalLayers([...template.layers].sort((a, b) => a.zIndex - b.zIndex));
  }, [template]);

  // ── Local layer updates (optimistic — saved via PATCH on blur/confirm) ──
  const updateLocalLayer = useCallback((layerId: string, patch: Partial<BannerLayer>) => {
    setLocalLayers(prev => prev.map(l => l.id === layerId ? { ...l, ...patch, data: { ...l.data, ...patch.data } } : l));
  }, []);

  const selectedLayer = localLayers.find(l => l.id === selectedId) ?? null;

  // ── Mutations ────────────────────────────────────────────────────────────
  const addLayerMutation = useMutation({
    mutationFn: (body: Partial<BannerLayer>) => bannerLayerApi.add(id!, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banner-template', id] }); setShowAddLayer(false); message.success('Đã thêm layer'); },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi thêm layer'),
  });

  const saveLayerMutation = useMutation({
    mutationFn: ({ layerId, patch }: { layerId: string; patch: Partial<BannerLayer> }) =>
      bannerLayerApi.update(layerId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banner-template', id] }),
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi lưu layer'),
  });

  const deleteLayerMutation = useMutation({
    mutationFn: bannerLayerApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banner-template', id] }); setSelectedId(null); message.success('Đã xoá layer'); },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi xoá layer'),
  });

  const generateMutation = useMutation({
    mutationFn: () => {
      let variant = {};
      try { variant = JSON.parse(variantDataJson); } catch { /* keep {} */ }
      return bannerGenerateApi.single(id!, variant);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banner-images', id, 'gallery'] }); setActiveTab('gallery'); message.success('Đã tạo banner!'); },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi generate'),
  });

  const batchMutation = useMutation({
    mutationFn: () => bannerGenerateApi.batch(id!, batchVariants),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['banner-images', id, 'gallery'] });
      setActiveTab('gallery');
      message.success(`Đã tạo ${res?.data?.successCount ?? 0}/${batchVariants.length} banner`);
    },
    onError: (e: any) => message.error(e?.response?.data?.error || 'Lỗi batch'),
  });

  const deleteImageMutation = useMutation({
    mutationFn: bannerGenerateApi.deleteImage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['banner-images', id, 'gallery'] }); message.success('Đã xoá'); },
  });

  // ── Save current local layer state to backend ────────────────────────────
  const handleSaveLayer = () => {
    if (!selectedLayer) return;
    saveLayerMutation.mutate({ layerId: selectedLayer.id, patch: selectedLayer });
  };

  // ── CSV upload handler ───────────────────────────────────────────────────
  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const variants = parseCsv(e.target?.result as string);
      setBatchVariants(variants);
      message.info(`Đã đọc ${variants.length} dòng từ CSV`);
    };
    reader.readAsText(file);
    return false; // prevent antd auto-upload
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>;
  if (!template) return <div className="text-center text-gray-400 py-16">Template không tồn tại.</div>;

  const canvasW = template.width  * CANVAS_SCALE;
  const canvasH = template.height * CANVAS_SCALE;

  // ── Gallery columns ──────────────────────────────────────────────────────
  const imageColumns = [
    {
      title: 'Preview',
      dataIndex: 'url',
      render: (url: string) => (
        <img src={url} alt="banner" className="rounded" style={{ width: 120, height: 64, objectFit: 'cover' }} />
      ),
    },
    { title: 'Format', dataIndex: 'format', render: (v: string) => <Tag>{v.toUpperCase()}</Tag> },
    { title: 'Size', render: (_: unknown, row: any) => `${row.width} × ${row.height}` },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: (v: string) => new Date(v).toLocaleString('vi') },
    {
      title: '',
      render: (_: unknown, row: any) => (
        <Space>
          <Tooltip title="Tải về">
            <Button size="small" icon={<Download size={13} />} href={row.url} target="_blank" />
          </Tooltip>
          <Popconfirm title="Xoá ảnh?" onConfirm={() => deleteImageMutation.mutate(row.id)}>
            <Button size="small" danger icon={<Trash2 size={13} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Button size="small" icon={<ChevronLeft size={14} />} onClick={() => navigate('/banner-editor')}>
            Danh sách
          </Button>
          <div>
            <span className="font-bold text-white">{template.name}</span>
            <Tag className="ml-2" color="blue">{template.category}</Tag>
            <span className="text-gray-500 text-xs ml-2">{template.width} × {template.height} px</span>
          </div>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<RefreshCw size={13} />}
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            Tạo ảnh
          </Button>
        </Space>
      </div>

      {/* ── Editor body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT: Layer list */}
        <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Layers</span>
            <Button
              size="small"
              type="dashed"
              icon={<Plus size={12} />}
              onClick={() => setShowAddLayer(true)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {localLayers.length === 0 && (
              <div className="text-center text-gray-600 text-xs py-8">Chưa có layer nào</div>
            )}
            {[...localLayers].sort((a, b) => b.zIndex - a.zIndex).map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedId(layer.id)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                  selectedId === layer.id ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <span className="text-gray-500">{LAYER_TYPE_ICONS[layer.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-200 truncate">{layer.name}</div>
                  <Tag color={LAYER_TYPE_COLORS[layer.type]} style={{ fontSize: 9, padding: '0 4px', lineHeight: '14px' }}>
                    {layer.type}
                  </Tag>
                </div>
                <Popconfirm
                  title="Xoá layer này?"
                  onConfirm={() => deleteLayerMutation.mutate(layer.id)}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="text-gray-600 hover:text-red-400 p-0.5 rounded"
                    onClick={e => e.stopPropagation()}
                  >
                    <Trash2 size={12} />
                  </button>
                </Popconfirm>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRE: Canvas */}
        <div className="flex-1 bg-gray-950 flex flex-col items-center justify-start p-6 overflow-auto">
          <div className="mb-3 text-xs text-gray-500">
            Preview (scale {Math.round(CANVAS_SCALE * 100)}%) — {template.width} × {template.height} px
          </div>
          <div
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6)', borderRadius: 6, overflow: 'hidden' }}
          >
            <Stage
              ref={stageRef}
              width={canvasW}
              height={canvasH}
              style={{ background: template.background || '#1a1a2e' }}
              onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
              <Layer>
                {localLayers.map(layer => (
                  <KonvaLayerNode
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedId === layer.id}
                    onSelect={setSelectedId}
                    onChange={updateLocalLayer}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Kéo thả layer để thay đổi vị trí • Click để chọn • Dùng handle để resize
          </div>
        </div>

        {/* RIGHT: Properties + Generate */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Thuộc tính
          </div>

          <div className="flex-1 p-2">
            <LayerPropertyEditor layer={selectedLayer} onUpdate={updateLocalLayer} />
          </div>

          {selectedLayer && (
            <div className="p-3 border-t border-gray-800">
              <Button
                type="primary"
                block
                size="small"
                loading={saveLayerMutation.isPending}
                onClick={handleSaveLayer}
              >
                Lưu thay đổi layer
              </Button>
            </div>
          )}

          <Divider className="!my-0" />

          {/* Variant data for single generate */}
          <div className="p-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Variant Data (JSON)
            </div>
            <Input.TextArea
              value={variantDataJson}
              onChange={e => setVariantDataJson(e.target.value)}
              rows={4}
              placeholder={'{\n  "layerId": { "text": "Giảm 50%" }\n}'}
              className="font-mono text-xs"
            />
            <div className="text-xs text-gray-600 mt-1">
              Key = layer ID, value = ghi đè data của layer đó
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom tabs: Gallery + Batch ── */}
      <div className="border-t border-gray-800 bg-gray-900" style={{ maxHeight: '38vh', overflowY: 'auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ marginBottom: 0, paddingLeft: 16 }}
          items={[
            {
              key: 'gallery',
              label: `Thư viện ảnh (${(imagesData as GeneratedImage[] | undefined)?.length ?? 0})`,
              children: (
                <div className="p-3">
                  <Table
                    size="small"
                    dataSource={(imagesData as GeneratedImage[] | undefined) || []}
                    columns={imageColumns}
                    rowKey="id"
                    pagination={false}
                    scroll={{ y: 200 }}
                  />
                </div>
              ),
            },
            {
              key: 'batch',
              label: 'Batch Generate (CSV)',
              children: (
                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <Upload.Dragger
                        accept=".csv"
                        beforeUpload={handleCsvUpload}
                        showUploadList={false}
                        style={{ background: 'transparent' }}
                      >
                        <p className="text-gray-400 text-sm">
                          <UploadCloud size={20} className="inline mr-2" />
                          Kéo thả file CSV vào đây
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          Mỗi cột là một layer ID, giá trị là text/color ghi đè
                        </p>
                      </Upload.Dragger>
                    </div>
                    <div className="w-48 space-y-2">
                      {batchVariants.length > 0 && (
                        <>
                          <div className="text-xs text-gray-400">
                            {batchVariants.length} variants sẵn sàng
                          </div>
                          <Button
                            type="primary"
                            block
                            loading={batchMutation.isPending}
                            onClick={() => batchMutation.mutate()}
                          >
                            Tạo {batchVariants.length} banner
                          </Button>
                          <Button block size="small" onClick={() => setBatchVariants([])}>
                            Xoá
                          </Button>
                        </>
                      )}
                      {batchVariants.length === 0 && (
                        <div className="text-xs text-gray-600 text-center py-4">
                          Upload file CSV để bắt đầu
                        </div>
                      )}
                    </div>
                  </div>
                  {batchVariants.length > 0 && (
                    <div className="bg-gray-800 rounded p-2 max-h-24 overflow-auto">
                      <pre className="text-xs text-gray-400">
                        {JSON.stringify(batchVariants.slice(0, 3), null, 2)}
                        {batchVariants.length > 3 && `\n... +${batchVariants.length - 3} more`}
                      </pre>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ── Modals ── */}
      <AddLayerModal
        open={showAddLayer}
        onOk={(v) => addLayerMutation.mutate(v)}
        onCancel={() => setShowAddLayer(false)}
        loading={addLayerMutation.isPending}
      />
    </div>
  );
}
