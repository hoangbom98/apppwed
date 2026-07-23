import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * H5BottomNav — Shared mobile bottom navigation for all H5 apps.
 *
 * items[] shape (choose one icon type):
 * {
 *   to:           string          Route path
 *   label:        string          Tab label
 *   // Option A — SVG component (Lucide etc.)
 *   icon?:        ComponentType
 *   // Option B — PNG/WebP image URLs
 *   activeSrc?:   string
 *   inactiveSrc?: string
 *   // Optional
 *   scale?:       number          transform scale when active (e.g. 1.2 for live button)
 *   onTabClick?:  () => void      If set, intercepts click (no navigation) — used for modals
 * }
 */
export default function H5BottomNav({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 6px)' }}
    >
      <div className="flex justify-around py-1.5">
        {items.map(({ to, label, icon: Icon, activeSrc, inactiveSrc, scale, onTabClick }) => {
          // If onTabClick is provided, render a button instead of NavLink
          if (onTabClick) {
            return (
              <button
                key={to}
                onClick={onTabClick}
                className="flex flex-col items-center gap-0.5 min-w-[52px] px-1 pt-1 pb-0.5 outline-none bg-transparent border-0 cursor-pointer"
              >
                {(activeSrc || inactiveSrc) && (
                  <img
                    src={inactiveSrc ?? activeSrc}
                    alt={label}
                    className="object-contain"
                    style={{ width: 22, height: 22, transition: 'transform 0.15s' }}
                  />
                )}
                {Icon && !activeSrc && !inactiveSrc && (
                  <Icon size={22} className="text-gray-400 dark:text-gray-500" />
                )}
                <span className="text-[10px] font-medium leading-tight text-gray-400 dark:text-gray-500">
                  {label}
                </span>
              </button>
            );
          }

          return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center gap-0.5 min-w-[52px] px-1 pt-1 pb-0.5 outline-none"
          >
            {({ isActive }) => (
              <>
                {/* PNG / WebP icon */}
                {(activeSrc || inactiveSrc) && (
                  <img
                    src={isActive ? (activeSrc ?? inactiveSrc) : (inactiveSrc ?? activeSrc)}
                    alt={label}
                    className="object-contain"
                    style={{
                      width: 22,
                      height: 22,
                      transform: (isActive && scale) ? `scale(${scale})` : undefined,
                      transition: 'transform 0.15s',
                    }}
                  />
                )}

                {/* SVG component icon (Lucide etc.) */}
                {Icon && !activeSrc && !inactiveSrc && (
                  <Icon
                    size={22}
                    className={
                      isActive
                        ? 'text-primary dark:text-accent'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                    style={
                      (isActive && scale)
                        ? { transform: `scale(${scale})`, transition: 'transform 0.15s' }
                        : undefined
                    }
                  />
                )}

                <span
                  className={`text-[10px] font-medium leading-tight ${
                    isActive
                      ? 'text-primary dark:text-accent'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
