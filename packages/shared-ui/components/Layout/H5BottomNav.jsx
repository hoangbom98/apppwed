import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * H5BottomNav — antd-mini inspired shared mobile bottom navigation.
 *
 * Design principles (from antd-mini guide):
 *  - CSS variable tokens: --color-primary, --color-text-muted, etc.
 *  - Active indicator bar at the top of the tab (antd-mini style)
 *  - Smooth icon scale transition on active
 *  - Safe-area-inset-bottom aware
 *
 * items[] shape:
 * {
 *   to:           string          Route path
 *   label:        string          Tab label
 *   icon?:        ComponentType   Lucide or any SVG component
 *   activeSrc?:   string          PNG/WebP when active
 *   inactiveSrc?: string          PNG/WebP when inactive
 *   scale?:       number          Icon scale when active (e.g. 1.15)
 *   badge?:       number          Badge count (live notifications)
 *   onTabClick?:  () => void      Intercept click without navigation (for modals)
 * }
 */
export default function H5BottomNav({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className="h5-tabbar"
      aria-label="Điều hướng chính"
    >
      {items.map(({ to, label, icon: Icon, activeSrc, inactiveSrc, scale, badge, onTabClick }) => {
        /* ── Button variant (modal trigger, no navigation) ── */
        if (onTabClick) {
          return (
            <button
              key={to}
              onClick={onTabClick}
              className="h5-tab-item"
              aria-label={label}
            >
              {(activeSrc || inactiveSrc) && (
                <img
                  src={inactiveSrc ?? activeSrc}
                  alt=""
                  className="h5-tab-icon"
                  onError={(e) => { e.currentTarget.style.opacity = '0.4'; }}
                />
              )}
              {Icon && !activeSrc && !inactiveSrc && (
                <Icon size={22} style={{ color: 'var(--color-text-muted)' }} />
              )}
              <span className="h5-tab-label">{label}</span>
            </button>
          );
        }

        /* ── NavLink variant (standard navigation) ── */
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `h5-tab-item${isActive ? ' h5-tab-item--active' : ''}`
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                {/* PNG / WebP icon */}
                {(activeSrc || inactiveSrc) && (
                  <div className="relative">
                    <img
                      src={isActive ? (activeSrc ?? inactiveSrc) : (inactiveSrc ?? activeSrc)}
                      alt=""
                      className="h5-tab-icon"
                      style={
                        isActive && scale
                          ? { transform: `scale(${scale})` }
                          : undefined
                      }
                      onError={(e) => { e.currentTarget.style.opacity = '0.4'; }}
                    />
                    {badge != null && badge > 0 && (
                      <span
                        className="h5-badge"
                        style={{ position: 'absolute', top: -2, right: -4 }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                )}

                {/* SVG component icon (Lucide etc.) */}
                {Icon && !activeSrc && !inactiveSrc && (
                  <div className="relative">
                    <Icon
                      size={22}
                      style={{
                        color: isActive
                          ? 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                        transform: isActive && scale ? `scale(${scale})` : undefined,
                        transition: 'transform 0.15s',
                      }}
                    />
                    {badge != null && badge > 0 && (
                      <span
                        className="h5-badge"
                        style={{ position: 'absolute', top: -2, right: -4 }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                )}

                <span
                  className="h5-tab-label"
                  style={{
                    color: isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
