// Bắt tổ hợp phím cứng (keyboard shortcuts) cho admin dashboard.
//
// Dùng trong bất kỳ component nào để đăng ký shortcut handler.
// Tất cả shortcuts đều dùng Ctrl+Shift+<Key> để tránh xung đột với
// các shortcut của trình duyệt và hệ điều hành.
//
// Danh sách shortcut mặc định:
//   Ctrl+Shift+B = Build trigger
//   Ctrl+Shift+D = Deploy
//   Ctrl+Shift+H = Health check
//   Ctrl+Shift+R = Reload data (invalidate all queries)
//   Ctrl+Shift+K = Keyboard shortcut help modal
import { useEffect, useCallback } from 'react';

export type ShortcutHandlers = {
  build?:   () => void;
  deploy?:  () => void;
  health?:  () => void;
  reload?:  () => void;
  help?:    () => void;
  [key: string]: (() => void) | undefined;
};

const KEY_MAP: Record<string, keyof ShortcutHandlers> = {
  B: 'build',
  D: 'deploy',
  H: 'health',
  R: 'reload',
  K: 'help',
};

/**
 * Đăng ký keyboard shortcuts (Ctrl+Shift+<Key>).
 *
 * @example
 * useHardwareShortcuts({
 *   build:  () => triggerBuild(),
 *   reload: () => qc.invalidateQueries(),
 * });
 */
export function useHardwareShortcuts(handlers: ShortcutHandlers): void {
  // Wrap handlers in stable ref để tránh re-subscribe khi component re-render
  const handlersRef = { current: handlers };
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.ctrlKey || !e.shiftKey) return;

    // Bỏ qua khi đang focus trong input / textarea / contentEditable
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
      return;
    }

    const action = KEY_MAP[e.key.toUpperCase()];
    if (!action) return;

    const fn = handlersRef.current[action];
    if (typeof fn === 'function') {
      e.preventDefault();
      fn();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useHardwareShortcuts;
