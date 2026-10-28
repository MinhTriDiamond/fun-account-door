# Ap dung patch pilot cho Farm (do Muse khong co quyen push len funfarm)

Muse chi co quyen DOC repo `DieuNgocCamlycoin/funfarm` (403 khi push).
Tri hoac Dieu Ngoc ap dung patch nay bang tay:

```sh
git clone https://github.com/DieuNgocCamlycoin/funfarm.git
cd funfarm
git checkout -b pilot/door-auth-button
cp /duong/dan/toi/farm-patch/client.ts src/lib/sso/client.ts
cp /duong/dan/toi/farm-patch/Auth.tsx src/pages/Auth.tsx
cp /duong/dan/toi/farm-patch/ProtectedRoute.tsx src/components/auth/ProtectedRoute.tsx
git add src/lib/sso/client.ts src/pages/Auth.tsx src/components/auth/ProtectedRoute.tsx
git commit -m "pilot(door): auto-redirect login entries to account.fun.rich (native form kept, not removed)"
git push -u origin pilot/door-auth-button
```

Roi mo DRAFT PR tu branch `pilot/door-auth-button` ve `main` tren GitHub,
tieu de: `pilot(door): dang nhap qua cua account.fun.rich`.

## Dinh chinh quan trong (2026-10-28): KHONG nut bam

Ban patch dau tien co nut "Tiep tuc bang FUN-ID" da BO. Thay vao do, duong vao
dang nhap TU DONG chuyen thang sang cua, khong qua man hinh chon nao khac:

- `src/pages/Auth.tsx`: khi chua dang nhap thi tu dong goi `startSSOLogin()`
  (startAuth/PKCE co san trong `src/lib/sso`) roi chuyen trinh duyet toi cua.
  Chi hien dong "Dang chuyen toi cua FUN..." (kem nut Thu lai neu cua loi).
  Form native OTP (ConnectWallet + Features) VAN GIU NGUYEN trong code, chi la
  trong pilot no khong con la duong vao dang nhap. User da co session native
  thi giu logic cu (ve /feed hoac /profile-setup, hoac o lai hoan tat OTP).
- `src/components/auth/ProtectedRoute.tsx`: khi chua co session thi tu dong
  goi `startSSOLogin()` roi chuyen thang sang cua, khong qua /auth trung gian.
  Khi loi thi hien nut Thu lai. Khi da co session thi giu nguyen (render children).
- Callback `/auth/callback` va dong bo profile GIU NGUYEN, khong sua.
- Luu y: callback hien tai ve thang /feed sau khi thanh cong, khong giu
  returnTo goc (hanh vi co san, khong doi trong patch pilot nay).

## Thay doi file client (khong doi luong native)

- `src/lib/sso/client.ts`: them `baseUrl` tu env `VITE_FUN_PROFILE_SSO_BASE_URL`
  (pilot dat `https://account.fun.rich`) va `clientSecret` tu env
  `VITE_FUN_FARM_CLIENT_SECRET` (bat buoc theo sso-token C3, neu khong doi ma
  tra 401). Khong doi clientId, redirectUri, scope, storage.

## Env can nhap truoc khi build (Cloudflare Pages project cua Farm: Settings -> Environment variables, Production)

- `VITE_FUN_PROFILE_SSO_BASE_URL` = `https://account.fun.rich`
- `VITE_FUN_FARM_CLIENT_SECRET` = gia tri tho cua fun_farm_client (xem
  PILOT-GUIDE.md muc 1d ve cach xoay secret neu khong con giu gia tri tho).
