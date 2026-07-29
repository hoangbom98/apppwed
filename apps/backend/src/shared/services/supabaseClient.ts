/**
 * supabaseClient.ts — Supabase Auth + Storage client
 *
 * Dùng cho:
 *   - Supabase Auth: xác thực JWT người dùng, quản lý session
 *   - Supabase Storage: lưu trữ file uploads (avatar, ảnh, video)
 *
 * Không dùng để lưu business data — toàn bộ 6 MySQL databases giữ nguyên.
 *
 * Env vars cần thiết (thêm vào .env):
 *   SUPABASE_URL               — Project URL từ Supabase dashboard
 *   SUPABASE_ANON_KEY          — anon/public key (safe to expose to client)
 *   SUPABASE_SERVICE_ROLE_KEY  — service_role key (server-only, bypass RLS)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL              = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY         = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Warn at startup — không throw để không crash khi Supabase chưa cấu hình
  // (auth middleware sẽ trả 503 nếu SUPABASE_URL rỗng)
  console.warn('[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY not set — Supabase Auth/Storage will be unavailable');
}

/**
 * supabaseAnon — client dành cho user-context (sử dụng anon key).
 * Dùng để verify JWT user token trong authenticateSupabase middleware.
 */
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken:    false,
    persistSession:      false,
    detectSessionInUrl:  false,
  },
});

/**
 * supabaseAdmin — client dùng service_role key (bypass RLS).
 * Dùng cho:
 *   - Upload file lên Supabase Storage
 *   - Tạo/xoá user trong Supabase Auth từ server
 *   - Đọc user bất kỳ mà không cần JWT
 *
 * KHÔNG expose client này ra frontend.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, // fallback anon nếu chưa set service role
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);

/** Storage bucket mặc định cho file uploads. Tạo bucket này trong Supabase dashboard. */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'lkvip-uploads';
