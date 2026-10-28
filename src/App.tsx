import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Authorize from './pages/Authorize';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sso-authorize" element={<Authorize />} />
        <Route
          path="*"
          element={
            <div className="door-shell">
              <div className="door-card">
                <h1>Không tìm thấy trang / Page not found</h1>
                <a href="/">
                  <button className="door-btn" type="button">
                    Về trang chính / Back to home
                  </button>
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
