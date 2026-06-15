# CLAUDE.md — Hướng dẫn cho Claude trong repo này

> Đọc kỹ file này trước khi viết code. Đọc thêm `CONTEXT.md` cho domain language và `docs/PRD.md` cho yêu cầu sản phẩm.

## 1. Tech stack (cố định — không tự ý đổi)

### Frontend
- **Vue 3** (`<script setup lang="ts">` — Composition API, không dùng Options API)
- **Vuetify 4** (Material 3 components)
- **Pinia** (state management, theo aggregate)
- **vue-router** (lazy-loaded routes, code-split admin vs parent)
- **vee-validate** + **Zod** (form validation)
- **vueuse-core** (`useStorage`, `useDateFormat`, `useDebounceFn`, ...)
- **Vite** (build & dev)
- **TypeScript strict mode**

### Backend
- **Firebase** project: `attendance-fa916`
  - **Firestore** (database) — region `asia-southeast1`
  - **Firebase Auth** (Google OAuth, single teacher)
  - **Firebase Hosting** (deploy SPA tĩnh)
  - **KHÔNG dùng Cloud Functions** — tránh ràng buộc Blaze plan
- Plan: **Spark (free tier)** — design phải tối ưu cho 50K reads / 20K writes / ngày

### Testing
- **Vitest** (unit + component)
- **@firebase/rules-unit-testing** + Firestore Emulator (rules tests)
- Playwright (defer, không bắt buộc v1)

## 2. Skills bắt buộc dùng khi code

Khi sửa/viết code import các package này, **bắt buộc** invoke skill tương ứng để lấy best practice:

| Khi code đụng | Invoke skill |
|---|---|
| `vue`, `*.vue` files | `vue-skilld` |
| `vuetify` | `vuetify-skilld` |
| `pinia` | `pinia-skilld` |
| `vue-router` | `vue-router-skilld` |
| `vee-validate` | `vee-validate-skilld` |
| `@vueuse/core` | `vueuse-core-skilld` |
| Firebase setup / CLI | `firebase-basics` |
| Firestore queries / rules | `firebase-firestore` |
| Firebase Auth | `firebase-auth-basics` |
| Firebase Hosting deploy | `firebase-hosting-basics` |
| Audit security rules sau khi sửa | `firebase-security-rules-auditor` |
| Thiết kế UI / chọn layout / palette | `ui-ux-pro-max` |

## 3. Convention coding

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`
- Không dùng `any`; nếu bí dùng `unknown` rồi narrow
- Type cho tất cả Firestore doc → định nghĩa trong `src/types/`

### Vue components
- `<script setup lang="ts">` always
- Props typed bằng `defineProps<{ ... }>()`
- Emits typed bằng `defineEmits<{ ... }>()`
- KHÔNG dùng `defineProps` runtime form
- Composables đặt trong `src/composables/`, named `useXxx`
- Component name PascalCase, file name PascalCase

### Pure logic vs side effects
- **Logic miền** (`expandSchedule`, `computeMonth`, formatters) → pure function trong `src/composables/` hoặc `src/lib/`, KHÔNG đụng Firestore
- **Firestore I/O** → trong Pinia store hoặc service layer, không trộn vào composable thuần
- Pure function = unit test dễ; I/O = test với emulator

### Pinia stores
- 1 store per aggregate (`useClassesStore`, `useStudentsStore`, ...)
- Mỗi store có cache TTL 60s + manual invalidate
- Export typed actions, không return Promise<any>

### Firestore access patterns (Spark optimization)

**ƯU TIÊN:**
- `getDoc` / `getDocs` 1-shot **>** `onSnapshot` (chỉ dùng listener khi cần real-time edit)
- Cache aggressively: localStorage cho immutable-ish (config, parentLink), Pinia TTL cho mutable
- Batch writes: dùng `writeBatch()` khi update nhiều doc cùng lúc (vd điểm danh cả lớp)
- Tránh `where` query nếu có thể `getDoc` bằng ID
- KHÔNG list collection từ parent app (chỉ teacher list được)

**TRÁNH:**
- `onSnapshot` lan tràn không cleanup
- Đọc lặp cùng 1 doc nhiều lần trong 1 page load
- Fetch full subcollection khi chỉ cần 1 doc

### Naming
- File `kebab-case.ts` cho lib/composable, `PascalCase.vue` cho component
- Hằng số: `UPPER_SNAKE_CASE`
- Type/Interface: `PascalCase`
- Function/variable: `camelCase`
- Firestore field: `camelCase`

### Error handling
- Lỗi network: hiển thị `<VSnackbar>` Vuetify, không alert/confirm browser
- Lỗi validation: vee-validate inline
- KHÔNG silent catch — luôn log hoặc surface

### Comments
- Mặc định KHÔNG comment. Code rõ ràng > comment giải thích.
- Chỉ comment khi WHY không hiển nhiên (vd workaround, edge case, ràng buộc business).

## 4. Locale rules

- Date storage: `YYYY-MM-DD` ISO string. KHÔNG dùng `Date` object cho storage.
- Time storage: `HH:mm` string.
- Money: integer VND.
- Timezone: hard-code `Asia/Ho_Chi_Minh` ở mọi formatter.
- Ngôn ngữ UI: tiếng Việt.
- DOW label: T2, T3, T4, T5, T6, T7, CN.

## 5. Security rules

- File: `firestore.rules` ở root
- Teacher xác định qua `meta/config.teacherUid`
- Bootstrap: lần đầu cho user có email khớp `dang.nh.aprotrain@gmail.com` claim
- Parent: anonymous, get-only theo ID, không list collection
- Khi sửa rules → BẮT BUỘC invoke `firebase-security-rules-auditor` skill review
- Khi sửa rules → BẮT BUỘC viết rules test với `@firebase/rules-unit-testing`

## 6. Git & commit

- Repo chưa init. Khi user yêu cầu commit lần đầu, init repo trước.
- Commit message format: imperative, tiếng Anh OK. Ngắn gọn.
- Đừng commit nếu user không yêu cầu.
- Đừng tự push, tự deploy nếu user không yêu cầu.

## 7. Tests bắt buộc

Trước khi claim "done" cho 1 feature:
- [ ] Unit tests pass (`npm test`)
- [ ] Typecheck pass (`npm run typecheck`)
- [ ] Lint pass (`npm run lint`)
- [ ] Pure functions trong `composables/` và `lib/` đạt 100% coverage

Cho logic core (`expandSchedule`, `computeMonth`, `getRateAtDate`): **TDD bắt buộc** — viết test trước, code sau.

## 8. Out of scope (xem PRD)

Không tự thêm các tính năng không có trong PRD. Nếu user yêu cầu tính năng mới → thảo luận, update PRD trước, code sau.

## 9. Files quan trọng

| File | Vai trò |
|---|---|
| `CONTEXT.md` | Domain language + business rules |
| `CLAUDE.md` | File này — tech stack + convention |
| `docs/PRD.md` | Yêu cầu sản phẩm |
| `docs/superpowers/specs/2026-06-15-attendance-management-design.md` | Thiết kế kỹ thuật chi tiết |
| `firestore.rules` | Security rules |
| `firestore.indexes.json` | Composite indexes |
| `firebase.json` | Firebase project config (hosting, emulators) |
