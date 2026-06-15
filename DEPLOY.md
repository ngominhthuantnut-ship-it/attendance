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
2. Click "Đăng nhập với Google" → use **dang.nh.aprotrain@gmail.com**
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
- The `firestore.rules` bootstrap is hard-coded to the email `dang.nh.aprotrain@gmail.com`. If you change accounts, update the rules and redeploy.

## Troubleshooting

- "404 Not Found" after deploy: ensure Hosting `rewrites` are configured for SPA (`firebase.json` already does this).
- "Permission denied" reads: re-verify `meta/config.teacherUid` matches the signed-in Google UID.
