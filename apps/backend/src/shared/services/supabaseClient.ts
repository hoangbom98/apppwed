import { resolveEnv, createAdminClient } from '@supabase/server/core';

// Tự động đọc và giải quyết cấu hình từ env (SUPABASE_URL, SUPABASE_SECRET_KEYS, etc.)
const { data: env, error } = resolveEnv();

if (error) {
  throw new Error(`Supabase configuration error: ${error.message}`);
}

// Client admin dùng cho các thao tác hệ thống (bỏ qua RLS)
export const supabaseAdmin = createAdminClient({
  env: {
    url: env.url,
    secretKeys: env.secretKeys,
  }
});
