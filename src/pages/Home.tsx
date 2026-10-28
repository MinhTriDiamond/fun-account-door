import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="door-shell">
      <div className="door-card">
        <h1>FUN Account Door</h1>
        <p className="door-sub">
          Cổng đăng nhập thử nghiệm của nhà FUN (pilot).
          <br />
          FUN pilot sign-in door - account.fun.rich.
        </p>

        {!checked && <p className="door-spinner">Đang kiểm tra phiên... / Checking session...</p>}

        {checked && !session && (
          <>
            <p className="door-sub">
              Bạn chưa đăng nhập. / You are not signed in.
            </p>
            <a href="/login">
              <button className="door-btn" type="button">
                Đăng nhập / Sign in
              </button>
            </a>
          </>
        )}

        {checked && session && (
          <>
            <p className="door-sub">
              Đã đăng nhập: {session.user.email}
              <br />
              Signed in as {session.user.email}
            </p>
            <div className="door-row">
              <a href="https://fun.rich">
                <button className="door-btn" type="button">
                  Về FUN Profile
                </button>
              </a>
              <a href="https://farm.fun.rich">
                <button className="door-btn door-btn-secondary" type="button">
                  Vào FUN Farm
                </button>
              </a>
            </div>
            <button className="door-btn door-btn-secondary" type="button" onClick={signOut}>
              Đăng xuất / Sign out
            </button>
          </>
        )}

        <p className="door-note">
          Pilot song song: cửa này dùng chung tài khoản FUN Profile, không thay
          trang đăng nhập gốc ở fun.rich. / Parallel pilot: this door shares FUN
          Profile accounts and does not replace the original fun.rich sign-in.
        </p>
      </div>
    </div>
  );
}
