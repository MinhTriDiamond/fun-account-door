# FUN Account Door (Pilot)

Cửa đăng nhập song song tại `account.fun.rich`, dùng thử cho kiến trúc tương lai:
cửa riêng, app riêng, Core giữ sổ chung. Pilot này KHÔNG thay trang đăng nhập gốc
ở `fun.rich` và KHÔNG đụng FUN Core API.

## Cửa làm gì

- Trang `/login`: đăng nhập bằng tài khoản FUN Profile (mật khẩu, mã OTP email,
  Google) qua Supabase Auth của project FUN Profile.
- Route `/sso-authorize`: nhận yêu cầu authorize của client (client_id,
  redirect_uri, response_type=code, scope, state, code_challenge S256), kiểm tra
  session, gọi hàm `sso-authorize` của FUN Profile với access token rồi trả mã
  về đúng redirect_uri của client kèm state. Chưa đăng nhập thì đưa về `/login`
  rồi quay lại đúng authorize URL.
- Pages Function `POST /sso-token`: proxy sang hàm `sso-token` của FUN Profile.
  Cần proxy vì SDK của client dùng 1 baseUrl cho cả authorize lẫn token, mà
  authorize của pilot đi qua cửa còn token nằm ở edge function của FUN Profile.
  Proxy KHÔNG ghi log body (body có thể chứa code và client_secret).
- Trang `/`: giới thiệu cửa + liên kết về FUN Profile và FUN Farm khi đã đăng nhập.

## Không xây issuer mới

Toàn bộ quyền quyết (client nào, redirect nào, scope nào, mã nào, secret nào)
vẫn nằm ở edge functions `sso-authorize` / `sso-token` của FUN Profile và bảng
`oauth_clients`. Cửa chỉ là giao diện đăng nhập + chuyển tiếp, không tự cấp mã.

## Biến môi trường (chỉ ghi TÊN, không ghi giá trị)

Đặt trên Cloudflare Pages (Settings -> Environment variables, môi trường
Production). VITE_ * được nhúng lúc build nên phải đặt TRƯỚC khi deploy.

- `VITE_SUPABASE_URL`: URL Supabase project của FUN Profile.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key của project đó.
- `FUN_PROFILE_FUNCTIONS_BASE_URL` (tùy chọn, cho Pages Function): base URL của
  edge functions FUN Profile. Mặc định trong code đã trỏ đúng project hiện tại.

Chạy local: copy `.env.example` sang `.env` rồi nhập giá trị trực tiếp.
KHÔNG commit `.env`, KHÔNG gửi giá trị qua chat.

## Chạy local và build

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # ra dist/
```

## Deploy Cloudflare Pages

- Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
- Nối repo này, nhập biến môi trường ở trên, deploy, rồi nối custom domain
  `account.fun.rich` trong Pages dashboard (xem chi tiết trong PILOT-GUIDE.md).
- File `public/_redirects` giữ SPA routing (`/* -> /index.html 200`).

## Giới hạn pilot (đọc kỹ trước khi kết luận)

- Phiên pilot KHÔNG phải phiên native của app fun.rich: mỗi origin giữ kho
  riêng. Luồng 1 (cửa -> fun.rich) chứng minh đổi mã lấy phiên SSO thành công,
  không tự đăng nhập native vào app. Muốn vào app native vẫn cần đăng nhập
  riêng (trang callback có nút dẫn tới /auth).
- Client secret của các client trình duyệt (Farm, pilot client) nằm trong bundle
  theo thiết kế SDK 1.0.0. Pilot chỉ dùng scope tối thiểu và mã dùng 1 lần,
  hết hạn 5 phút, kèm PKCE S256. Sản xuất thật cần chuyển đổi mã về phía server.
- Xem ma trận kiểm thử, thứ tự merge và rollback trong PILOT-GUIDE.md.
