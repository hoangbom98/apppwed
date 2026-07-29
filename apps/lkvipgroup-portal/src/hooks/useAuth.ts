"use client";

// Better Auth đã bị loại bỏ — auth được xử lý qua cookie + server-side admin lookup
// Hook này giữ lại interface tương thích để không break các component cũ

export function useAuth() {
  return {
    session: null,
    user: null,
    isPending: false,
    isAuthenticated: false,
    error: null,
  };
}
