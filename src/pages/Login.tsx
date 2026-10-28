import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { safeReturnTo } from '../lib/authorize';

type Mode = 'password' | 'otp';

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = safeReturnTo(params.get('returnTo'));

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const loginPassword = async () => {
    setError('');
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
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
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
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

  return (
    <div className="door-shell">
      <div className="door-card">
        <h1>Đăng nhập / Sign in</h1>
        <p className="door-sub">
          Đăng nhập bằng tài khoản FUN Profile. / Sign in with your FUN Profile account.
        </p>

        {error && <div className="door-error">{error}</div>}

        <label className="door-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@vidu.com"
            autoComplete="email"
          />
        </label>

        <div className="door-row">
          <button
            className={`door-btn ${mode === 'password' ? '' : 'door-btn-secondary'}`}
            type="button"
            onClick={() => setMode('password')}
          >
            Mật khẩu / Password
          </button>
          <button
            className={`door-btn ${mode === 'otp' ? '' : 'door-btn-secondary'}`}
            type="button"
            onClick={() => setMode('otp')}
          >
            Mã OTP / OTP code
          </button>
        </div>

        {mode === 'password' && (
          <>
            <label className="door-field">
              <span>Mật khẩu / Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button className="door-btn" type="button" disabled={busy || !email || !password} onClick={loginPassword}>
              Đăng nhập / Sign in
            </button>
          </>
        )}

        {mode === 'otp' && !otpSent && (
          <button className="door-btn" type="button" disabled={busy || !email} onClick={sendOtp}>
            Gửi mã OTP / Send OTP code
          </button>
        )}

        {mode === 'otp' && otpSent && (
          <>
            <label className="door-field">
              <span>Mã OTP trong email / OTP code from your email</span>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
              />
            </label>
            <button className="door-btn" type="button" disabled={busy || !otpCode} onClick={verifyOtp}>
              Xác nhận / Verify
            </button>
            <button className="door-btn door-btn-secondary" type="button" disabled={busy} onClick={sendOtp}>
              Gửi lại mã / Resend code
            </button>
          </>
        )}

        <button className="door-btn door-btn-secondary" type="button" disabled={busy} onClick={loginGoogle}>
          Tiếp tục bằng Google / Continue with Google
        </button>

        <p className="door-note">
          Sau khi đăng nhập, bạn sẽ được đưa về đúng nơi đã gọi cửa.
          / After signing in, you will return to where you came from.
        </p>
      </div>
    </div>
  );
}
