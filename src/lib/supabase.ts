import { createClient } from '@supabase/supabase-js';

// Chi ghi TEN bien moi truong. Gia tri do Tri nhap truc tiep tren Cloudflare Pages
// (hoac .env khi chay local), KHONG commit vao repo, KHONG gui qua chat.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Edge functions cua FUN Profile (project tljfqavndndfsvtazibe).
// Day la dia chi ha tang cong khai, khong phai secret.
export const FUNCTIONS_BASE = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;
