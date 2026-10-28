import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { requestAuthorizeCode } from '../lib/authorize';

type Phase = 'loading' | 'error';

export default function Authorize() {
  const location = useLocation();
  const navigate = useNavigate();
  const ran = useRef(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(location.search);
    const clientId = params.get('client_id');
    const redirectUri = params.get('redirect_uri');

    if (!clientId || !redirectUri) {
      setError('invalid_request');
      setDescription('Thieu client_id hoac redirect_uri. / Missing client_id or redirect_uri.');
      setPhase('error');
      return;
    }

    requestAuthorizeCode(params).then((result) => {
      if (result.ok) {
        window.location.href = result.redirectUri;
        return;
      }
      if (result.error === 'not_logged_in') {
        const back = `${location.pathname}${location.search}`;
        navigate(`/login?returnTo=${encodeURIComponent(back)}`, { replace: true });
        return;
      }
      setError(result.error);
      setDescription(result.description || '');
      setPhase('error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'error') {
    return (
      <div className="door-shell">
        <div className="door-card">
          <h1>Không cấp mã được / Authorization failed</h1>
          <div className="door-error">
            <strong>{error}</strong>
            {description && (
              <>
                <br />
                {description}
              </>
            )}
          </div>
          <p className="door-sub">
            Cửa không chuyển bạn về ứng dụng vì yêu cầu chưa hợp lệ (ví dụ:
            redirect chưa đăng ký, scope chưa được phép, hoặc mã đã hết hạn).
            / The door did not send you back because the request was invalid
            (for example: unregistered redirect, unpermitted scope, or expired code).
          </p>
          <a href="/">
            <button className="door-btn" type="button">
              Về trang chính / Back to home
            </button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="door-shell">
      <div className="door-card">
        <p className="door-spinner">
          Đang xác thực qua cửa... / Authorizing through the door...
        </p>
      </div>
    </div>
  );
}
