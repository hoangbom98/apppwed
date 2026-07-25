// @ts-nocheck
/**
 * Tabs.jsx — Shared reusable Tabs component
 * Usage:
 *   <Tabs tabs={[{key:'a', label:'A'}, {key:'b', label:'B'}]} active={tab} onChange={setTab} />
 *
 * Supports: color variant (default uses CSS var --color-accent), size sm/md, fullWidth
 */
import React from 'react';

/**
 * @param {{ tabs: Array<{key: string, label: string, icon?: React.ReactNode, badge?: number}>,
 *            active: string,
 *            onChange: (key: string) => void,
 *            variant?: 'underline' | 'pill' | 'boxed',
 *            size?: 'sm' | 'md',
 *            fullWidth?: boolean,
 *            className?: string }} props
 */
export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
}) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (variant === 'pill') {
    return (
      <div className={`flex gap-2 flex-wrap ${fullWidth ? 'w-full' : ''} ${className}`}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all ${textSize} ${
              active === t.key
                ? 'bg-accent text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            } ${fullWidth ? 'flex-1 justify-center' : ''}`}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                active === t.key ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
              }`}>
                {t.badge > 99 ? '99+' : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'boxed') {
    return (
      <div className={`flex gap-1 bg-gray-900 p-1 rounded-xl ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${textSize} ${
              active === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-white'
            } ${fullWidth ? 'flex-1 justify-center' : ''}`}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  // default: underline
  return (
    <div className={`flex border-b border-gray-800 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-semibold transition-all relative ${textSize} ${
            active === t.key
              ? 'text-accent'
              : 'text-gray-500 hover:text-gray-300'
          } ${fullWidth ? 'flex-1 justify-center' : ''}`}
        >
          {t.icon && <span>{t.icon}</span>}
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {t.badge > 99 ? '99+' : t.badge}
            </span>
          )}
          {active === t.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
