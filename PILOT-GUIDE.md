# Hướng dẫn pilot cửa account.fun.rich (cho Trí)

Pilot song song, KHÔNG đụng hệ thống đang sống:
- `account.fun.rich` = cửa (đóng vai fun.rich trong plan).
- `fun.rich` = app Profile (đóng vai profile.fun.rich, đăng nhập cũ giữ nguyên).
- `farm.fun.rich` = platform thử.
- FUN Core API không nằm trong pilot này.

## 0. Vai trò và các PR nháp

- Repo cửa: `MinhTriDiamond/fun-account-door` (repo mới, app trong thư mục này).
- PR nháp Farm (`DieuNgocCamlycoin/funfarm`, branch `pilot/door-auth-button`):
  ĐÍNH CHÍNH 2026-10-28: KHÔNG nút bấm. Route /auth và ProtectedRoute khi chưa
  đăng nhập sẽ TỰ ĐỘNG chuyển thẳng sang cửa bằng startAuth/PKCE có sẵn, không
  qua màn hình chọn nào khác; form native OTP giữ nguyên trong code (không xóa)
  nhưng không còn là đường vào trong pilot; callback /auth/callback và đồng bộ
  giữ nguyên. (Do Muse không có quyền push lên funfarm nên patch Farm nằm trong
  thư mục `farm-patch/` của repo cửa, Trí/Diệu Ngọc áp dụng bằng tay theo
  `farm-patch/README-apply.md`.)
- PR nháp FUN Profile: https://github.com/MinhTriDiamond/funprofile-supabase/pull/30
  (branch `pilot/door-callback`, DRAFT, chưa merge): cộng thêm 2 route
  `/pilot-login` (điểm bắt đầu luồng 1, tự sinh PKCE) và `/sso-callback` (đổi mã
  lấy phiên SSO, lưu phiên pilot riêng, KHÔNG chạm session native, KHÔNG sửa
  trang Auth cũ).

## 1. Chuẩn bị secret và SQL (làm TRƯỚC khi test)

### 1a. Vì sao pilot client KHÔNG để secret trống

Hàm `sso-token` của FUN Profile bắt buộc `client_secret` (hardening C3), và
`clientAuth` chỉ chấp nhận bcrypt hash (`$2...`, 60 ký tự). Secret trống hoặc
plaintext đều xác thực thất bại. Vì vậy client pilot PHẢI có secret dạng bcrypt
hash trong DB, và giá trị thô tương ứng phải nằm trong env của app gọi đổi mã.
Secret thô KHÔNG bao giờ gửi qua chat hay commit vào repo.

### 1b. Tạo secret + hash bcrypt (chạy local, không chia sẻ secret thô)

```sh
node -e "const b=require('bcryptjs');let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>b.hash(s.trim(),10).then(console.log));"
```

Gõ secret rồi Ctrl-D. Lấy hash in ra để dùng ở SQL dưới. (Cần gói `bcryptjs`
cài local: `npm install -g bcryptjs` hoặc `npm i bcryptjs` trong thư mục tạm.)

### 1c. SQL tạo client pilot cho fun.rich (Trí tự chạy trên Supabase console)

```sql
insert into public.oauth_clients
  (client_id, client_secret, client_name, redirect_uris, allowed_scopes, is_active, platform_name)
values (
  'fun_profile_pilot_client',
  '<BCRYPT_HASH_DO_TRÍ_TẠO_TỪ_SECRET>',
  'FUN Profile (Pilot)',
  array['https://fun.rich/sso-callback'],
  array['profile', 'email'],
  true,
  'FUN Profile (Pilot)'
);
```

Giá trị thô của secret này sau đó nhập vào Environment variables (Production)
của Cloudflare Pages project của app fun.rich (fun.rich cũng chạy ở Pages)
với tên biến `VITE_FUN_PROFILE_PILOT_CLIENT_SECRET`, rồi redeploy app.

### 1d. Secret của fun_farm_client (cho luồng Farm)

Giá trị thô của secret này KHÔNG lấy lại được từ DB (DB chỉ lưu bcrypt hash).
Nếu Trí/Diệu Ngọc còn giữ giá trị thô thì dùng lại. Nếu không còn, XOAY secret:
tạo secret mới + hash mới như 1b rồi chạy:

```sql
update public.oauth_clients
set client_secret = '<BCRYPT_HASH_MỚI>', updated_at = now()
where client_id = 'fun_farm_client';
```

Giá trị thô mới nhập vào Environment variables (Production) của Cloudflare
Pages project của Farm với tên biến `VITE_FUN_FARM_CLIENT_SECRET` (Farm chạy
production ở Pages, không phải Lovable), rồi redeploy Farm.

## 2. Deploy cửa lên Cloudflare Pages

1. Cloudflare dashboard -> Workers & Pages -> Create application -> Pages ->
   Import an existing Git repository -> chọn repo `MinhTriDiamond/fun-account-door`.
2. Build settings: Framework preset Vite, Build command `npm run build`,
   Output directory `dist`.
3. Environment variables (Production) — nhập TRƯỚC khi deploy lần đầu vì VITE_
   được nhúng lúc build:
   - `VITE_SUPABASE_URL`: URL Supabase project của FUN Profile.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: publishable key của project đó.
   - `FUN_PROFILE_FUNCTIONS_BASE_URL`: tùy chọn, mặc định trong code đã đúng.
4. Deploy. Sau đó Pages -> Custom domains -> Add `account.fun.rich` rồi làm
   theo hướng dẫn DNS của Pages (zone fun.rich cùng tài khoản nên Pages có thể
   tự tạo bản ghi; kiểm tra bản ghi trỏ đúng Pages rồi mới test).
5. Kiểm tra nhanh: mở `https://account.fun.rich/` thấy trang cửa, mở
   `https://account.fun.rich/login` thấy form đăng nhập.

## 3. Cho phép redirect về cửa (Supabase Auth)

Supabase Dashboard của FUN Profile -> Authentication -> URL Configuration ->
Redirect URLs: thêm `https://account.fun.rich/**`. (Cần cho luồng Google OAuth
quay về cửa; OTP dạng mã 6 số không cần bước này nhưng cứ thêm cho đủ.)

## 4. Thứ tự merge và deploy

1. Chạy SQL 1c (và 1d nếu cần xoay secret Farm).
2. Deploy cửa xong (mục 2) + redirect allowlist xong (mục 3).
3. Nhập env Farm TRƯỚC khi merge để build sau merge nhận đủ biến, nhập trong
   Cloudflare Pages project của Farm (Settings -> Environment variables,
   Production; Farm chạy production ở Pages nên Lovable Secrets không có tác
   dụng với farm.fun.rich):
   - `VITE_FUN_PROFILE_SSO_BASE_URL` = `https://account.fun.rich`
   - `VITE_FUN_FARM_CLIENT_SECRET` = giá trị thô của fun_farm_client
   Rồi tạo PR Farm từ patch trong `farm-patch/` (Muse không push được lên
   funfarm, xem `farm-patch/README-apply.md`), merge PR -> Pages tự deploy lại
   farm.fun.rich.
4. Nhập env FUN Profile TRƯỚC khi merge, nhập trong Cloudflare Pages project
   của app fun.rich (Settings -> Environment variables, Production; fun.rich
   cũng chạy ở Pages):
   - `VITE_FUN_PROFILE_PILOT_CLIENT_SECRET` = giá trị thô của pilot client
   Rồi merge PR nháp FUN Profile (#30) -> Pages tự deploy lại fun.rich.
5. Test theo ma trận mục 5.

Lưu ý: redirect của Farm (`https://farm.fun.rich/auth/callback`) đã đăng ký sẵn
ở FP nên không cần sửa DB cho Farm. Nếu test Farm bằng domain preview của
Lovable thì redirect phải nằm trong danh sách đã đăng ký (domain
`onhznjyccagjoefavbaq.lovableproject.com` đã có sẵn); domain preview khác cần
Trí thêm redirect_uri vào row `fun_farm_client` trước khi test.

## 5. Ma trận kiểm thử

### Luồng 1: cửa -> FUN Profile

1. Mở `https://fun.rich/pilot-login` (chưa đăng nhập cửa) -> cửa hiện form
   login -> đăng nhập -> tự về `https://fun.rich/sso-callback`.
2. Kết quả đúng: trang callback báo thành công, hiện username + fun_id + scope
   `profile email`. Đây là phiên PILOT (lưu key riêng), KHÔNG phải phiên native
   của app; nút "Đăng nhập FUN Profile" dẫn về /auth nếu muốn vào app native.
3. Kiểm DB phía FP (chỉ đọc): row mới trong `oauth_codes` (is_used = true sau
   khi đổi) và `cross_platform_tokens` cho user + client pilot.

### Luồng 2: Farm -> cửa -> Farm

1. Mở `https://farm.fun.rich/auth` (chưa đăng nhập) -> TỰ ĐỘNG sang cửa đăng
   nhập (không nút bấm, không màn hình chọn; nếu đã có session cửa thì qua
   thẳng) -> về `https://farm.fun.rich/auth/callback` -> báo thành công -> về
   /feed. Vào trang cần đăng nhập (ví dụ /profile) khi chưa đăng nhập cũng tự
   chuyển thẳng sang cửa (ProtectedRoute).
2. Kiểm DB phía Farm: profile có `fun_id` khớp FUN Profile, `synced_from_profile`
   = true. (Phần này cần Diệu Ngọc hỗ trợ vì credential hiện tại không đọc
   được Supabase project của Farm.)

### Lỗi 1: mã hết hạn

Bắt đầu authorize ở cửa, chờ quá 5 phút rồi mới hoàn tất đổi mã -> token trả
`invalid_grant` (mã đã hết hạn). Callback phải hiện lỗi rõ, không crash.

### Lỗi 2: redirect sai

Sửa tay `redirect_uri` trong URL authorize ở cửa thành origin chưa đăng ký ->
hàm authorize trả `invalid_request` (redirect_uri not registered), cửa hiện
trang lỗi, KHÔNG chuyển về ứng dụng lạ.

### Lỗi 3: mã dùng lại

Sau khi callback thành công, bấm Back rồi hoàn tất lại (hoặc mở lại URL callback
cũ) -> token trả `invalid_grant` (mã đã dùng). Callback phải hiện lỗi rõ.

## 6. Giới hạn đã biết (đừng kết luận sai từ pilot)

- Phiên pilot ở fun.rich KHÔNG tự đăng nhập native vào app (mỗi origin giữ kho
  riêng, không có endpoint cấp session native). Đây là giới hạn có chủ đích.
- Secret của client trình duyệt nằm trong bundle theo thiết kế SDK 1.0.0.
  Pilot dùng scope tối thiểu, mã 1 lần, hết hạn 5 phút, PKCE S256. Sản xuất thật
  cần chuyển đổi mã về phía server.
- Callback SSO của Farm với user đã tồn tại chưa tự tạo session Supabase cho
  Farm (code hiện có chỉ đồng bộ profile rồi về /feed). Quan sát khi test luồng 2,
  không sửa trong PR pilot này.
- SDK 1.0.0 mặc định trỏ project Supabase cũ (`bhtsnervqiwchluwuxki`), nên
  Farm BẮT BUỘC phải đặt `VITE_FUN_PROFILE_SSO_BASE_URL` thì mới tới cửa pilot.
  Không nâng SDK lên 1.1.1 trong pilot này vì 1.1.1 không có trên npm (không
  tìm thấy bản đó) và 1.0.0 đã đủ tùy chỉnh baseUrl.

## 7. Rollback (nếu pilot lỗi)

1. Revert 2 PR (Farm, FUN Profile) và redeploy lại 2 app.
2. Gỡ custom domain `account.fun.rich` khỏi Pages (giữ nguyên DNS fun.rich cũ).
3. Vô hiệu hóa client pilot (không xóa row để còn đối chiếu):
   `update public.oauth_clients set is_active = false where client_id = 'fun_profile_pilot_client';`
4. App fun.rich và farm.fun.rich trở về đúng trạng thái trước pilot vì PR chỉ
   cộng thêm, không sửa luồng cũ.
