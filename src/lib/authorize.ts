import { supabase, FUNCTIONS_BASE } from './supabase';

export type AuthorizeResult =
  | { ok: true; redirectUri: string }
  | { ok: false; error: string; description?: string };

/**
 * Goi ham sso-authorize cua FUN Profile voi session hien tai cua cua.
 * Ham tra JSON { code, state, redirect_uri } khi gui Accept: application/json.
 * Chi goi khi da co session; neu chua dang nhap thi tra not_logged_in
 * de trang Authorize dua ve /login roi quay lai.
 */
export async function requestAuthorizeCode(params: URLSearchParams): Promise<AuthorizeResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, error: 'not_logged_in' };
  }

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_BASE}/sso-authorize?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json',
      },
    });
  } catch {
    return { ok: false, error: 'network_error', description: 'Khong goi duoc ham sso-authorize.' };
  }

  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    // Khong parse duoc JSON: coi nhu loi server.
  }

  if (!res.ok) {
    return {
      ok: false,
      error: (body.error as string) || 'server_error',
      description: body.error_description as string | undefined,
    };
  }

  if (typeof body.redirect_uri !== 'string' || !body.redirect_uri) {
    return { ok: false, error: 'server_error', description: 'Thieu redirect_uri trong ket qua authorize.' };
  }

  return { ok: true, redirectUri: body.redirect_uri };
}

/** Chi chap nhan duong dan noi bo cua cua (chong open redirect). */
export function safeReturnTo(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return '/';
}
