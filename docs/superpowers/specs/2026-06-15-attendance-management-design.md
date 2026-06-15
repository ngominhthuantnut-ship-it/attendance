# Design — Attendance & Tuition Management System

**Ngày**: 2026-06-15
**Status**: Draft → User Review
**Firebase Project**: `attendance-fa916`

> Tài liệu thiết kế kỹ thuật chi tiết cho hệ thống. Đọc `docs/PRD.md` trước để hiểu yêu cầu sản phẩm; đọc `CONTEXT.md` để nắm domain language.

---

## Phần 1 — Kiến trúc tổng quan

### Tech stack

**Frontend** (single SPA):
- Vue 3 (`<script setup lang="ts">`)
- Vuetify 4 (Material 3)
- Pinia (state management)
- vue-router (với lazy-loading admin vs parent chunk)
- vee-validate + Zod (form validation)
- vueuse-core (`useStorage`, `useDateFormat`, `useDebounceFn`)
- Vite + TypeScript strict

**Backend**:
- Firebase Auth (Google OAuth, 1 teacher duy nhất)
- Cloud Firestore (region `asia-southeast1`)
- Firebase Hosting (deploy static)
- **KHÔNG Cloud Functions** → tránh Blaze plan

### Routing

```
/                               → redirect (admin nếu logged in, 404 nếu không)
/admin/login                    → Google sign-in
/admin/                         → Dashboard
/admin/classes                  → Danh sách lớp
/admin/classes/:classId         → Chi tiết lớp (tabs: info / schedule / students)
/admin/classes/:classId/attendance/:date  → Điểm danh 1 buổi
/admin/students/:studentId      → Chi tiết HS (schedule + attendance + billing)
/admin/billing                  → Tổng quan thu chi tháng

/p/:token                       → Parent: tổng quan
/p/:token/schedule              → Parent: lịch học
/p/:token/attendance            → Parent: điểm danh
/p/:token/invoice/:yyyyMM       → Parent: hoá đơn tháng (sharable)
```

**Route guards** (trong `router/index.ts`):
- `meta.requiresTeacher: true` cho `/admin/*` (trừ `/admin/login`): check `auth.uid === meta/config.teacherUid` → fail thì redirect login
- `meta.requiresParentToken: true` cho `/p/:token/*`: load parentLink → 404 nếu invalid

### Project structure

```
attendance/
├── CONTEXT.md
├── CLAUDE.md
├── docs/
│   ├── PRD.md
│   └── superpowers/specs/2026-06-15-attendance-management-design.md
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .env.production
├── .env.local
├── vite.config.ts
├── vitest.config.ts
├── vitest.rules.config.ts
├── package.json
└── src/
    ├── main.ts
    ├── App.vue
    ├── router/index.ts
    ├── services/
    │   ├── firebase.ts          # init Firebase app + emulator switch
    │   └── parentLinkUrl.ts     # build URL từ token
    ├── stores/
    │   ├── useAuthStore.ts
    │   ├── useConfigStore.ts
    │   ├── useClassesStore.ts
    │   ├── useStudentsStore.ts
    │   ├── useMonthsStore.ts
    │   └── useParentStore.ts
    ├── composables/
    │   ├── useScheduleCompute.ts    # PURE: expandSchedule()
    │   ├── useBillingCompute.ts     # PURE: computeMonth(), getRateAtDate()
    │   └── useCachedFetch.ts        # TTL cache wrapper
    ├── lib/
    │   ├── dates.ts                 # VN locale helpers
    │   ├── tokens.ts                # generateParentToken()
    │   └── i18n.ts                  # tiếng Việt strings
    ├── types/
    │   ├── class.ts
    │   ├── student.ts
    │   ├── month.ts
    │   └── parentLink.ts
    ├── pages/
    │   ├── admin/
    │   │   ├── LoginPage.vue
    │   │   ├── DashboardPage.vue
    │   │   ├── ClassListPage.vue
    │   │   ├── ClassDetailPage.vue
    │   │   ├── AttendanceEntryPage.vue
    │   │   ├── StudentDetailPage.vue
    │   │   └── BillingOverviewPage.vue
    │   └── parent/
    │       ├── ParentHomePage.vue
    │       ├── ParentSchedulePage.vue
    │       ├── ParentAttendancePage.vue
    │       └── ParentInvoicePage.vue
    └── components/
        ├── ClassScheduleForm.vue
        ├── RateHistoryEditor.vue
        ├── AttendanceStatusBadge.vue
        ├── AttendanceRow.vue
        ├── MonthPicker.vue
        ├── MoneyText.vue
        ├── ParentLinkCard.vue
        ├── ConfirmDialog.vue
        └── EmptyState.vue
```

---

## Phần 2 — Firestore data model

### Nguyên tắc tối ưu Spark plan

| Tối ưu | Cách làm | Lợi |
|---|---|---|
| Bucket theo tháng | 1 doc `months/{YYYY-MM}` per HS chứa attendance + payment | Parent xem 1 tháng = **1 read** |
| Hạn chế `onSnapshot` | Chỉ dùng listener ở màn điểm danh; còn lại `getDoc` | Giảm phí read |
| Cache localStorage | `meta/config`, `parentLinks/{token}` | Parent revisit = 0 read 2 doc này |
| Cache Pinia TTL 60s | Class list, student list | Nav qua lại không refetch |
| Batch writes | `writeBatch()` khi điểm danh cả lớp | Atomic + ít round-trip |

### Collections

#### `meta/config` (singleton)
```ts
{
  teacherUid: string;
  teacherEmail: string;
  teacherName: string;
}
```

#### `classes/{classId}`
```ts
{
  name: string;
  startDate: "YYYY-MM-DD";
  endDate: "YYYY-MM-DD";
  weeklySchedule: {
    mon?: { start: "HH:mm"; end: "HH:mm" };
    tue?: { start: "HH:mm"; end: "HH:mm" };
    wed?: { start: "HH:mm"; end: "HH:mm" };
    thu?: { start: "HH:mm"; end: "HH:mm" };
    fri?: { start: "HH:mm"; end: "HH:mm" };
    sat?: { start: "HH:mm"; end: "HH:mm" };
    sun?: { start: "HH:mm"; end: "HH:mm" };
  };
  rateHistory: { effectiveFrom: "YYYY-MM-DD"; rate: number }[];
  excludedDates: "YYYY-MM-DD"[];
  addedDates: { date: "YYYY-MM-DD"; start: "HH:mm"; end: "HH:mm" }[];
  status: "active" | "archived";
}
```

#### `students/{studentId}`
```ts
{
  classId: string;
  name: string;
  dob: "YYYY-MM-DD" | null;
  parentName: string;
  parentPhone: string;
  startDate: "YYYY-MM-DD";
  endDate: "YYYY-MM-DD" | null;
  notes: string;
  parentLinkToken: string;
  status: "active" | "inactive";
}
```

#### `students/{studentId}/months/{YYYY-MM}` ⭐ (subcollection)
```ts
{
  month: "YYYY-MM";
  classId: string;
  attendance: {
    [date: "YYYY-MM-DD"]: {
      status: "present" | "excused" | "absent";
      note?: string;
      markedAt: Timestamp;
    }
  };
  payment: null | {
    amount: number;
    paidAt: Timestamp;
    note?: string;
  };
}
```
Doc tạo lười: chỉ khi điểm danh buổi đầu tháng *hoặc* mark paid.

#### `parentLinks/{token}` (token = doc ID)
```ts
{
  studentId: string;
  classId: string;
  createdAt: Timestamp;
}
```

### Read budget (Spark)

| Flow | Reads | Ghi chú |
|---|---|---|
| Teacher login + dashboard | 1 (config) + N (classes list) | Cache 60s |
| Teacher class detail | 1 (class) + 1 (students query) | |
| Teacher điểm danh buổi (20 HS) | 20 (months/cur) qua 1 query batch | |
| Teacher mark attendance (20 HS) | 20 writes (batched) | |
| Parent first visit | 1 + 1 + 1 + 1 = **4 reads** | Sau cache localStorage |
| Parent xem tháng khác | 1 read | |

### Indexes (`firestore.indexes.json`)
- `students`: composite `(classId asc, status asc, name asc)`
- `classes`: composite `(status asc, startDate desc)`

---

## Phần 3 — Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    function configRef() {
      return /databases/$(db)/documents/meta/config;
    }
    function isTeacher() {
      return request.auth != null
          && exists(configRef())
          && request.auth.uid == get(configRef()).data.teacherUid;
    }
    function isBootstrap() {
      return request.auth != null
          && !exists(configRef())
          && request.auth.token.email == 'dang.nh.aprotrain@gmail.com'
          && request.auth.token.email_verified == true;
    }

    match /meta/config {
      allow get: if true;
      allow list: if false;
      allow create: if isBootstrap()
                  && request.resource.data.teacherUid == request.auth.uid;
      allow update: if isTeacher()
                  && request.resource.data.teacherUid == resource.data.teacherUid;
      allow delete: if false;
    }

    match /classes/{classId} {
      allow get: if true;
      allow list: if isTeacher();
      allow create, update, delete: if isTeacher();
    }

    match /students/{studentId} {
      allow get: if true;
      allow list: if isTeacher();
      allow create, update, delete: if isTeacher();

      match /months/{monthId} {
        allow get: if true;
        allow list: if isTeacher();
        allow create, update, delete: if isTeacher();
      }
    }

    match /parentLinks/{token} {
      allow get: if true;
      allow list: if false;
      allow create, update, delete: if isTeacher();
    }
  }
}
```

### Threat model

| Vector | Mitigation |
|---|---|
| Guess studentId | Firestore auto-ID ~120 bit entropy → infeasible |
| Brute force parentLink token | UUID v4 ~122 bit → infeasible |
| Bootstrap race | Hardcode email check |
| Đổi teacherUid chiếm quyền | Rule chặn update field uid |
| Spam read làm cạn 50K Spark | Accepted risk (small scale) |

### Validation rules (bổ sung trong implementation)
- `keys().hasOnly([...allowed])` để chặn ghi field rác
- Enum check cho `status`
- `amount > 0` cho payment

---

## Phần 4 — Logic tính lịch & tính tiền

### `composables/useScheduleCompute.ts` (PURE)

```ts
type Session = {
  date: string;            // "YYYY-MM-DD"
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;           // "HH:mm"
  end: string;
  source: "weekly" | "added";
};

function expandSchedule(opts: {
  class: Class;
  from: string;
  to: string;
  studentStart?: string;
  studentEnd?: string;
}): Session[];
```

**Algorithm:**
1. `effectiveFrom = max(from, class.startDate, studentStart)`
2. `effectiveTo = min(to, class.endDate, studentEnd ?? +∞)`
3. Duyệt từng ngày `[effectiveFrom, effectiveTo]`:
   - Nếu `weeklySchedule[dayKey]` tồn tại và date ∉ `excludedDates` → tạo session
4. Cộng các `addedDates` rơi vào range. Nếu trùng date với weekly → **added override**.
5. Sort theo date.

### `getRateAtDate`

```ts
function getRateAtDate(rateHistory: RateEntry[], dateISO: string): number;
```
Trả về `rate` của entry có `effectiveFrom <= dateISO` lớn nhất. Throw nếu không có entry nào hợp lệ.

### `composables/useBillingCompute.ts` (PURE)

```ts
type BilledSession = Session & {
  status: "unmarked" | "present" | "excused" | "absent";
  rate: number;
  billable: boolean;       // status in {present, absent}
  amount: number;
};

function computeMonth(opts: {
  class: Class;
  student: Student;
  monthDoc: MonthDoc | null;
  yearMonth: string;
}): {
  sessions: BilledSession[];
  totals: {
    sessionCount: number;
    present: number;
    excused: number;
    absent: number;
    unmarked: number;
    confirmedAmount: number;
    projectedAmount: number;
  };
  paymentStatus: "paid" | "unpaid";
  paidInfo: { amount: number; paidAt: Timestamp; note?: string } | null;
  warnings: string[];
};
```

**Algorithm:**
1. `expandSchedule(...)` → sessions
2. Map: `status = monthDoc?.attendance?.[date]?.status ?? "unmarked"`; `rate = getRateAtDate(...)`; `billable, amount`
3. Tính totals: `confirmedAmount` = sum amount sessions không phải unmarked; `projectedAmount` = sum amount giả định unmarked → present
4. `paymentStatus = monthDoc?.payment ? "paid" : "unpaid"`
5. Warning: `paid && payment.amount !== confirmedAmount` → push "Số tính lại khác số đã thu"

### `lib/dates.ts` helpers

```ts
function vnDayLabel(dayOfWeek: number): string;       // "T2"..."CN"
function formatVnDate(iso: string): string;           // "15/06/2026"
function formatVnTime(hhmm: string): string;          // "18:00"
function formatVnd(n: number): string;                // "150.000 đ"
function monthsBetween(from: string, to: string): string[];
function daysInMonth(yyyyMM: string): string[];
function dayKey(date: Date): "mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun";
```

Tất cả hard-code `Asia/Ho_Chi_Minh`. Không dùng `Date.now()` cho compute deterministic — chỉ dùng cho `markedAt`/`paidAt`.

---

## Phần 5 — UI structure & screens

### Layout

**Admin** (desktop-first):
- `<VApp>` + `<VNavigationDrawer>` (Lớp / Học sinh / Học phí / Cài đặt)
- `<VAppBar>`: tên + avatar Google + sign-out
- `<VMain>` với `<RouterView>`

**Parent** (mobile-first, max-width 600px):
- `<VApp>` không drawer
- `<VAppBar>` minimal: tên con + lớp
- `<VBottomNavigation>`: Tổng quan / Lịch / Điểm danh / Hoá đơn

### Key screens (admin)

| Route | Mô tả |
|---|---|
| `/admin/login` | Card Google sign-in. Sau auth → bootstrap nếu cần. |
| `/admin/` | Dashboard: 3 stat cards (lớp active, HS active, dự tính thu); buổi học hôm nay; HS chưa thu tháng trước |
| `/admin/classes` | Data table lớp với filter/search; nút "+ Thêm lớp" |
| `/admin/classes/:classId` | 3 tabs: Info (form sửa + rate editor) / Lịch (calendar exclude/add) / HS (table) |
| `/admin/classes/:classId/attendance/:date` | Bảng HS với 3 radio (Có/Vắng có phép/Vắng không phép) + nút "Lưu tất cả"; realtime listener |
| `/admin/students/:studentId` | Header HS + parent link card; 2 tabs: Lịch & Điểm danh / Học phí |
| `/admin/billing` | Tổng hợp tháng: chọn tháng, filter lớp, status; row HS với số tiền + payment |

### Key screens (parent)

| Route | Mô tả |
|---|---|
| `/p/:token` | Card thông tin con + lớp + tóm tắt tháng + quick links |
| `/p/:token/schedule` | Calendar tháng highlight buổi học, month picker |
| `/p/:token/attendance` | List buổi với status badge, filter tháng |
| `/p/:token/invoice/:yyyyMM` | Header hoá đơn + bảng buổi/rate/amount + tổng + payment status |

### Shared components

| Component | Vai trò |
|---|---|
| `<ClassScheduleForm>` | 7 checkbox thứ + time inputs |
| `<RateHistoryEditor>` | List rate + nút thêm entry với date picker |
| `<AttendanceStatusBadge>` | Chip màu theo status |
| `<MonthPicker>` | Picker `YYYY-MM` với prev/next |
| `<MoneyText>` | Format VND |
| `<ParentLinkCard>` | URL + nút copy + QR dialog |
| `<ConfirmDialog>` | Xác nhận destructive |
| `<EmptyState>` | Placeholder + CTA |

### Pinia stores

| Store | Responsibility |
|---|---|
| `useAuthStore` | currentUser, isTeacher, sign-in/out, claim bootstrap |
| `useConfigStore` | meta/config (cache localStorage) |
| `useClassesStore` | CRUD classes, get class detail, TTL cache |
| `useStudentsStore` | CRUD students by class, TTL cache |
| `useMonthsStore` | get month doc, mark attendance batch, mark/unmark paid |
| `useParentStore` | (parent app) load full chain, cached |

### Code-splitting

Routes `/admin/*` và `/p/*` ở 2 chunk khác nhau qua dynamic import → bundle parent <200KB gzipped (Vuetify subset).

---

## Phần 6 — Testing, dev workflow, deployment

### Testing strategy

**Tier 1 — Unit tests (Vitest, bắt buộc 100%)**
- `expandSchedule` — excluded/added, student crop, range partial, conflict added vs weekly
- `getRateAtDate` — boundary, multi entries
- `computeMonth` — per status billable, projected vs confirmed, warning
- `lib/dates.ts` — leap year, DST, formatters

**Tier 2 — Component tests (Vitest + Vue Test Utils)**
- `AttendanceStatusBadge`, `MoneyText`, `MonthPicker`
- `ClassScheduleForm` (vee-validate)
- `RateHistoryEditor` (add/sort/validate)

**Tier 3 — Integration (Firestore Emulator + `@firebase/rules-unit-testing`)**
- Pinia stores CRUD với emulator
- Rules tests:
  - Unauth không write
  - Auth ≠ teacherUid không write
  - Bootstrap chỉ 1 lần
  - Parent get studentId ngẫu nhiên → forbidden (qua list test)
  - Parent get cụ thể qua parentLink → OK
  - Parent list collection → forbidden

**Tier 4 — E2E (defer)**
- Playwright happy path khi cần

### Dev workflow

```
package.json scripts:
  dev          → vite
  emulator     → firebase emulators:start --only auth,firestore,hosting
  dev:full     → concurrently emulator + vite
  test         → vitest run
  test:watch   → vitest
  test:rules   → vitest --config vitest.rules.config.ts
  lint         → eslint + prettier
  typecheck    → vue-tsc --noEmit
  build        → vite build
  preview      → vite preview
  deploy       → firebase deploy --only hosting,firestore
```

**`firebase.json`:**
```json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "emulators": {
    "auth":      { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting":   { "port": 5000 },
    "ui":        { "enabled": true, "port": 4000 }
  }
}
```

**Env vars:**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=attendance-fa916.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendance-fa916
VITE_FIREBASE_APP_ID=...
VITE_USE_EMULATOR=true             # chỉ .env.local
VITE_TEACHER_EMAIL=dang.nh.aprotrain@gmail.com
```

### One-time Firebase setup

1. Firebase Console → project `attendance-fa916`
2. Authentication → Sign-in method → enable Google
3. Firestore Database → mode "production" → region `asia-southeast1`
4. Project settings → Web app → register → copy config sang `.env.production`
5. Authentication → Settings → Authorized domains → add hosting domain
6. Lần đầu deploy: mở `/admin/login` → sign in Google bằng `dang.nh.aprotrain@gmail.com` → bootstrap

CLI:
```
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use attendance-fa916
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,hosting
```

### Acceptance criteria v1

- [ ] Giáo viên đăng nhập Google, bootstrap teacher lần đầu
- [ ] CRUD lớp với weekly schedule + rate history
- [ ] CRUD HS trong lớp với startDate/endDate riêng
- [ ] Điểm danh 1 buổi cho cả lớp 3 trạng thái, batch save
- [ ] Sửa điểm danh quá khứ được
- [ ] Loại trừ / thêm ngày bù lịch lớp
- [ ] Thay đổi đơn giá → buổi cũ giá cũ, buổi mới giá mới
- [ ] Đánh dấu đã thu / chưa thu tháng
- [ ] Cảnh báo lệch số khi sửa attendance sau paid
- [ ] Copy link phụ huynh (kèm QR)
- [ ] Phụ huynh xem được tổng quan / lịch / điểm danh / hoá đơn tháng
- [ ] Link hoá đơn bền vĩnh, share được
- [ ] 100% unit test coverage cho compute logic
- [ ] Rules tests pass

### Out of scope (v1)

Xem `docs/PRD.md` mục 7.

---

## Phụ lục — Decisions log

| Quyết định | Lý do |
|---|---|
| 1 giáo viên, Google OAuth | User chọn — phục vụ trung tâm cá nhân |
| Link phụ huynh per HS, không auth | User chọn — đơn giản nhất |
| Track paid/unpaid không partial | User chọn — đủ cho mục đích |
| Đơn giá per lớp (không per session/HS) | User chọn — đơn giản |
| HS có startDate/endDate riêng (default = class.startDate) | User chọn |
| Hoá đơn link share (không print) | User chọn |
| Student fields: name, dob, parentName, parentPhone, startDate, notes | User chọn (option B) |
| Sửa điểm danh quá khứ không giới hạn | User chọn |
| Tính tiền theo tháng dương lịch | User chọn |
| Approach 1: client-only, không Cloud Functions | User chọn — Spark plan |
| Bucket attendance + payment theo tháng/HS | Tối ưu read Spark |
| Bootstrap teacher qua email check | Chặn race condition |
