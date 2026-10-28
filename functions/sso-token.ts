// Cloudflare Pages Function: POST /sso-token
// Proxy sang ham sso-token cua FUN Profile de SDK cua client (dung 1 baseUrl
// cho ca authorize lan token) van chay duoc khi authorize di qua cua account.fun.rich.
// Proxy KHONG ghi log body (body co the chua code va client_secret).
// Dia chi mac dinh la ha tang cong khai cua FUN Profile (khong phai secret);
// co the ghi de bang bien moi truong Pages FUN_PROFILE_FUNCTIONS_BASE_URL.

const FP_FUNCTIONS_BASE = 'https://tljfqavndndfsvtazibe.supabase.co/functions/v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

interface PagesContext {
  request: Request;
  env: Record<string, string | undefined>;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const base = env.FUN_PROFILE_FUNCTIONS_BASE_URL || FP_FUNCTIONS_BASE;
  const body = await request.text();
  const res = await fetch(`${base}/sso-token`, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
    },
    body,
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS_HEADERS });
}
