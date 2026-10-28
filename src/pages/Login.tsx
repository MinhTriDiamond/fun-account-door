import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeReturnTo } from '../lib/authorize';
import { TurnstileWidget, TURNSTILE_ENABLED } from '../components/auth/TurnstileWidget';

type Mode = 'password' | 'otp';

// Trang đăng nhập của cửa, mặc giao diện của trang Auth của FUN Profile:
// khung hologram, tiêu đề hologram, tab dạng viên thuốc, input bo tròn,
// nút xanh lá gradient và nút Google viền cầu vồng. Chỉ đổi giao diện,
// mọi logic đăng nhập của cửa giữ nguyên: returnTo, phiên, mật khẩu, OTP, Google.
// Cửa chỉ đăng nhập, không tạo tài khoản mới (không có tab đăng ký).
export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = safeReturnTo(params.get('returnTo'));

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // Neu da co session (vi du quay lai tu Google OAuth) thi ve thang returnTo.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate(returnTo, { replace: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => navigate(returnTo, { replace: true });

  // Token Turnstile chỉ dùng được một lần: sau mỗi lần gửi thất bại thì reset
  // widget để lần thử lại lấy token mới (giống cách form của FUN Profile làm).
  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  };

  const loginPassword = async () => {
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      resetCaptcha();
      return;
    }
    goNext();
  };

  const sendOtp = async () => {
    setError('');
    setBusy(true);
    // Pilot chi dang nhap, khong tao tai khoan moi tai cua.
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, captchaToken: captchaToken ?? undefined },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      resetCaptcha();
      return;
    }
    setOtpSent(true);
  };

  const verifyOtp = async () => {
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    goNext();
  };

  const loginGoogle = async () => {
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login?returnTo=${encodeURIComponent(returnTo)}`,
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
    }
  };

  const passwordDisabled =
    busy || !email || !password || (TURNSTILE_ENABLED && !captchaToken);
  const otpSendDisabled =
    busy || !email || (TURNSTILE_ENABLED && !captchaToken);

  return (
    <div className="fp-auth-shell">
      <div className="fp-holo-frame">
        <div className="fp-card">
          <h1 className="fp-title">Đăng nhập / Sign in</h1>
          <p className="fp-sub">
            Đăng nhập bằng tài khoản FUN Profile. / Sign in with your FUN Profile account.
          </p>

          {error && <div className="fp-error">{error}</div>}

          <label className="fp-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@vidu.com"
              autoComplete="email"
            />
          </label>

          <div className="fp-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'password'}
              className={mode === 'password' ? 'fp-tab fp-tab-active' : 'fp-tab'}
              onClick={() => setMode('password')}
            >
              Mật khẩu / Password
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'otp'}
              className={mode === 'otp' ? 'fp-tab fp-tab-active' : 'fp-tab'}
              onClick={() => setMode('otp')}
            >
              Mã OTP / OTP code
            </button>
          </div>

          {mode === 'password' && (
            <>
              <label className="fp-field">
                <span>Mật khẩu / Password</span>
                <span className="fp-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="fp-eye"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <line x1="2" y1="2" x2="22" y2="22" />}
                    </svg>
                  </button>
                </span>
              </label>
              <TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} />
              <button
                className="fp-btn"
                type="button"
                disabled={passwordDisabled}
                onClick={loginPassword}
              >
                {busy ? 'Đang đăng nhập...' : 'Đăng nhập / Sign in'}
              </button>
            </>
          )}

          {mode === 'otp' && !otpSent && (
            <>
              <TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} />
              <button
                className="fp-btn"
                type="button"
                disabled={otpSendDisabled}
                onClick={sendOtp}
              >
                {busy ? 'Đang gửi...' : 'Gửi mã OTP / Send OTP code'}
              </button>
            </>
          )}

          {mode === 'otp' && otpSent && (
            <>
              <label className="fp-field">
                <span>Mã OTP trong email / OTP code from your email</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                />
              </label>
              <button
                className="fp-btn"
                type="button"
                disabled={busy || !otpCode}
                onClick={verifyOtp}
              >
                Xác nhận / Verify
              </button>
              <button
                className="fp-ghost"
                type="button"
                disabled={busy}
                onClick={sendOtp}
              >
                Gửi lại mã / Resend code
              </button>
            </>
          )}

          <div className="fp-google-wrap">
            <button
              className="fp-google-btn"
              type="button"
              disabled={busy}
              onClick={loginGoogle}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Tiếp tục bằng Google / Continue with Google</span>
            </button>
          </div>

          <p className="fp-note">
            Sau khi đăng nhập, bạn sẽ được đưa về đúng nơi đã gọi cửa.
            / After signing in, you will return to where you came from.
          </p>
        </div>
      </div>
    </div>
  );
}
