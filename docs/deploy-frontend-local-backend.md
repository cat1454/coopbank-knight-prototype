# Deploy frontend, dung backend tren laptop

Muc tieu cua cau hinh nay:

- Frontend chay public tai `https://knight.danangtoiiu.live/`.
- Backend van chay tren laptop bang `npm run server`.
- Cloudflare Tunnel dua backend local ra HTTPS tai `https://knight-api.danangtoiiu.live`.
- iPhone 16 Pro nhan Web Push khi PWA da duoc Add to Home Screen.

## Gioi han that cua iPhone/PWA

PWA co the nhan Web Push va hien notification tren Lock Screen, Notification Center va Apple Watch sau khi nguoi dung cap quyen.

PWA khong the ep iPhone hien popup toan man hinh tren Lock Screen, tu mo app khi nguoi dung chua bam, reo chuong vo han, hay vuot Silent/Focus. Muon vuot Silent/Focus kieu Critical Alert thi phai la native iOS app co entitlement duoc Apple cap.

## 1. Tao VAPID keys mot lan

Chay trong thu muc `h:/Knight/coopbank-knight-prototype`:

```powershell
npx web-push generate-vapid-keys
```

Giu co dinh cap key nay. Neu doi key, iPhone co the phai bat Push lai.

## 2. Chay backend tren laptop

PowerShell:

```powershell
$env:PORT="5000"
$env:ALLOWED_ORIGINS="https://knight.danangtoiiu.live,http://localhost:5173,http://127.0.0.1:5173"
$env:VAPID_PUBLIC_KEY="PASTE_PUBLIC_KEY"
$env:VAPID_PRIVATE_KEY="PASTE_PRIVATE_KEY"
$env:VAPID_SUBJECT="mailto:you@example.com"
$env:SEND_PUSH_SECRET="PASTE_LONG_RANDOM_SECRET"
npm run server
```

Phim trong terminal backend:

- `Space`, `Enter`, hoac `S`: kich hoat canh bao + gui Web Push.
- `R`: reset demo.
- `Q`: tat backend.

## 3. Dua backend laptop ra HTTPS bang Cloudflare Tunnel

Tao tunnel va gan DNS:

```powershell
cloudflared tunnel create knight-backend
cloudflared tunnel route dns knight-backend knight-api.danangtoiiu.live
```

Tao file `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: knight-backend
credentials-file: C:\Users\PHU\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: knight-api.danangtoiiu.live
    service: http://localhost:5000
  - service: http_status:404
```

Chay tunnel:

```powershell
cloudflared tunnel run knight-backend
```

Kiem tra:

```powershell
curl https://knight-api.danangtoiiu.live/health
```

## 4. Deploy frontend len Cloudflare Pages

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Environment variable trong Cloudflare Pages:

```text
VITE_BACKEND_URL=https://knight-api.danangtoiiu.live
```

Sau khi deploy, frontend tai `https://knight.danangtoiiu.live/` se goi backend laptop qua `https://knight-api.danangtoiiu.live`.

## 5. Bat Push tren iPhone 16 Pro

1. Mo `https://knight.danangtoiiu.live/` tren iPhone.
2. Bam Share.
3. Bam Add to Home Screen.
4. Dong Safari.
5. Mo KNIGHT tu icon ngoai Home Screen.
6. Dang nhap vao demo.
7. Vao tab Ho ve AI.
8. Bat `Canh bao Push thong minh`.
9. Chon Allow.
10. Khoa man hinh iPhone.
11. Tren laptop, bam `Space` trong terminal backend.

Neu da cap quyen dung, iPhone se hien notification. Khi bam notification, PWA mo `/?alert=1` va vao man hinh canh bao trong app.

## 6. Goi API gui thu tu ben ngoai

Chi dung khi da set `SEND_PUSH_SECRET`:

```powershell
curl -X POST "https://knight-api.danangtoiiu.live/api/push/send" `
  -H "Authorization: Bearer PASTE_LONG_RANDOM_SECRET" `
  -H "Content-Type: application/json" `
  -d "{\"title\":\"CANH BAO KHAN\",\"message\":\"Phat hien giao dich bat thuong.\",\"url\":\"/?alert=1\"}"
```

Khong commit `.env`, VAPID private key, hoac `SEND_PUSH_SECRET` len GitHub.
