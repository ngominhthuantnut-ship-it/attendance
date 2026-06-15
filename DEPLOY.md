# Deploy Cheat-Sheet — v1

Firebase Project: `attendance-fa916`.

## One-time setup (Firebase Console)

1. Go to https://console.firebase.google.com/project/attendance-fa916
2. **Authentication → Sign-in method**: enable **Google** provider
3. **Firestore Database**: create database, mode "production", region `asia-southeast1` (Singapore)
4. **Project settings → General → Your apps**: register a Web app, copy the `firebaseConfig` snippet
5. Update `.env.production` (NOT committed, fill in real values):
   ```
   VITE_FIREBASE_API_KEY=<from firebaseConfig.apiKey>
   VITE_FIREBASE_APP_ID=<from firebaseConfig.appId>
   ```
   Other vars in `.env.production` already have correct values.
6. **Authentication → Settings → Authorized domains**: add `attendance-fa916.web.app` and `attendance-fa916.firebaseapp.com`

## First deploy

```bash
npx -y firebase-tools@latest login          # interactive — opens browser
npx -y firebase-tools@latest use attendance-fa916
npm run build                                # produces dist/
npm run deploy                               # deploys rules, indexes, hosting
```

After deploy, the app is live at `https://attendance-fa916.web.app`.

## First sign-in (bootstrap)

1. Open `https://attendance-fa916.web.app/admin/login`
2. Click "Đăng nhập với Google" → use **ngominhthuan.tnut@gmail.com**
3. The first sign-in automatically creates `meta/config` in Firestore with your `teacherUid`
4. You're now the teacher

## Subsequent deploys

Just:
```bash
npm run build
npm run deploy
```

## Smoke test checklist

- [ ] Login as teacher
- [ ] Create a class (with weekly schedule + initial rate)
- [ ] Add a student to the class
- [ ] Copy the parent link
- [ ] Open the parent link in a private/incognito window — should NOT require login
- [ ] As teacher, attend the next session — mark students present/excused/absent
- [ ] Verify parent link reflects the attendance under "Điểm danh"
- [ ] Mark the month as paid → verify it shows as "Đã thu"
- [ ] Open `/p/<token>/invoice/<YYYY-MM>` — verify the invoice table

## Operations notes

- Free tier (Spark plan) limits: 50K reads/day, 20K writes/day. Read budget per parent visit ≈ 4. Per teacher attendance entry ≈ N students.
- If you ever change the `teacherUid` (e.g., new Google account), edit `meta/config` directly in Firestore console.
- The `firestore.rules` bootstrap is hard-coded to the email `ngominhthuan.tnut@gmail.com`. If you change accounts, update the rules and redeploy.

## v1.x — Bổ sung & lưu ý vận hành

### Rules phải deploy lại khi đổi
Các tính năng v1.x dùng collection mới (`studentCodes`) + field config (`adminEmails`, `payment`). Sau khi sửa `firestore.rules` **bắt buộc**:
```bash
firebase deploy --only firestore:rules        # hoặc: firestore:rules,hosting
```
Nếu chỉ deploy hosting mà quên rules → trang **tra cứu** / **admin phụ** sẽ báo permission denied.

### Admin phụ (giáo viên dạy thay)
1. Chủ tài khoản → **Cài đặt → Admin phụ** → nhập **email Google** người hỗ trợ → Thêm.
2. Người đó đăng nhập Google bằng đúng email → có toàn quyền. Chỉ chủ mới thêm/xoá được.

### Trang tra cứu chung cho phụ huynh
- Link chung: `https://attendance-fa916.web.app/tra-cuu` — gửi cả nhóm phụ huynh.
- Lấy **mã** từng HS: Chi tiết lớp → tab Học sinh (chip mã / nút "Tải mã tra cứu" ra Excel), hoặc thẻ "Chia sẻ cho phụ huynh".

### Google Calendar (trang "Lịch")
Cần cấu hình ở **Google Cloud Console** (project `attendance-fa916`):
1. **APIs & Services → OAuth consent screen**: thêm scope `.../auth/calendar.events`.
2. Thêm tài khoản chủ + admin vào **Test users** (scope nhạy cảm; chưa "verify app" thì chỉ test users dùng được — sẽ có cảnh báo "app chưa xác minh" → Advanced → tiếp tục).
3. Đăng nhập lại để được hỏi cấp quyền Calendar.

### PWA (cài như app)
- Chỉ cài được qua **HTTPS** (`*.web.app`) hoặc `localhost`. Nút **"Cài đặt ứng dụng"** hiện ở drawer admin / app bar phụ huynh khi trình duyệt đủ điều kiện; iOS Safari có hướng dẫn "Thêm vào Màn hình chính".
- Cập nhật app: service worker `autoUpdate` — người dùng nhận bản mới ở lần mở kế tiếp.

### Thư viện thêm (v1.x)
`xlsx` (SheetJS, cài từ CDN chính chủ — import/export Excel) · `dompurify` (làm sạch HTML ghi chú) · `vite-plugin-pwa` + `@vite-pwa/assets-generator` (dev).

## Troubleshooting

- "404 Not Found" after deploy: ensure Hosting `rewrites` are configured for SPA (`firebase.json` already does this).
- "Permission denied" reads: re-verify `meta/config.teacherUid` matches the signed-in Google UID.
