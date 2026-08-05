// Schema-driven dynamic form renderer.
//
// Usage:
//   import SchemaForm from '@admin/modules/shared/components/SchemaForm';
//
//   const schema = [
//     { key: 'name',       type: 'text',     label: 'Tên',         required: true },
//     { key: 'rtp',        type: 'number',   label: 'RTP (%)',     min: 0, max: 100 },
//     { key: 'volatility', type: 'select',   label: 'Volatility',
//       options: [{ label: 'Thấp', value: 'low' }, { label: 'Cao', value: 'high' }] },
//     { key: 'bio',        type: 'textarea', label: 'Giới thiệu',  rows: 4, maxLength: 500 },
//     { key: 'interests',  type: 'tags',     label: 'Sở thích',
//       suggestions: ['Gaming', 'Travel', 'Music'] },
//     { key: 'active',     type: 'toggle',   label: 'Kích hoạt' },
//   ];
//
//   <SchemaForm schema={schema} values={form} onChange={setForm} onSubmit={handleSubmit} />
//
// Schema field definition:
//   key:         string   — maps to the data object key
//   type:        string   — 'text' | 'number' | 'email' | 'password' | 'textarea' |
//                           'select' | 'multiselect' | 'tags' | 'toggle' | 'date'
//   label:       string   — visible label
//   required?:   boolean
//   placeholder?: string
//   min?:        number   — for type 'number'
//   max?:        number   — for type 'number'
//   maxLength?:  number   — for type 'textarea' | 'text'
//   rows?:       number   — for type 'textarea'
//   options?:    Array<{ label: string, value: string }> — for 'select' | 'multiselect'
//   suggestions?: string[] — for type 'tags'
//   disabled?:   boolean
//   helpText?:   string   — shown below the field
//   listHide?:   boolean  — if true, exclude from table rendering (CrudPage)
//
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

// ── Input base classes ─────────────────────────────────────────────────────────
const INPUT_BASE = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

// ── Field renderers ────────────────────────────────────────────────────────────

function TextField({ field, value, onChange }) {
  return (
    <input
      type={field.type === 'text' ? 'text' : field.type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder ?? ''}
      maxLength={field.maxLength}
      disabled={field.disabled}
      className={INPUT_BASE}
    />
  );
}

function NumberField({ field, value, onChange }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      placeholder={field.placeholder ?? ''}
      min={field.min}
      max={field.max}
      disabled={field.disabled}
      className={INPUT_BASE}
    />
  );
}

function TextAreaField({ field, value, onChange }) {
  const current = (value ?? '').length;
  return (
    <div>
      <textarea
        rows={field.rows ?? 4}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        maxLength={field.maxLength}
        disabled={field.disabled}
        className={`${INPUT_BASE} resize-none`}
      />
      {field.maxLength && (
        <div className="text-right text-xs text-gray-600 mt-0.5">
          {current} / {field.maxLength}
        </div>
      )}
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={field.disabled}
      className={`${INPUT_BASE} appearance-none`}
    >
      <option value="">— Chọn một giá trị —</option>
      {(field.options ?? []).map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function MultiSelectField({ field, value, onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (v) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {(field.options ?? []).map(opt => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={field.disabled}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              active
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TagsField({ field, value, onChange }) {
  const tags    = Array.isArray(value) ? value : [];
  const [input, setInput] = useState('');

  const addTag = (tag) => {
    const cleaned = tag.trim();
    if (cleaned && !tags.includes(cleaned)) onChange([...tags, cleaned]);
    setInput('');
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 p-2 bg-gray-800 border border-gray-700 rounded-xl min-h-[42px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-blue-600/20 text-blue-300 text-xs px-2.5 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-white transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? (field.placeholder ?? 'Nhập tag, nhấn Enter...') : ''}
          className="flex-1 bg-transparent text-sm text-gray-100 outline-none min-w-[120px] px-1"
        />
      </div>
      {field.suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {field.suggestions
            .filter(s => !tags.includes(s))
            .map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded border border-gray-800 hover:border-gray-700 transition-all"
              >
                <Plus size={9} className="inline mr-0.5" />{s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function ToggleField({ field, value, onChange }) {
  const checked = Boolean(value);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={field.disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Field dispatcher ───────────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange }) {
  switch (field.type) {
    case 'number':      return <NumberField      field={field} value={value} onChange={onChange} />;
    case 'textarea':    return <TextAreaField     field={field} value={value} onChange={onChange} />;
    case 'select':      return <SelectField       field={field} value={value} onChange={onChange} />;
    case 'multiselect': return <MultiSelectField  field={field} value={value} onChange={onChange} />;
    case 'tags':        return <TagsField         field={field} value={value} onChange={onChange} />;
    case 'toggle':      return <ToggleField       field={field} value={value} onChange={onChange} />;
    default:            return <TextField         field={field} value={value} onChange={onChange} />;
  }
}

// ── SchemaForm ─────────────────────────────────────────────────────────────────
/**
 * @param {{
 *   schema:   FieldConfig[],
 *   values:   Record<string, any>,
 *   onChange: (key: string, value: any) => void,
 *   onSubmit: (e: React.FormEvent) => void,
 *   submitLabel?: string,
 *   loading?:     boolean,
 *   className?:   string,
 * }} props
 */
export default function SchemaForm({
  schema,
  values,
  onChange,
  onSubmit,
  submitLabel = 'Lưu thay đổi',
  loading = false,
  className = '',
}) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`} noValidate>
      {schema.map(field => (
        <div key={field.key}>
          {/* Label — toggle fields get inline label layout */}
          {field.type === 'toggle' ? (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <FieldRenderer
                field={field}
                value={values?.[field.key]}
                onChange={v => onChange(field.key, v)}
              />
            </div>
          ) : (
            <>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <FieldRenderer
                field={field}
                value={values?.[field.key]}
                onChange={v => onChange(field.key, v)}
              />
            </>
          )}

          {/* Help text */}
          {field.helpText && (
            <p className="text-xs text-gray-600 mt-1 ml-1">{field.helpText}</p>
          )}
        </div>
      ))}

      {onSubmit && (
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang lưu...' : submitLabel}
        </button>
      )}
    </form>
  );
}
