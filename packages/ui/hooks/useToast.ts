// @ts-nocheck
// frontend/shared-ui/hooks/useToast.js
import { useState, useCallback } from 'react';

let _id = 0;

/**
 * Returns { toasts, toast } where toast.success/error/info/warning(msg, duration?)
 * add an auto-dismissing notification, and toasts is the state array to render.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration = 3500) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, d) => add('success', msg, d),
    error:   (msg, d) => add('error',   msg, d),
    info:    (msg, d) => add('info',    msg, d),
    warning: (msg, d) => add('warning', msg, d),
  };

  return { toasts, toast, remove };
}
