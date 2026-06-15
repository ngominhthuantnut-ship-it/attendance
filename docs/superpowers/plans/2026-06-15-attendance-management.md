# Attendance & Tuition Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single Vue 3 SPA + Firebase backend for one teacher to manage classes/students/attendance/tuition, with anonymous parent links for viewing schedule + attendance + invoice.

**Architecture:** Client-only computation (no Cloud Functions). Pure compute logic in composables, Firestore as storage, security rules gate teacher (Google OAuth) vs anonymous parent (get-by-ID with unguessable tokens). Monthly buckets per student to minimize reads on Firebase Spark plan.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Vuetify 4, Pinia, vue-router, vee-validate + Zod, vueuse-core, Vite, TypeScript strict, Vitest, Firebase (Auth, Firestore, Hosting).

**Sources:**
- Spec: `docs/superpowers/specs/2026-06-15-attendance-management-design.md`
- Domain: `CONTEXT.md`
- Tech rules: `CLAUDE.md`
- Requirements: `docs/PRD.md`

**Phases (each phase = a working milestone):**
- **Phase 0** — Project bootstrap (Vite + deps + Firebase config + git)
- **Phase 1** — Domain types & pure libraries (dates, tokens) with TDD
- **Phase 2** — Pure compute: `expandSchedule`, `getRateAtDate`, `computeMonth` with TDD
- **Phase 3** — Firestore rules + emulator rules tests
- **Phase 4** — Firebase service, auth store, config store, bootstrap flow
- **Phase 5** — Pinia data stores (classes, students, months, parentLinks)
- **Phase 6** — Router + shared layouts + shared components
- **Phase 7** — Admin UI (classes, students, attendance, billing, dashboard)
- **Phase 8** — Parent UI + invoice + final deploy

---

## Phase 0 — Project bootstrap

### Task 0.1 — Initialize Vite + Vue 3 + TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.vue`, `src/env.d.ts`, `.gitignore`

- [ ] **Step 1: Init Vite project (manual scaffold to avoid wizard prompts)**

Run from `/Users/dangnh/Documents/project/attendance`:
```bash
npm init -y
npm pkg set type=module name=attendance private=true version=0.0.0
```

- [ ] **Step 2: Install runtime deps**

```bash
npm install vue@^3.5.0 vue-router@^4.4.0 pinia@^2.2.0 vuetify@^4.0.0 \
  @mdi/font@^7.4.47 vee-validate@^4.13.0 @vee-validate/zod@^4.13.0 zod@^3.23.0 \
  @vueuse/core@^11.0.0 firebase@^11.0.0
```

- [ ] **Step 3: Install dev deps**

```bash
npm install -D vite@^5.4.0 @vitejs/plugin-vue@^5.1.0 typescript@^5.6.0 \
  vue-tsc@^2.1.0 vitest@^2.1.0 @vue/test-utils@^2.4.0 jsdom@^25.0.0 \
  @vitest/coverage-v8@^2.1.0 vite-plugin-vuetify@^2.0.0 sass@^1.79.0 \
  @types/node@^22.0.0 eslint@^9.0.0 @vue/eslint-config-typescript@^14.0.0 \
  eslint-plugin-vue@^9.28.0 prettier@^3.3.0 \
  firebase-tools@^13.0.0 @firebase/rules-unit-testing@^4.0.0 concurrently@^9.0.0
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "jsx": "preserve",
    "skipLibCheck": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/**/*.tsx", "tests/**/*.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"],
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "vitest.rules.config.ts"]
}
```

- [ ] **Step 6: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import path from "node:path";

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173 },
  build: { sourcemap: true, target: "es2022" },
});
```

- [ ] **Step 7: Write `index.html`**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Quản lý điểm danh</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Write minimal `src/main.ts`**

```ts
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

- [ ] **Step 9: Write minimal `src/App.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <div>Attendance app — bootstrap</div>
</template>
```

- [ ] **Step 10: Write `src/env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_USE_EMULATOR: string;
  readonly VITE_TEACHER_EMAIL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const c: DefineComponent<object, object, unknown>;
  export default c;
}
```

- [ ] **Step 11: Write `.gitignore`**

```
node_modules
dist
.DS_Store
.env.local
*.log
coverage
.firebase
```

- [ ] **Step 12: Add scripts to `package.json`**

```bash
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vue-tsc -b && vite build"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.typecheck="vue-tsc --noEmit"
npm pkg set scripts.lint="eslint 'src/**/*.{ts,vue}' --max-warnings 0"
```

- [ ] **Step 13: Verify dev server starts**

```bash
npm run dev
```
Expected: prints `Local: http://localhost:5173/`, page shows "Attendance app — bootstrap". Stop with Ctrl+C.

- [ ] **Step 14: Verify typecheck passes**

```bash
npm run typecheck
```
Expected: exit 0, no errors.

- [ ] **Step 15: Init git + first commit**

```bash
cd /Users/dangnh/Documents/project/attendance
git init
git add -A
git commit -m "chore: bootstrap Vite + Vue 3 + TypeScript scaffold"
```
Expected: commit succeeds, working tree clean.

---

### Task 0.2 — Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/composables/**", "src/lib/**"],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 90 },
    },
  },
});
```

- [ ] **Step 2: Write `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

Wait — we did not install @testing-library; use a minimal setup:

```ts
// Intentionally empty — placeholder for future global test setup.
export {};
```

- [ ] **Step 3: Write a sanity test `tests/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";

describe("vitest sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Vitest with jsdom"
```

---

### Task 0.3 — Configure ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc.json`, `.prettierignore`

- [ ] **Step 1: Write `eslint.config.js`**

```js
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";

export default [
  { ignores: ["dist", "coverage", "node_modules", ".firebase"] },
  ...pluginVue.configs["flat/recommended"],
  ...vueTsEslintConfig(),
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];
```

- [ ] **Step 2: Write `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "vueIndentScriptAndStyle": false
}
```

- [ ] **Step 3: Write `.prettierignore`**

```
dist
coverage
node_modules
.firebase
package-lock.json
```

- [ ] **Step 4: Run lint to verify config**

```bash
npm run lint
```
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure ESLint + Prettier"
```

---

### Task 0.4 — Configure Firebase project files

**Files:**
- Create: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `.firebaserc`, `.env.local`, `.env.production`, `.env.example`

- [ ] **Step 1: Write `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

- [ ] **Step 2: Write `.firebaserc`**

```json
{
  "projects": {
    "default": "attendance-fa916"
  }
}
```

- [ ] **Step 3: Write placeholder `firestore.rules` (will be replaced in Phase 3)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 4: Write `firestore.indexes.json`**

```json
{
  "indexes": [
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "classId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "classes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 5: Write `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=attendance-fa916.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendance-fa916
VITE_FIREBASE_APP_ID=
VITE_USE_EMULATOR=true
VITE_TEACHER_EMAIL=dang.nh.aprotrain@gmail.com
```

- [ ] **Step 6: Write `.env.local` (gitignored — for dev with emulator)**

```
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=attendance-fa916.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendance-fa916
VITE_FIREBASE_APP_ID=demo-app-id
VITE_USE_EMULATOR=true
VITE_TEACHER_EMAIL=dang.nh.aprotrain@gmail.com
```

- [ ] **Step 7: Write `.env.production` (will be filled with real Firebase config after registering web app)**

```
VITE_FIREBASE_API_KEY=REPLACE_AT_DEPLOY_TIME
VITE_FIREBASE_AUTH_DOMAIN=attendance-fa916.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=attendance-fa916
VITE_FIREBASE_APP_ID=REPLACE_AT_DEPLOY_TIME
VITE_USE_EMULATOR=false
VITE_TEACHER_EMAIL=dang.nh.aprotrain@gmail.com
```

- [ ] **Step 8: Add emulator scripts to package.json**

```bash
npm pkg set scripts.emulator="firebase emulators:start --only auth,firestore"
npm pkg set scripts.dev:full="concurrently -k -n emulator,vite -c blue,green \"npm run emulator\" \"npm run dev\""
npm pkg set scripts.deploy="firebase deploy --only firestore:rules,firestore:indexes,hosting"
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: configure Firebase project files + emulator"
```

---

## Phase 1 — Domain types & pure libraries (TDD)

### Task 1.1 — Define core types

**Files:**
- Create: `src/types/class.ts`, `src/types/student.ts`, `src/types/month.ts`, `src/types/parentLink.ts`, `src/types/config.ts`, `src/types/index.ts`

- [ ] **Step 1: Write `src/types/class.ts`**

```ts
export type DateISO = string;     // "YYYY-MM-DD"
export type TimeHHmm = string;    // "HH:mm"
export type YearMonth = string;   // "YYYY-MM"

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface TimeRange {
  start: TimeHHmm;
  end: TimeHHmm;
}

export type WeeklySchedule = Partial<Record<DayKey, TimeRange>>;

export interface RateEntry {
  effectiveFrom: DateISO;
  rate: number;
}

export interface AddedSession {
  date: DateISO;
  start: TimeHHmm;
  end: TimeHHmm;
}

export type ClassStatus = "active" | "archived";

export interface Class {
  id: string;
  name: string;
  startDate: DateISO;
  endDate: DateISO;
  weeklySchedule: WeeklySchedule;
  rateHistory: RateEntry[];
  excludedDates: DateISO[];
  addedDates: AddedSession[];
  status: ClassStatus;
}
```

- [ ] **Step 2: Write `src/types/student.ts`**

```ts
import type { DateISO } from "./class";

export type StudentStatus = "active" | "inactive";

export interface Student {
  id: string;
  classId: string;
  name: string;
  dob: DateISO | null;
  parentName: string;
  parentPhone: string;
  startDate: DateISO;
  endDate: DateISO | null;
  notes: string;
  parentLinkToken: string;
  status: StudentStatus;
}
```

- [ ] **Step 3: Write `src/types/month.ts`**

```ts
import type { Timestamp } from "firebase/firestore";
import type { DateISO, YearMonth } from "./class";

export type AttendanceStatus = "present" | "excused" | "absent";

export interface AttendanceMark {
  status: AttendanceStatus;
  note?: string;
  markedAt: Timestamp;
}

export interface PaymentRecord {
  amount: number;
  paidAt: Timestamp;
  note?: string;
}

export interface MonthDoc {
  month: YearMonth;
  classId: string;
  attendance: Record<DateISO, AttendanceMark>;
  payment: PaymentRecord | null;
}
```

- [ ] **Step 4: Write `src/types/parentLink.ts`**

```ts
import type { Timestamp } from "firebase/firestore";

export interface ParentLink {
  studentId: string;
  classId: string;
  createdAt: Timestamp;
}
```

- [ ] **Step 5: Write `src/types/config.ts`**

```ts
export interface AppConfig {
  teacherUid: string;
  teacherEmail: string;
  teacherName: string;
}
```

- [ ] **Step 6: Write `src/types/index.ts`**

```ts
export * from "./class";
export * from "./student";
export * from "./month";
export * from "./parentLink";
export * from "./config";
```

- [ ] **Step 7: Verify typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(types): define domain types (Class, Student, MonthDoc, ParentLink, AppConfig)"
```

---

### Task 1.2 — Date helpers library (TDD)

**Files:**
- Create: `src/lib/dates.ts`, `tests/lib/dates.test.ts`

> All date arithmetic uses pure string manipulation on `YYYY-MM-DD` to avoid timezone surprises. Hard-coded for `Asia/Ho_Chi_Minh` semantics (calendar dates only — never time).

- [ ] **Step 1: Write failing tests for `parseISO`, `formatISO`, `addDays`, `compareDate`**

Create `tests/lib/dates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseISO,
  formatISO,
  addDays,
  compareDate,
  dayKeyOf,
  vnDayLabel,
  formatVnDate,
  formatVnTime,
  formatVnd,
  monthsBetween,
  daysInMonth,
  monthStart,
  monthEnd,
  monthOf,
  isInRange,
  todayISO,
} from "@/lib/dates";

describe("parseISO / formatISO / addDays", () => {
  it("round-trips a date", () => {
    expect(formatISO(parseISO("2026-06-15"))).toBe("2026-06-15");
  });

  it("addDays adds positive and negative", () => {
    expect(addDays("2026-06-15", 1)).toBe("2026-06-16");
    expect(addDays("2026-06-15", -1)).toBe("2026-06-14");
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("addDays handles leap year", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
  });
});

describe("compareDate", () => {
  it("returns negative/zero/positive correctly", () => {
    expect(compareDate("2026-06-15", "2026-06-16")).toBeLessThan(0);
    expect(compareDate("2026-06-15", "2026-06-15")).toBe(0);
    expect(compareDate("2026-06-16", "2026-06-15")).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify fail**

```bash
npm test -- dates
```
Expected: fail (module not found).

- [ ] **Step 3: Implement `src/lib/dates.ts` minimal (these helpers only, more in next steps)**

```ts
import type { DateISO, DayKey, TimeHHmm, YearMonth } from "@/types";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISO(iso: DateISO): Date {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  return new Date(Date.UTC(year, month, day));
}

export function formatISO(d: Date): DateISO {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: DateISO, n: number): DateISO {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return formatISO(d);
}

export function compareDate(a: DateISO, b: DateISO): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function dayKeyOf(iso: DateISO): DayKey {
  const keys: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = keys[parseISO(iso).getUTCDay()];
  if (!key) throw new Error("unreachable");
  return key;
}

export function vnDayLabel(iso: DateISO): string {
  const labels: Record<DayKey, string> = {
    mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN",
  };
  return labels[dayKeyOf(iso)];
}

export function formatVnDate(iso: DateISO): string {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatVnTime(hhmm: TimeHHmm): string {
  return hhmm;
}

export function formatVnd(n: number): string {
  return `${n.toLocaleString("vi-VN")} đ`;
}

export function monthOf(iso: DateISO): YearMonth {
  return iso.slice(0, 7);
}

export function monthStart(ym: YearMonth): DateISO {
  return `${ym}-01`;
}

export function monthEnd(ym: YearMonth): DateISO {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) throw new Error(`Invalid YearMonth: ${ym}`);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}-${String(last).padStart(2, "0")}`;
}

export function daysInMonth(ym: YearMonth): DateISO[] {
  const start = monthStart(ym);
  const end = monthEnd(ym);
  const out: DateISO[] = [];
  let cur = start;
  while (compareDate(cur, end) <= 0) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function monthsBetween(fromYM: YearMonth, toYM: YearMonth): YearMonth[] {
  const out: YearMonth[] = [];
  let [y, m] = fromYM.split("-").map(Number) as [number, number];
  const [ty, tm] = toYM.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function isInRange(iso: DateISO, from: DateISO, to: DateISO): boolean {
  return compareDate(iso, from) >= 0 && compareDate(iso, to) <= 0;
}

export function todayISO(now: Date = new Date()): DateISO {
  // Convert to Asia/Ho_Chi_Minh (UTC+7) calendar date
  const offsetMs = 7 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + offsetMs);
  return formatISO(local);
}
```

- [ ] **Step 4: Run tests — should pass for the implemented ones**

```bash
npm test -- dates
```
Expected: tests in step 1 pass; other test names referenced in import but not yet asserted (no test code → no failures yet).

- [ ] **Step 5: Add tests for the remaining helpers**

Append to `tests/lib/dates.test.ts`:

```ts
describe("dayKeyOf / vnDayLabel", () => {
  it("returns correct day key & label", () => {
    expect(dayKeyOf("2026-06-15")).toBe("mon"); // 2026-06-15 is Monday
    expect(vnDayLabel("2026-06-15")).toBe("T2");
    expect(vnDayLabel("2026-06-21")).toBe("CN");
  });
});

describe("formatVnDate / formatVnTime / formatVnd", () => {
  it("formats Vietnamese conventions", () => {
    expect(formatVnDate("2026-06-15")).toBe("15/06/2026");
    expect(formatVnTime("18:00")).toBe("18:00");
    expect(formatVnd(150000)).toMatch(/150\.000/);
    expect(formatVnd(0)).toMatch(/0/);
  });
});

describe("monthOf / monthStart / monthEnd / daysInMonth", () => {
  it("derives month string", () => {
    expect(monthOf("2026-06-15")).toBe("2026-06");
  });

  it("returns first and last day", () => {
    expect(monthStart("2026-06")).toBe("2026-06-01");
    expect(monthEnd("2026-06")).toBe("2026-06-30");
    expect(monthEnd("2026-02")).toBe("2026-02-28");
    expect(monthEnd("2024-02")).toBe("2024-02-29");
    expect(monthEnd("2026-12")).toBe("2026-12-31");
  });

  it("daysInMonth lists every day", () => {
    expect(daysInMonth("2026-02")).toHaveLength(28);
    expect(daysInMonth("2024-02")).toHaveLength(29);
    expect(daysInMonth("2026-06")[0]).toBe("2026-06-01");
    expect(daysInMonth("2026-06").at(-1)).toBe("2026-06-30");
  });
});

describe("monthsBetween / isInRange", () => {
  it("monthsBetween inclusive both ends", () => {
    expect(monthsBetween("2026-03", "2026-06")).toEqual([
      "2026-03", "2026-04", "2026-05", "2026-06",
    ]);
    expect(monthsBetween("2026-06", "2026-06")).toEqual(["2026-06"]);
    expect(monthsBetween("2025-11", "2026-02")).toEqual([
      "2025-11", "2025-12", "2026-01", "2026-02",
    ]);
  });

  it("isInRange inclusive both ends", () => {
    expect(isInRange("2026-06-15", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-06-01", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-06-30", "2026-06-01", "2026-06-30")).toBe(true);
    expect(isInRange("2026-05-31", "2026-06-01", "2026-06-30")).toBe(false);
    expect(isInRange("2026-07-01", "2026-06-01", "2026-06-30")).toBe(false);
  });
});

describe("todayISO", () => {
  it("converts a UTC instant to Asia/Ho_Chi_Minh calendar date", () => {
    // 2026-06-15 18:00 UTC = 2026-06-16 01:00 in VN → date is 2026-06-16
    expect(todayISO(new Date("2026-06-15T18:00:00Z"))).toBe("2026-06-16");
    // 2026-06-15 10:00 UTC = 2026-06-15 17:00 in VN → date is 2026-06-15
    expect(todayISO(new Date("2026-06-15T10:00:00Z"))).toBe("2026-06-15");
  });
});
```

- [ ] **Step 6: Run all date tests — verify pass**

```bash
npm test -- dates
```
Expected: all pass.

- [ ] **Step 7: Run coverage to confirm 100% on `src/lib/dates.ts`**

```bash
npm test -- --coverage --run dates
```
Expected: `src/lib/dates.ts` ≥ 100% lines/functions.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(lib): date helpers with TDD (VN locale, calendar-date arithmetic)"
```

---

### Task 1.3 — Token generator (TDD)

**Files:**
- Create: `src/lib/tokens.ts`, `tests/lib/tokens.test.ts`

- [ ] **Step 1: Write failing test `tests/lib/tokens.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { generateParentToken } from "@/lib/tokens";

describe("generateParentToken", () => {
  it("returns a string ≥ 20 characters", () => {
    const t = generateParentToken();
    expect(typeof t).toBe("string");
    expect(t.length).toBeGreaterThanOrEqual(20);
  });

  it("returns URL-safe characters only", () => {
    const t = generateParentToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different value each call", () => {
    const a = generateParentToken();
    const b = generateParentToken();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- tokens
```
Expected: fail (module not found).

- [ ] **Step 3: Implement `src/lib/tokens.ts`**

```ts
export function generateParentToken(): string {
  // 16 random bytes → base64url ≈ 22 characters, ~128 bit entropy.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

- [ ] **Step 4: Run — pass**

```bash
npm test -- tokens
```
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): generateParentToken (URL-safe, ~128-bit entropy)"
```

---

## Phase 2 — Pure compute logic (TDD)

### Task 2.1 — `getRateAtDate`

**Files:**
- Create: `src/composables/useBillingCompute.ts`, `tests/composables/getRateAtDate.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { getRateAtDate } from "@/composables/useBillingCompute";

describe("getRateAtDate", () => {
  const history = [
    { effectiveFrom: "2026-01-01", rate: 100_000 },
    { effectiveFrom: "2026-04-01", rate: 150_000 },
    { effectiveFrom: "2026-07-01", rate: 180_000 },
  ];

  it("returns rate of the latest entry on or before the date", () => {
    expect(getRateAtDate(history, "2026-01-01")).toBe(100_000);
    expect(getRateAtDate(history, "2026-03-31")).toBe(100_000);
    expect(getRateAtDate(history, "2026-04-01")).toBe(150_000);
    expect(getRateAtDate(history, "2026-06-30")).toBe(150_000);
    expect(getRateAtDate(history, "2026-07-01")).toBe(180_000);
    expect(getRateAtDate(history, "2027-01-01")).toBe(180_000);
  });

  it("works regardless of entry ordering", () => {
    const unsorted = [
      { effectiveFrom: "2026-07-01", rate: 180_000 },
      { effectiveFrom: "2026-01-01", rate: 100_000 },
      { effectiveFrom: "2026-04-01", rate: 150_000 },
    ];
    expect(getRateAtDate(unsorted, "2026-05-15")).toBe(150_000);
  });

  it("throws when no entry has effectiveFrom <= date", () => {
    expect(() => getRateAtDate(history, "2025-12-31")).toThrow();
  });

  it("throws on empty history", () => {
    expect(() => getRateAtDate([], "2026-06-15")).toThrow();
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- getRateAtDate
```
Expected: fail.

- [ ] **Step 3: Implement `getRateAtDate` in `src/composables/useBillingCompute.ts`**

```ts
import type { DateISO, RateEntry } from "@/types";
import { compareDate } from "@/lib/dates";

export function getRateAtDate(history: RateEntry[], date: DateISO): number {
  let best: RateEntry | null = null;
  for (const entry of history) {
    if (compareDate(entry.effectiveFrom, date) <= 0) {
      if (!best || compareDate(entry.effectiveFrom, best.effectiveFrom) > 0) {
        best = entry;
      }
    }
  }
  if (!best) {
    throw new Error(
      `No rate entry effective on or before ${date} (history length=${history.length})`,
    );
  }
  return best.rate;
}
```

- [ ] **Step 4: Run — pass**

```bash
npm test -- getRateAtDate
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(billing): getRateAtDate — pick latest rate entry on or before date"
```

---

### Task 2.2 — `expandSchedule` happy path

**Files:**
- Create: `src/composables/useScheduleCompute.ts`, `tests/composables/expandSchedule.test.ts`

- [ ] **Step 1: Write failing test for plain weekly pattern**

```ts
import { describe, it, expect } from "vitest";
import { expandSchedule } from "@/composables/useScheduleCompute";
import type { Class } from "@/types";

const baseClass: Class = {
  id: "c1",
  name: "Toán 8",
  startDate: "2026-06-01", // Monday
  endDate: "2026-06-30",
  weeklySchedule: {
    mon: { start: "18:00", end: "19:30" },
    wed: { start: "19:00", end: "20:00" },
    fri: { start: "18:00", end: "19:30" },
  },
  rateHistory: [{ effectiveFrom: "2026-06-01", rate: 150_000 }],
  excludedDates: [],
  addedDates: [],
  status: "active",
};

describe("expandSchedule — weekly pattern", () => {
  it("expands T2/T4/T6 sessions across the month", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
    });
    expect(sessions.length).toBe(13);
    expect(sessions[0]).toMatchObject({
      date: "2026-06-01",
      dayOfWeek: 1,
      start: "18:00",
      end: "19:30",
      source: "weekly",
    });
    expect(sessions.at(-1)).toMatchObject({ date: "2026-06-29" });
  });

  it("sessions are sorted ascending by date", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
    });
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i]!.date >= sessions[i - 1]!.date).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npm test -- expandSchedule
```
Expected: fail (module not found).

- [ ] **Step 3: Implement minimal `expandSchedule`**

`src/composables/useScheduleCompute.ts`:
```ts
import type { Class, DateISO } from "@/types";
import { addDays, compareDate, dayKeyOf } from "@/lib/dates";

export interface Session {
  date: DateISO;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  end: string;
  source: "weekly" | "added";
}

const dayKeyToIndex = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const;

export interface ExpandScheduleArgs {
  cls: Class;
  from: DateISO;
  to: DateISO;
  studentStart?: DateISO | null;
  studentEnd?: DateISO | null;
}

function maxDate(...dates: DateISO[]): DateISO {
  return dates.reduce((a, b) => (compareDate(a, b) >= 0 ? a : b));
}

function minDate(...dates: DateISO[]): DateISO {
  return dates.reduce((a, b) => (compareDate(a, b) <= 0 ? a : b));
}

export function expandSchedule(args: ExpandScheduleArgs): Session[] {
  const { cls, from, to, studentStart, studentEnd } = args;
  const effFrom = maxDate(from, cls.startDate, studentStart ?? from);
  const effTo = minDate(to, cls.endDate, studentEnd ?? to);
  if (compareDate(effFrom, effTo) > 0) return [];

  const excluded = new Set(cls.excludedDates);
  const addedByDate = new Map(cls.addedDates.map((a) => [a.date, a]));

  const sessions: Session[] = [];
  let cur = effFrom;
  while (compareDate(cur, effTo) <= 0) {
    const dayKey = dayKeyOf(cur);
    const added = addedByDate.get(cur);
    if (added) {
      sessions.push({
        date: cur,
        dayOfWeek: dayKeyToIndex[dayKey],
        start: added.start,
        end: added.end,
        source: "added",
      });
    } else {
      const slot = cls.weeklySchedule[dayKey];
      if (slot && !excluded.has(cur)) {
        sessions.push({
          date: cur,
          dayOfWeek: dayKeyToIndex[dayKey],
          start: slot.start,
          end: slot.end,
          source: "weekly",
        });
      }
    }
    cur = addDays(cur, 1);
  }
  return sessions;
}
```

- [ ] **Step 4: Run — pass**

```bash
npm test -- expandSchedule
```
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(schedule): expandSchedule — generate sessions from weekly pattern"
```

---

### Task 2.3 — `expandSchedule` edge cases

**Files:**
- Modify: `tests/composables/expandSchedule.test.ts`

- [ ] **Step 1: Append edge-case tests**

```ts
describe("expandSchedule — excludedDates", () => {
  it("skips dates listed in excludedDates", () => {
    const cls = { ...baseClass, excludedDates: ["2026-06-03", "2026-06-15"] };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    expect(sessions.find((s) => s.date === "2026-06-03")).toBeUndefined();
    expect(sessions.find((s) => s.date === "2026-06-15")).toBeUndefined();
    expect(sessions.length).toBe(11);
  });
});

describe("expandSchedule — addedDates override", () => {
  it("adds dates not in weekly pattern", () => {
    const cls = {
      ...baseClass,
      addedDates: [{ date: "2026-06-04", start: "17:00", end: "18:30" }], // Thursday
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    const added = sessions.find((s) => s.date === "2026-06-04");
    expect(added).toMatchObject({ source: "added", start: "17:00", end: "18:30" });
  });

  it("overrides weekly time on conflict", () => {
    const cls = {
      ...baseClass,
      addedDates: [{ date: "2026-06-01", start: "20:00", end: "21:30" }], // Monday in weekly
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    const session = sessions.find((s) => s.date === "2026-06-01");
    expect(session).toMatchObject({ source: "added", start: "20:00", end: "21:30" });
  });

  it("addedDates overrides even when date is excluded", () => {
    const cls = {
      ...baseClass,
      excludedDates: ["2026-06-04"],
      addedDates: [{ date: "2026-06-04", start: "17:00", end: "18:30" }],
    };
    const sessions = expandSchedule({ cls, from: "2026-06-01", to: "2026-06-30" });
    expect(sessions.find((s) => s.date === "2026-06-04")?.source).toBe("added");
  });
});

describe("expandSchedule — range cropping", () => {
  it("crops to from/to inclusive", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-10",
      to: "2026-06-20",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-10" && s.date <= "2026-06-20").toBe(true);
    }
  });

  it("crops to studentStart / studentEnd", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-01",
      to: "2026-06-30",
      studentStart: "2026-06-15",
      studentEnd: "2026-06-22",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-15" && s.date <= "2026-06-22").toBe(true);
    }
  });

  it("returns empty when effective range inverts", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-06-30",
      to: "2026-06-01",
    });
    expect(sessions).toEqual([]);
  });

  it("crops to class boundaries", () => {
    const sessions = expandSchedule({
      cls: baseClass,
      from: "2026-05-01",
      to: "2026-07-31",
    });
    for (const s of sessions) {
      expect(s.date >= "2026-06-01" && s.date <= "2026-06-30").toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run — verify all pass**

```bash
npm test -- expandSchedule
```
Expected: all pass (the implementation already handles these cases).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(schedule): edge cases for excluded/added/range cropping"
```

---

### Task 2.4 — `computeMonth` (TDD)

**Files:**
- Modify: `src/composables/useBillingCompute.ts`
- Create: `tests/composables/computeMonth.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { computeMonth } from "@/composables/useBillingCompute";
import type { Class, Student, MonthDoc } from "@/types";

const cls: Class = {
  id: "c1",
  name: "Toán 8",
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  weeklySchedule: {
    mon: { start: "18:00", end: "19:30" },
    wed: { start: "18:00", end: "19:30" },
    fri: { start: "18:00", end: "19:30" },
  },
  rateHistory: [
    { effectiveFrom: "2026-06-01", rate: 150_000 },
    { effectiveFrom: "2026-06-15", rate: 180_000 },
  ],
  excludedDates: [],
  addedDates: [],
  status: "active",
};

const student: Student = {
  id: "s1",
  classId: "c1",
  name: "An",
  dob: null,
  parentName: "",
  parentPhone: "",
  startDate: "2026-06-01",
  endDate: null,
  notes: "",
  parentLinkToken: "tok",
  status: "active",
};

function ts(): Timestamp {
  return Timestamp.fromDate(new Date("2026-06-15T10:00:00Z"));
}

describe("computeMonth — empty monthDoc", () => {
  it("all sessions unmarked, confirmed=0, projected>0", () => {
    const r = computeMonth({ cls, student, monthDoc: null, yearMonth: "2026-06" });
    expect(r.sessions.length).toBe(13);
    expect(r.sessions.every((s) => s.status === "unmarked")).toBe(true);
    expect(r.totals.unmarked).toBe(13);
    expect(r.totals.confirmedAmount).toBe(0);
    expect(r.totals.projectedAmount).toBeGreaterThan(0);
    expect(r.paymentStatus).toBe("unpaid");
    expect(r.paidInfo).toBeNull();
  });
});

describe("computeMonth — billable rules", () => {
  it("present and absent are billable; excused is not", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },     // rate 150k
        "2026-06-03": { status: "excused", markedAt: ts() },     // rate 150k → 0
        "2026-06-05": { status: "absent",  markedAt: ts() },     // rate 150k
        "2026-06-15": { status: "present", markedAt: ts() },     // rate 180k (new)
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.present).toBe(2);
    expect(r.totals.excused).toBe(1);
    expect(r.totals.absent).toBe(1);
    expect(r.totals.confirmedAmount).toBe(150_000 + 150_000 + 180_000);
  });
});

describe("computeMonth — rate applies by session date", () => {
  it("uses 150k before 2026-06-15 and 180k from 2026-06-15", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-12": { status: "present", markedAt: ts() }, // Friday — 150k
        "2026-06-15": { status: "present", markedAt: ts() }, // Monday — 180k
        "2026-06-17": { status: "present", markedAt: ts() }, // Wed     — 180k
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.confirmedAmount).toBe(150_000 + 180_000 + 180_000);
  });
});

describe("computeMonth — payment & warning", () => {
  it("paymentStatus reflects payment field", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {},
      payment: { amount: 1_000_000, paidAt: ts(), note: "Đã thu mặt" },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.paymentStatus).toBe("paid");
    expect(r.paidInfo?.amount).toBe(1_000_000);
  });

  it("warns when paid amount differs from confirmed amount", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: { amount: 999_999, paidAt: ts() },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("no warning when paid amount matches confirmed", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: { amount: 150_000, paidAt: ts() },
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.warnings).toEqual([]);
  });
});

describe("computeMonth — student range crop", () => {
  it("only sessions within student.startDate..endDate count", () => {
    const s = { ...student, startDate: "2026-06-15" };
    const r = computeMonth({ cls, student: s, monthDoc: null, yearMonth: "2026-06" });
    expect(r.sessions.every((sess) => sess.date >= "2026-06-15")).toBe(true);
  });
});

describe("computeMonth — projectedAmount treats unmarked as present", () => {
  it("projected >= confirmed always", () => {
    const monthDoc: MonthDoc = {
      month: "2026-06",
      classId: "c1",
      attendance: {
        "2026-06-01": { status: "present", markedAt: ts() },
      },
      payment: null,
    };
    const r = computeMonth({ cls, student, monthDoc, yearMonth: "2026-06" });
    expect(r.totals.projectedAmount).toBeGreaterThan(r.totals.confirmedAmount);
  });
});
```

- [ ] **Step 2: Run — verify fail (computeMonth not defined)**

```bash
npm test -- computeMonth
```
Expected: fail.

- [ ] **Step 3: Implement `computeMonth` in `src/composables/useBillingCompute.ts`**

Append to the file:

```ts
import type {
  AttendanceStatus,
  Class,
  MonthDoc,
  PaymentRecord,
  Student,
  YearMonth,
} from "@/types";
import { monthEnd, monthStart } from "@/lib/dates";
import { expandSchedule, type Session } from "./useScheduleCompute";

export interface BilledSession extends Session {
  status: "unmarked" | AttendanceStatus;
  rate: number;
  billable: boolean;
  amount: number;
}

export interface ComputeMonthArgs {
  cls: Class;
  student: Student;
  monthDoc: MonthDoc | null;
  yearMonth: YearMonth;
}

export interface ComputeMonthResult {
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
  paidInfo: PaymentRecord | null;
  warnings: string[];
}

export function computeMonth(args: ComputeMonthArgs): ComputeMonthResult {
  const { cls, student, monthDoc, yearMonth } = args;
  const from = monthStart(yearMonth);
  const to = monthEnd(yearMonth);

  const sessions = expandSchedule({
    cls,
    from,
    to,
    studentStart: student.startDate,
    studentEnd: student.endDate,
  });

  const totals = {
    sessionCount: sessions.length,
    present: 0,
    excused: 0,
    absent: 0,
    unmarked: 0,
    confirmedAmount: 0,
    projectedAmount: 0,
  };

  const billed: BilledSession[] = sessions.map((s) => {
    const mark = monthDoc?.attendance?.[s.date];
    const status: "unmarked" | AttendanceStatus = mark?.status ?? "unmarked";
    const rate = getRateAtDate(cls.rateHistory, s.date);
    const billable = status === "present" || status === "absent";
    const amount = billable ? rate : 0;

    if (status === "present") totals.present += 1;
    else if (status === "excused") totals.excused += 1;
    else if (status === "absent") totals.absent += 1;
    else totals.unmarked += 1;

    if (status !== "unmarked") totals.confirmedAmount += amount;
    // Projected: treat unmarked as present (billable at rate); confirmed amounts as-is.
    if (status === "unmarked") totals.projectedAmount += rate;
    else totals.projectedAmount += amount;

    return { ...s, status, rate, billable, amount };
  });

  const paymentStatus: "paid" | "unpaid" = monthDoc?.payment ? "paid" : "unpaid";
  const paidInfo = monthDoc?.payment ?? null;

  const warnings: string[] = [];
  if (paidInfo && paidInfo.amount !== totals.confirmedAmount) {
    warnings.push(
      `Số tính lại (${totals.confirmedAmount.toLocaleString("vi-VN")}đ) khác số đã thu (${paidInfo.amount.toLocaleString("vi-VN")}đ)`,
    );
  }

  return { sessions: billed, totals, paymentStatus, paidInfo, warnings };
}
```

- [ ] **Step 4: Run — verify all pass**

```bash
npm test -- computeMonth
```
Expected: all pass.

- [ ] **Step 5: Run coverage on composables**

```bash
npm test -- --coverage --run
```
Expected: `src/composables/useScheduleCompute.ts` and `src/composables/useBillingCompute.ts` ≥ 100% lines/functions.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(billing): computeMonth — full billing logic with TDD coverage"
```

---

## Phase 3 — Firestore rules + emulator tests

### Task 3.1 — Write the real Firestore rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Replace `firestore.rules` content with full rules**

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

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(rules): teacher full access, parent get-by-ID, bootstrap by email"
```

---

### Task 3.2 — Rules emulator tests

**Files:**
- Create: `vitest.rules.config.ts`, `tests/rules/firestore.rules.test.ts`

- [ ] **Step 1: Write `vitest.rules.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
```

- [ ] **Step 2: Add script in `package.json`**

```bash
npm pkg set scripts.test:rules="vitest --config vitest.rules.config.ts run"
```

- [ ] **Step 3: Write `tests/rules/firestore.rules.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const TEACHER_EMAIL = "dang.nh.aprotrain@gmail.com";
const TEACHER_UID = "teacher-uid-1";
const OTHER_UID = "other-uid";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "attendance-fa916-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

function teacherDb() {
  return env
    .authenticatedContext(TEACHER_UID, { email: TEACHER_EMAIL, email_verified: true })
    .firestore();
}

function otherDb() {
  return env
    .authenticatedContext(OTHER_UID, { email: "intruder@example.com", email_verified: true })
    .firestore();
}

function anonDb() {
  return env.unauthenticatedContext().firestore();
}

async function seedConfig() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "meta/config"), {
      teacherUid: TEACHER_UID,
      teacherEmail: TEACHER_EMAIL,
      teacherName: "Test Teacher",
    });
  });
}

describe("bootstrap", () => {
  it("allows the teacher email to create meta/config when missing", async () => {
    await assertSucceeds(
      setDoc(doc(teacherDb(), "meta/config"), {
        teacherUid: TEACHER_UID,
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Test Teacher",
      }),
    );
  });

  it("denies bootstrap from other emails", async () => {
    await assertFails(
      setDoc(doc(otherDb(), "meta/config"), {
        teacherUid: OTHER_UID,
        teacherEmail: "other@example.com",
        teacherName: "Intruder",
      }),
    );
  });

  it("denies bootstrap from anonymous", async () => {
    await assertFails(
      setDoc(doc(anonDb(), "meta/config"), {
        teacherUid: "anon-uid",
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Intruder",
      }),
    );
  });

  it("denies second bootstrap once config exists", async () => {
    await seedConfig();
    await assertFails(
      setDoc(doc(otherDb(), "meta/config"), {
        teacherUid: OTHER_UID,
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Replace",
      }),
    );
  });

  it("denies updating teacherUid even by teacher", async () => {
    await seedConfig();
    await assertFails(
      setDoc(doc(teacherDb(), "meta/config"), {
        teacherUid: "different-uid",
        teacherEmail: TEACHER_EMAIL,
        teacherName: "Hijack",
      }),
    );
  });
});

describe("classes", () => {
  beforeEach(async () => seedConfig());

  it("teacher creates a class", async () => {
    await assertSucceeds(setDoc(doc(teacherDb(), "classes/c1"), { name: "Toán" }));
  });

  it("non-teacher cannot create", async () => {
    await assertFails(setDoc(doc(otherDb(), "classes/c1"), { name: "Toán" }));
  });

  it("anon cannot list classes", async () => {
    await assertFails(getDocs(collection(anonDb(), "classes")));
  });

  it("anon can get a class by ID", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "classes/c1"), { name: "Toán" });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "classes/c1")));
  });
});

describe("students + months", () => {
  beforeEach(async () => seedConfig());

  it("teacher writes student & month", async () => {
    await assertSucceeds(setDoc(doc(teacherDb(), "students/s1"), { name: "An" }));
    await assertSucceeds(
      setDoc(doc(teacherDb(), "students/s1/months/2026-06"), { month: "2026-06" }),
    );
  });

  it("anon can get student & month by ID", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "students/s1"), { name: "An" });
      await setDoc(doc(ctx.firestore(), "students/s1/months/2026-06"), { month: "2026-06" });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "students/s1")));
    await assertSucceeds(getDoc(doc(anonDb(), "students/s1/months/2026-06")));
  });

  it("anon cannot list students or months", async () => {
    await assertFails(getDocs(collection(anonDb(), "students")));
    await assertFails(getDocs(collection(anonDb(), "students/s1/months")));
  });

  it("anon cannot write", async () => {
    await assertFails(setDoc(doc(anonDb(), "students/s1"), { name: "Mal" }));
    await assertFails(
      setDoc(doc(anonDb(), "students/s1/months/2026-06"), { hacked: true }),
    );
  });
});

describe("parentLinks", () => {
  beforeEach(async () => seedConfig());

  it("teacher creates token", async () => {
    await assertSucceeds(
      setDoc(doc(teacherDb(), "parentLinks/tok-abc"), { studentId: "s1", classId: "c1" }),
    );
  });

  it("anon gets by token", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "parentLinks/tok-abc"), {
        studentId: "s1",
        classId: "c1",
      });
    });
    await assertSucceeds(getDoc(doc(anonDb(), "parentLinks/tok-abc")));
  });

  it("anon cannot list parentLinks", async () => {
    await assertFails(getDocs(collection(anonDb(), "parentLinks")));
  });
});
```

- [ ] **Step 4: Start emulator in background, run rules tests, then stop emulator**

```bash
npx firebase emulators:exec --only firestore "npm run test:rules"
```
Expected: all rules tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(rules): coverage for bootstrap, classes, students, months, parentLinks"
```

---

## Phase 4 — Firebase service, auth, config bootstrap

### Task 4.1 — Firebase init service

**Files:**
- Create: `src/services/firebase.ts`, `src/services/parentLinkUrl.ts`

- [ ] **Step 1: Write `src/services/firebase.ts`**

```ts
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    auth = getAuth(app);
    db = getFirestore(app);
    if (import.meta.env.VITE_USE_EMULATOR === "true") {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
  }
  return { app: app!, auth: auth!, db: db! };
}

export const googleProvider = new GoogleAuthProvider();
```

- [ ] **Step 2: Write `src/services/parentLinkUrl.ts`**

```ts
export function parentLinkUrl(token: string, base: string = window.location.origin): string {
  return `${base}/p/${token}`;
}

export function parentInvoiceUrl(
  token: string,
  yearMonth: string,
  base: string = window.location.origin,
): string {
  return `${base}/p/${token}/invoice/${yearMonth}`;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(services): Firebase init with emulator switch + parent URL builders"
```

---

### Task 4.2 — Pinia setup + auth store

**Files:**
- Modify: `src/main.ts`
- Create: `src/stores/useAuthStore.ts`

- [ ] **Step 1: Update `src/main.ts` to register Pinia + Vuetify**

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";

const vuetify = createVuetify({
  components,
  directives,
  theme: { defaultTheme: "light" },
});

createApp(App).use(createPinia()).use(vuetify).mount("#app");
```

- [ ] **Step 2: Write `src/stores/useAuthStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebase, googleProvider } from "@/services/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const initialized = ref(false);
  const { auth } = getFirebase();

  onAuthStateChanged(auth, (u) => {
    user.value = u;
    initialized.value = true;
  });

  const isSignedIn = computed(() => user.value !== null);
  const uid = computed(() => user.value?.uid ?? null);
  const email = computed(() => user.value?.email ?? null);
  const displayName = computed(() => user.value?.displayName ?? null);

  async function signIn(): Promise<void> {
    await signInWithPopup(auth, googleProvider);
  }

  async function signOutNow(): Promise<void> {
    await signOut(auth);
  }

  return { user, initialized, isSignedIn, uid, email, displayName, signIn, signOut: signOutNow };
});
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(auth): Pinia + Vuetify + useAuthStore with Google sign-in"
```

---

### Task 4.3 — Config store + bootstrap logic

**Files:**
- Create: `src/stores/useConfigStore.ts`

- [ ] **Step 1: Write `src/stores/useConfigStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useStorage } from "@vueuse/core";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { AppConfig } from "@/types";
import { useAuthStore } from "./useAuthStore";

export const useConfigStore = defineStore("config", () => {
  const { db } = getFirebase();
  const cached = useStorage<AppConfig | null>("meta-config", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const loading = ref(false);
  const error = ref<string | null>(null);
  const auth = useAuthStore();

  const config = computed(() => cached.value);
  const isBootstrapped = computed(() => cached.value !== null);
  const isCurrentUserTeacher = computed(
    () => !!auth.uid && !!cached.value && auth.uid === cached.value.teacherUid,
  );

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const snap = await getDoc(doc(db, "meta/config"));
      cached.value = snap.exists() ? (snap.data() as AppConfig) : null;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function bootstrap(): Promise<void> {
    if (!auth.user) throw new Error("Not signed in");
    const expectedEmail = import.meta.env.VITE_TEACHER_EMAIL;
    if (auth.user.email !== expectedEmail) {
      throw new Error(`Tài khoản hiện tại không phải teacher email (${expectedEmail})`);
    }
    const data: AppConfig = {
      teacherUid: auth.user.uid,
      teacherEmail: auth.user.email ?? "",
      teacherName: auth.user.displayName ?? "",
    };
    await setDoc(doc(db, "meta/config"), data);
    cached.value = data;
  }

  return { config, loading, error, isBootstrapped, isCurrentUserTeacher, load, bootstrap };
});
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(config): useConfigStore with localStorage cache + bootstrap"
```

---

## Phase 5 — Pinia data stores

### Task 5.1 — Cache helper + classes store

**Files:**
- Create: `src/composables/useCachedFetch.ts`, `src/stores/useClassesStore.ts`

- [ ] **Step 1: Write cache helper**

```ts
// src/composables/useCachedFetch.ts
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  constructor(private ttlMs: number) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
```

- [ ] **Step 2: Write `src/stores/useClassesStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Class, ClassStatus } from "@/types";
import { TTLCache } from "@/composables/useCachedFetch";

const TTL = 60_000;

export const useClassesStore = defineStore("classes", () => {
  const { db } = getFirebase();
  const cache = new TTLCache<string, Class>(TTL);
  const listCache = new TTLCache<ClassStatus, Class[]>(TTL);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function list(status: ClassStatus = "active"): Promise<Class[]> {
    const cached = listCache.get(status);
    if (cached) return cached;
    loading.value = true;
    try {
      const q = query(
        collection(db, "classes"),
        where("status", "==", status),
        orderBy("startDate", "desc"),
      );
      const snap = await getDocs(q);
      const out: Class[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Class, "id">) }));
      listCache.set(status, out);
      for (const c of out) cache.set(c.id, c);
      return out;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string): Promise<Class | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    const snap = await getDoc(doc(db, "classes", id));
    if (!snap.exists()) return null;
    const c = { id: snap.id, ...(snap.data() as Omit<Class, "id">) };
    cache.set(id, c);
    return c;
  }

  async function create(id: string, data: Omit<Class, "id">): Promise<void> {
    await setDoc(doc(db, "classes", id), { ...data, createdAt: serverTimestamp() });
    invalidate(id);
  }

  async function update(id: string, patch: Partial<Class>): Promise<void> {
    const { id: _omit, ...rest } = patch;
    void _omit;
    await updateDoc(doc(db, "classes", id), { ...rest, updatedAt: serverTimestamp() });
    invalidate(id);
  }

  async function remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "classes", id));
    invalidate(id);
  }

  function invalidate(id?: string): void {
    if (id) cache.invalidate(id);
    listCache.clear();
  }

  return { loading, error, list, get, create, update, remove, invalidate };
});

export type { Timestamp };
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(stores): TTLCache + useClassesStore (CRUD + list with status filter)"
```

---

### Task 5.2 — Students store

**Files:**
- Create: `src/stores/useStudentsStore.ts`

- [ ] **Step 1: Write `src/stores/useStudentsStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Student, StudentStatus } from "@/types";
import { generateParentToken } from "@/lib/tokens";
import { TTLCache } from "@/composables/useCachedFetch";

const TTL = 60_000;

export const useStudentsStore = defineStore("students", () => {
  const { db } = getFirebase();
  const cache = new TTLCache<string, Student>(TTL);
  const byClass = new TTLCache<string, Student[]>(TTL);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function listByClass(classId: string, status: StudentStatus = "active"): Promise<Student[]> {
    const key = `${classId}:${status}`;
    const cached = byClass.get(key);
    if (cached) return cached;
    loading.value = true;
    try {
      const q = query(
        collection(db, "students"),
        where("classId", "==", classId),
        where("status", "==", status),
        orderBy("name", "asc"),
      );
      const snap = await getDocs(q);
      const out = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
      byClass.set(key, out);
      for (const s of out) cache.set(s.id, s);
      return out;
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function get(id: string): Promise<Student | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    const snap = await getDoc(doc(db, "students", id));
    if (!snap.exists()) return null;
    const s = { id: snap.id, ...(snap.data() as Omit<Student, "id">) };
    cache.set(id, s);
    return s;
  }

  async function create(id: string, data: Omit<Student, "id" | "parentLinkToken">): Promise<string> {
    const token = generateParentToken();
    const batch = writeBatch(db);
    batch.set(doc(db, "students", id), {
      ...data,
      parentLinkToken: token,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "parentLinks", token), {
      studentId: id,
      classId: data.classId,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    invalidate(id, data.classId);
    return token;
  }

  async function update(id: string, patch: Partial<Student>): Promise<void> {
    const { id: _omit, ...rest } = patch;
    void _omit;
    await updateDoc(doc(db, "students", id), { ...rest, updatedAt: serverTimestamp() });
    invalidate(id);
  }

  async function remove(id: string): Promise<void> {
    const student = await get(id);
    if (!student) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "students", id));
    batch.delete(doc(db, "parentLinks", student.parentLinkToken));
    const monthsSnap = await getDocs(collection(db, "students", id, "months"));
    for (const m of monthsSnap.docs) batch.delete(m.ref);
    await batch.commit();
    invalidate(id, student.classId);
  }

  function invalidate(id?: string, classId?: string): void {
    if (id) cache.invalidate(id);
    if (classId) {
      byClass.invalidate(`${classId}:active`);
      byClass.invalidate(`${classId}:inactive`);
    }
  }

  return { loading, error, listByClass, get, create, update, remove, invalidate };
});
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stores): useStudentsStore (CRUD + parentLink + cascade delete months)"
```

---

### Task 5.3 — Months store

**Files:**
- Create: `src/stores/useMonthsStore.ts`

- [ ] **Step 1: Write `src/stores/useMonthsStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { AttendanceMark, AttendanceStatus, MonthDoc, YearMonth } from "@/types";
import { monthOf } from "@/lib/dates";

export const useMonthsStore = defineStore("months", () => {
  const { db } = getFirebase();
  const cache = new Map<string, MonthDoc>();
  const loading = ref(false);
  const error = ref<string | null>(null);

  function key(studentId: string, ym: YearMonth): string {
    return `${studentId}:${ym}`;
  }

  async function get(studentId: string, ym: YearMonth, useCache = true): Promise<MonthDoc | null> {
    const k = key(studentId, ym);
    if (useCache && cache.has(k)) return cache.get(k)!;
    const snap = await getDoc(doc(db, "students", studentId, "months", ym));
    if (!snap.exists()) return null;
    const data = snap.data() as MonthDoc;
    cache.set(k, data);
    return data;
  }

  function subscribe(
    studentId: string,
    ym: YearMonth,
    cb: (doc: MonthDoc | null) => void,
  ): Unsubscribe {
    return onSnapshot(doc(db, "students", studentId, "months", ym), (snap) => {
      const data = snap.exists() ? (snap.data() as MonthDoc) : null;
      if (data) cache.set(key(studentId, ym), data);
      cb(data);
    });
  }

  async function markAttendanceBatch(
    classId: string,
    date: string,
    marks: { studentId: string; status: AttendanceStatus; note?: string }[],
  ): Promise<void> {
    const ym = monthOf(date);
    const batch = writeBatch(db);
    const now = serverTimestamp();
    for (const m of marks) {
      const ref = doc(db, "students", m.studentId, "months", ym);
      // Use setDoc with merge to create-if-missing
      const data: Partial<MonthDoc> & Record<string, unknown> = {
        month: ym,
        classId,
        [`attendance.${date}.status`]: m.status,
        [`attendance.${date}.markedAt`]: now,
      };
      if (m.note !== undefined) {
        data[`attendance.${date}.note`] = m.note;
      }
      batch.set(ref, data, { merge: true });
      cache.delete(key(m.studentId, ym));
    }
    await batch.commit();
  }

  async function clearAttendance(studentId: string, date: string): Promise<void> {
    const ym = monthOf(date);
    const ref = doc(db, "students", studentId, "months", ym);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as MonthDoc;
    const next = { ...data.attendance };
    delete next[date];
    await setDoc(ref, { ...data, attendance: next });
    cache.delete(key(studentId, ym));
  }

  async function markPaid(
    studentId: string,
    ym: YearMonth,
    amount: number,
    note: string = "",
  ): Promise<void> {
    const ref = doc(db, "students", studentId, "months", ym);
    const payment = { amount, paidAt: Timestamp.now(), note };
    await setDoc(ref, { month: ym, payment }, { merge: true });
    cache.delete(key(studentId, ym));
  }

  async function unmarkPaid(studentId: string, ym: YearMonth): Promise<void> {
    const ref = doc(db, "students", studentId, "months", ym);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as MonthDoc;
    await setDoc(ref, { ...data, payment: null });
    cache.delete(key(studentId, ym));
  }

  function invalidate(): void {
    cache.clear();
  }

  return {
    loading,
    error,
    get,
    subscribe,
    markAttendanceBatch,
    clearAttendance,
    markPaid,
    unmarkPaid,
    invalidate,
  };
});
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(stores): useMonthsStore (attendance batch, payment, subscribe)"
```

---

### Task 5.4 — ParentLinks store + parent store

**Files:**
- Create: `src/stores/useParentLinksStore.ts`, `src/stores/useParentStore.ts`

- [ ] **Step 1: Write `src/stores/useParentLinksStore.ts`**

```ts
import { defineStore } from "pinia";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { ParentLink } from "@/types";

export const useParentLinksStore = defineStore("parentLinks", () => {
  const { db } = getFirebase();

  async function getByToken(token: string): Promise<ParentLink | null> {
    const snap = await getDoc(doc(db, "parentLinks", token));
    return snap.exists() ? (snap.data() as ParentLink) : null;
  }

  return { getByToken };
});
```

- [ ] **Step 2: Write `src/stores/useParentStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "@/services/firebase";
import type { Class, MonthDoc, ParentLink, Student, YearMonth } from "@/types";

interface CachedParentLink {
  token: string;
  studentId: string;
  classId: string;
}

export const useParentStore = defineStore("parent", () => {
  const { db } = getFirebase();
  const cachedLink = useStorage<CachedParentLink | null>("parent-link", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const cachedClass = useStorage<Class | null>("parent-class", null, undefined, {
    serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
  });
  const student = ref<Student | null>(null);
  const cls = ref<Class | null>(cachedClass.value);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadByToken(token: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      let link: ParentLink | null = null;
      if (cachedLink.value?.token === token) {
        link = {
          studentId: cachedLink.value.studentId,
          classId: cachedLink.value.classId,
          createdAt: { seconds: 0, nanoseconds: 0 } as never,
        };
      } else {
        const snap = await getDoc(doc(db, "parentLinks", token));
        if (!snap.exists()) throw new Error("Link không hợp lệ hoặc đã hết hạn");
        link = snap.data() as ParentLink;
        cachedLink.value = { token, studentId: link.studentId, classId: link.classId };
      }

      const [stuSnap, clsSnap] = await Promise.all([
        getDoc(doc(db, "students", link.studentId)),
        cls.value && cls.value.id === link.classId
          ? Promise.resolve(null)
          : getDoc(doc(db, "classes", link.classId)),
      ]);

      if (!stuSnap.exists()) throw new Error("Không tìm thấy học sinh");
      student.value = { id: stuSnap.id, ...(stuSnap.data() as Omit<Student, "id">) };

      if (clsSnap) {
        if (!clsSnap.exists()) throw new Error("Không tìm thấy lớp");
        cls.value = { id: clsSnap.id, ...(clsSnap.data() as Omit<Class, "id">) };
        cachedClass.value = cls.value;
      }
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function getMonth(studentId: string, ym: YearMonth): Promise<MonthDoc | null> {
    const snap = await getDoc(doc(db, "students", studentId, "months", ym));
    return snap.exists() ? (snap.data() as MonthDoc) : null;
  }

  return { cachedLink, student, cls, loading, error, loadByToken, getMonth };
});
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(stores): useParentLinksStore + useParentStore (cache class + link in localStorage)"
```

---

## Phase 6 — Router + shared layouts + shared components

### Task 6.1 — Router setup with guards

**Files:**
- Create: `src/router/index.ts`
- Modify: `src/main.ts`, `src/App.vue`

- [ ] **Step 1: Write `src/router/index.ts`**

```ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const adminRoutes: RouteRecordRaw[] = [
  {
    path: "/admin/login",
    name: "admin-login",
    component: () => import("@/pages/admin/LoginPage.vue"),
    meta: { layout: "admin-bare" },
  },
  {
    path: "/admin",
    component: () => import("@/layouts/AdminLayout.vue"),
    meta: { requiresTeacher: true },
    children: [
      { path: "", name: "admin-dashboard", component: () => import("@/pages/admin/DashboardPage.vue") },
      { path: "classes", name: "admin-class-list", component: () => import("@/pages/admin/ClassListPage.vue") },
      { path: "classes/:classId", name: "admin-class-detail", component: () => import("@/pages/admin/ClassDetailPage.vue"), props: true },
      {
        path: "classes/:classId/attendance/:date",
        name: "admin-attendance",
        component: () => import("@/pages/admin/AttendanceEntryPage.vue"),
        props: true,
      },
      { path: "students/:studentId", name: "admin-student-detail", component: () => import("@/pages/admin/StudentDetailPage.vue"), props: true },
      { path: "billing", name: "admin-billing", component: () => import("@/pages/admin/BillingOverviewPage.vue") },
    ],
  },
];

const parentRoutes: RouteRecordRaw[] = [
  {
    path: "/p/:token",
    component: () => import("@/layouts/ParentLayout.vue"),
    props: true,
    meta: { requiresParentToken: true },
    children: [
      { path: "", name: "parent-home", component: () => import("@/pages/parent/ParentHomePage.vue"), props: true },
      { path: "schedule", name: "parent-schedule", component: () => import("@/pages/parent/ParentSchedulePage.vue"), props: true },
      { path: "attendance", name: "parent-attendance", component: () => import("@/pages/parent/ParentAttendancePage.vue"), props: true },
      { path: "invoice/:yearMonth", name: "parent-invoice", component: () => import("@/pages/parent/ParentInvoicePage.vue"), props: true },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/admin" },
    ...adminRoutes,
    ...parentRoutes,
    { path: "/:catchAll(.*)*", component: () => import("@/pages/NotFoundPage.vue") },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const config = useConfigStore();

  // Wait for auth to initialize
  if (!auth.initialized) {
    await new Promise<void>((resolve) => {
      const stop = setInterval(() => {
        if (auth.initialized) {
          clearInterval(stop);
          resolve();
        }
      }, 30);
    });
  }

  if (to.meta.requiresTeacher) {
    if (!auth.isSignedIn) return { name: "admin-login" };
    if (!config.isBootstrapped) await config.load();
    if (!config.isCurrentUserTeacher) return { name: "admin-login", query: { unauthorized: "1" } };
  }

  return true;
});
```

- [ ] **Step 2: Update `src/main.ts` to register router**

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import App from "./App.vue";
import { router } from "./router";

const vuetify = createVuetify({
  components,
  directives,
  theme: { defaultTheme: "light" },
});

createApp(App).use(createPinia()).use(vuetify).use(router).mount("#app");
```

- [ ] **Step 3: Update `src/App.vue`**

```vue
<script setup lang="ts"></script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>
```

- [ ] **Step 4: Create stub pages so imports resolve**

Create the following files with placeholder content:

`src/pages/NotFoundPage.vue`:
```vue
<template>
  <v-container>
    <v-card class="pa-8 text-center">
      <h2>404 — Không tìm thấy trang</h2>
      <router-link to="/">Về trang chính</router-link>
    </v-card>
  </v-container>
</template>
```

Create stub files (each with `<template><div>Coming soon</div></template>` placeholder) for:
- `src/pages/admin/LoginPage.vue`
- `src/pages/admin/DashboardPage.vue`
- `src/pages/admin/ClassListPage.vue`
- `src/pages/admin/ClassDetailPage.vue`
- `src/pages/admin/AttendanceEntryPage.vue`
- `src/pages/admin/StudentDetailPage.vue`
- `src/pages/admin/BillingOverviewPage.vue`
- `src/pages/parent/ParentHomePage.vue`
- `src/pages/parent/ParentSchedulePage.vue`
- `src/pages/parent/ParentAttendancePage.vue`
- `src/pages/parent/ParentInvoicePage.vue`
- `src/layouts/AdminLayout.vue`
- `src/layouts/ParentLayout.vue`

Stub template:
```vue
<template>
  <div>Coming soon</div>
</template>
```

(Layouts should be `<template><router-view /></template>` so children render.)

- [ ] **Step 5: Verify dev server boots**

```bash
npm run dev
```
Expected: navigate to `http://localhost:5173/` and see the dashboard stub (after login redirect). Stop with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(router): routes for admin + parent areas, guards, lazy-loaded stubs"
```

---

### Task 6.2 — Shared layouts

**Files:**
- Modify: `src/layouts/AdminLayout.vue`, `src/layouts/ParentLayout.vue`

- [ ] **Step 1: Write `src/layouts/AdminLayout.vue`**

```vue
<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const router = useRouter();
const auth = useAuthStore();
const config = useConfigStore();

async function logout(): Promise<void> {
  await auth.signOut();
  await router.push({ name: "admin-login" });
}
</script>

<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list density="compact" nav>
        <v-list-item title="Tổng quan" to="/admin" exact prepend-icon="mdi-view-dashboard" />
        <v-list-item title="Lớp học" to="/admin/classes" prepend-icon="mdi-google-classroom" />
        <v-list-item title="Học phí" to="/admin/billing" prepend-icon="mdi-cash-multiple" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat color="surface">
      <v-app-bar-title>Quản lý điểm danh</v-app-bar-title>
      <v-spacer />
      <span v-if="config.config" class="mr-3 text-body-2">{{ config.config.teacherName }}</span>
      <v-btn icon="mdi-logout" variant="text" @click="logout" />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
```

- [ ] **Step 2: Write `src/layouts/ParentLayout.vue`**

```vue
<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useParentStore } from "@/stores/useParentStore";

const props = defineProps<{ token: string }>();
const route = useRoute();
const router = useRouter();
const parent = useParentStore();

async function load(): Promise<void> {
  try {
    await parent.loadByToken(props.token);
  } catch {
    await router.replace("/404");
  }
}

onMounted(load);
watch(() => props.token, load);

const links = [
  { to: "", title: "Tổng quan", icon: "mdi-home" },
  { to: "schedule", title: "Lịch học", icon: "mdi-calendar" },
  { to: "attendance", title: "Điểm danh", icon: "mdi-clipboard-check" },
];

function navTo(suffix: string): string {
  return `/p/${props.token}${suffix ? "/" + suffix : ""}`;
}

void route;
</script>

<template>
  <v-app>
    <v-app-bar flat color="primary" density="comfortable">
      <v-app-bar-title>
        <template v-if="parent.student">
          {{ parent.student.name }}
          <span v-if="parent.cls" class="text-caption ml-2">{{ parent.cls.name }}</span>
        </template>
        <template v-else>Đang tải...</template>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pb-16">
        <v-progress-linear v-if="parent.loading" indeterminate />
        <v-alert v-else-if="parent.error" type="error">{{ parent.error }}</v-alert>
        <router-view v-else />
      </v-container>
    </v-main>

    <v-bottom-navigation grow>
      <v-btn v-for="l in links" :key="l.to" :to="navTo(l.to)" :prepend-icon="l.icon">
        {{ l.title }}
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(layouts): AdminLayout + ParentLayout (Vuetify nav patterns)"
```

---

### Task 6.3 — Shared components

**Files:**
- Create: `src/components/MoneyText.vue`, `src/components/MonthPicker.vue`, `src/components/AttendanceStatusBadge.vue`, `src/components/ConfirmDialog.vue`, `src/components/EmptyState.vue`, `src/components/ParentLinkCard.vue`

- [ ] **Step 1: `src/components/MoneyText.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { formatVnd } from "@/lib/dates";
const props = defineProps<{ value: number }>();
const text = computed(() => formatVnd(props.value));
</script>

<template>
  <span>{{ text }}</span>
</template>
```

- [ ] **Step 2: `src/components/MonthPicker.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ modelValue: string }>(); // "YYYY-MM"
const emit = defineEmits<{ "update:modelValue": [string] }>();

function shift(delta: number): void {
  const [y, m] = props.modelValue.split("-").map(Number) as [number, number];
  let ny = y;
  let nm = m + delta;
  while (nm < 1) { nm += 12; ny -= 1; }
  while (nm > 12) { nm -= 12; ny += 1; }
  emit("update:modelValue", `${ny}-${String(nm).padStart(2, "0")}`);
}

const label = computed(() => {
  const [y, m] = props.modelValue.split("-");
  return `Tháng ${m}/${y}`;
});
</script>

<template>
  <div class="d-flex align-center ga-2">
    <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="shift(-1)" />
    <span class="text-body-1 font-weight-medium">{{ label }}</span>
    <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="shift(1)" />
  </div>
</template>
```

- [ ] **Step 3: `src/components/AttendanceStatusBadge.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { AttendanceStatus } from "@/types";

const props = defineProps<{ status: "unmarked" | AttendanceStatus }>();

const map: Record<typeof props.status, { color: string; label: string; icon: string }> = {
  unmarked: { color: "grey", label: "Chưa điểm danh", icon: "mdi-help-circle-outline" },
  present:  { color: "success", label: "Có đi học",       icon: "mdi-check-circle" },
  excused:  { color: "info",    label: "Vắng có phép",    icon: "mdi-account-clock" },
  absent:   { color: "error",   label: "Vắng không phép", icon: "mdi-close-circle" },
};
const cfg = computed(() => map[props.status]);
</script>

<template>
  <v-chip :color="cfg.color" :prepend-icon="cfg.icon" size="small" variant="tonal">
    {{ cfg.label }}
  </v-chip>
</template>
```

- [ ] **Step 4: `src/components/ConfirmDialog.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  confirm: [];
}>();

function close(): void {
  emit("update:modelValue", false);
}
function confirm(): void {
  emit("confirm");
  close();
}
void props;
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="close">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ cancelText ?? "Huỷ" }}</v-btn>
        <v-btn
          :color="destructive ? 'error' : 'primary'"
          variant="flat"
          @click="confirm"
        >
          {{ confirmText ?? "Xác nhận" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

- [ ] **Step 5: `src/components/EmptyState.vue`**

```vue
<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; icon?: string }>();
</script>

<template>
  <div class="d-flex flex-column align-center justify-center pa-10 text-center text-medium-emphasis">
    <v-icon :icon="icon ?? 'mdi-information-outline'" size="48" class="mb-3" />
    <div class="text-h6">{{ title }}</div>
    <div v-if="subtitle" class="text-body-2 mt-1">{{ subtitle }}</div>
    <slot />
  </div>
</template>
```

- [ ] **Step 6: `src/components/ParentLinkCard.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { parentLinkUrl } from "@/services/parentLinkUrl";

const props = defineProps<{ token: string }>();
const url = computed(() => parentLinkUrl(props.token));
const copied = ref(false);

async function copy(): Promise<void> {
  await navigator.clipboard.writeText(url.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="text-body-1">Link cho phụ huynh</v-card-title>
    <v-card-text>
      <v-text-field :model-value="url" readonly variant="outlined" density="compact" hide-details />
    </v-card-text>
    <v-card-actions>
      <v-btn prepend-icon="mdi-content-copy" :color="copied ? 'success' : 'primary'" @click="copy">
        {{ copied ? "Đã copy" : "Copy link" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
```

- [ ] **Step 7: Verify typecheck + dev**

```bash
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(components): shared UI (Money, MonthPicker, StatusBadge, Confirm, Empty, ParentLink)"
```

---

## Phase 7 — Admin UI

### Task 7.1 — Admin login page + bootstrap flow

**Files:**
- Modify: `src/pages/admin/LoginPage.vue`

- [ ] **Step 1: Implement LoginPage**

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfigStore } from "@/stores/useConfigStore";

const auth = useAuthStore();
const config = useConfigStore();
const router = useRouter();
const route = useRoute();
const error = ref<string | null>(null);
const loading = ref(false);

const unauthorized = computed(() => route.query.unauthorized === "1");

onMounted(async () => {
  await config.load().catch(() => {/* ignore */});
  if (auth.isSignedIn && config.isCurrentUserTeacher) {
    await router.replace({ name: "admin-dashboard" });
  }
});

async function signIn(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    await auth.signIn();
    await config.load();
    if (!config.isBootstrapped) {
      await config.bootstrap();
    }
    if (config.isCurrentUserTeacher) {
      await router.replace({ name: "admin-dashboard" });
    } else {
      error.value = "Tài khoản này không có quyền truy cập.";
      await auth.signOut();
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" no-gutters style="min-height: 100vh">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-6">
          <v-card-title class="text-h5 text-center">Quản lý điểm danh</v-card-title>
          <v-card-text>
            <v-alert v-if="unauthorized" type="warning" class="mb-3">
              Tài khoản hiện tại không có quyền truy cập.
            </v-alert>
            <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
            <p class="text-body-2 mb-4">
              Đăng nhập bằng tài khoản Google của giáo viên để bắt đầu.
            </p>
            <v-btn
              block
              color="primary"
              size="large"
              prepend-icon="mdi-google"
              :loading="loading"
              @click="signIn"
            >
              Đăng nhập với Google
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
```

- [ ] **Step 2: Verify typecheck + manual smoke (skip actual login until Firebase project set up)**

```bash
npm run typecheck
npm run dev
```
Expected: visiting `/admin/login` shows the card.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): LoginPage with Google sign-in + bootstrap flow"
```

---

### Task 7.2 — Class list + form

**Files:**
- Modify: `src/pages/admin/ClassListPage.vue`
- Create: `src/components/ClassScheduleForm.vue`, `src/components/RateHistoryEditor.vue`, `src/components/ClassFormDialog.vue`

- [ ] **Step 1: Implement `ClassScheduleForm.vue` (weekly picker)**

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { DayKey, WeeklySchedule } from "@/types";

const props = defineProps<{ modelValue: WeeklySchedule }>();
const emit = defineEmits<{ "update:modelValue": [WeeklySchedule] }>();

const days: { key: DayKey; label: string }[] = [
  { key: "mon", label: "T2" }, { key: "tue", label: "T3" }, { key: "wed", label: "T4" },
  { key: "thu", label: "T5" }, { key: "fri", label: "T6" }, { key: "sat", label: "T7" },
  { key: "sun", label: "CN" },
];

const local = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function toggle(key: DayKey): void {
  const copy = { ...local.value };
  if (copy[key]) delete copy[key];
  else copy[key] = { start: "18:00", end: "19:30" };
  local.value = copy;
}

function update(key: DayKey, field: "start" | "end", value: string): void {
  const cur = local.value[key];
  if (!cur) return;
  local.value = { ...local.value, [key]: { ...cur, [field]: value } };
}
</script>

<template>
  <v-row dense>
    <v-col v-for="d in days" :key="d.key" cols="12" sm="6">
      <v-card variant="outlined" class="pa-3">
        <div class="d-flex align-center mb-2">
          <v-checkbox-btn :model-value="!!local[d.key]" @update:model-value="toggle(d.key)" />
          <span class="text-body-1 font-weight-medium ml-1">{{ d.label }}</span>
        </div>
        <v-row dense v-if="local[d.key]">
          <v-col cols="6">
            <v-text-field
              :model-value="local[d.key]!.start"
              label="Bắt đầu"
              type="time"
              density="compact"
              hide-details
              @update:model-value="update(d.key, 'start', $event)"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              :model-value="local[d.key]!.end"
              label="Kết thúc"
              type="time"
              density="compact"
              hide-details
              @update:model-value="update(d.key, 'end', $event)"
            />
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>
```

- [ ] **Step 2: Implement `RateHistoryEditor.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { RateEntry } from "@/types";
import { formatVnDate } from "@/lib/dates";

const props = defineProps<{ modelValue: RateEntry[] }>();
const emit = defineEmits<{ "update:modelValue": [RateEntry[]] }>();

const sorted = computed(() =>
  [...props.modelValue].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1)),
);

function add(): void {
  const today = new Date().toISOString().slice(0, 10);
  emit("update:modelValue", [...props.modelValue, { effectiveFrom: today, rate: 150_000 }]);
}

function remove(idx: number): void {
  const out = props.modelValue.filter((_, i) => i !== idx);
  if (out.length === 0) return; // must have at least 1
  emit("update:modelValue", out);
}

function update(idx: number, patch: Partial<RateEntry>): void {
  const out = props.modelValue.map((e, i) => (i === idx ? { ...e, ...patch } : e));
  emit("update:modelValue", out);
}
</script>

<template>
  <div>
    <div v-for="(entry, idx) in sorted" :key="idx" class="d-flex align-center ga-2 mb-2">
      <v-text-field
        :model-value="entry.effectiveFrom"
        label="Áp dụng từ"
        type="date"
        density="compact"
        hide-details
        @update:model-value="update(props.modelValue.indexOf(entry), { effectiveFrom: $event })"
      />
      <v-text-field
        :model-value="entry.rate"
        label="Đơn giá (đ)"
        type="number"
        min="0"
        density="compact"
        hide-details
        @update:model-value="update(props.modelValue.indexOf(entry), { rate: Number($event) })"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        :disabled="props.modelValue.length === 1"
        @click="remove(props.modelValue.indexOf(entry))"
      />
    </div>
    <v-btn prepend-icon="mdi-plus" variant="tonal" size="small" @click="add">
      Thêm thay đổi giá
    </v-btn>
    <p class="text-caption mt-2 text-medium-emphasis">
      Buổi học ngày D dùng đơn giá có "Áp dụng từ" ≤ D mới nhất.
    </p>
    <p v-if="sorted[0]" class="text-caption">
      Hiện tại (từ {{ formatVnDate(sorted[0]!.effectiveFrom) }}):
      <strong>{{ sorted[0]!.rate.toLocaleString("vi-VN") }} đ/buổi</strong>
    </p>
  </div>
</template>
```

- [ ] **Step 3: Implement `ClassFormDialog.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { Class } from "@/types";
import ClassScheduleForm from "./ClassScheduleForm.vue";
import RateHistoryEditor from "./RateHistoryEditor.vue";

const props = defineProps<{
  modelValue: boolean;
  initial?: Partial<Class>;
  title: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  submit: [Omit<Class, "id">];
}>();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Bắt buộc"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
);

const { defineField, handleSubmit, resetForm, errors } = useForm({ validationSchema: schema });
const [name, nameAttrs] = defineField("name");
const [startDate, startAttrs] = defineField("startDate");
const [endDate, endAttrs] = defineField("endDate");

const weekly = ref(props.initial?.weeklySchedule ?? {});
const rateHistory = ref(props.initial?.rateHistory ?? [{ effectiveFrom: new Date().toISOString().slice(0, 10), rate: 150_000 }]);
const excludedDates = ref<string[]>(props.initial?.excludedDates ?? []);
const addedDates = ref(props.initial?.addedDates ?? []);
const status = ref(props.initial?.status ?? "active");

watch(() => props.modelValue, (v) => {
  if (v) {
    resetForm({ values: { name: props.initial?.name ?? "", startDate: props.initial?.startDate ?? "", endDate: props.initial?.endDate ?? "" } });
    weekly.value = props.initial?.weeklySchedule ?? {};
    rateHistory.value = props.initial?.rateHistory ?? [{ effectiveFrom: new Date().toISOString().slice(0, 10), rate: 150_000 }];
    excludedDates.value = props.initial?.excludedDates ?? [];
    addedDates.value = props.initial?.addedDates ?? [];
    status.value = props.initial?.status ?? "active";
  }
});

const submit = handleSubmit((values) => {
  emit("submit", {
    name: values.name,
    startDate: values.startDate,
    endDate: values.endDate,
    weeklySchedule: weekly.value,
    rateHistory: rateHistory.value,
    excludedDates: excludedDates.value,
    addedDates: addedDates.value,
    status: status.value,
  });
  emit("update:modelValue", false);
});

void errors;
void nameAttrs; void startAttrs; void endAttrs;
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="800" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="name" label="Tên lớp" v-bind="nameAttrs" />
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="startDate" label="Ngày bắt đầu" type="date" v-bind="startAttrs" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="endDate" label="Ngày kết thúc" type="date" v-bind="endAttrs" />
            </v-col>
          </v-row>
          <p class="text-subtitle-2 mt-4">Lịch tuần</p>
          <ClassScheduleForm v-model="weekly" />
          <p class="text-subtitle-2 mt-4">Đơn giá theo thời gian</p>
          <RateHistoryEditor v-model="rateHistory" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Huỷ</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Lưu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

- [ ] **Step 4: Implement `ClassListPage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import type { Class } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import { formatVnDate, formatVnd } from "@/lib/dates";

const store = useClassesStore();
const router = useRouter();
const items = ref<Class[]>([]);
const showForm = ref(false);

async function reload(): Promise<void> {
  items.value = await store.list("active");
}

onMounted(reload);

function dayLabels(c: Class): string {
  const keys = Object.keys(c.weeklySchedule);
  const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const labels: Record<string, string> = { mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN" };
  return keys.sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((k) => labels[k]!).join(", ");
}

function currentRate(c: Class): number {
  return [...c.rateHistory].sort((a, b) => (a.effectiveFrom > b.effectiveFrom ? -1 : 1))[0]?.rate ?? 0;
}

async function onSubmit(data: Omit<Class, "id">): Promise<void> {
  const id = crypto.randomUUID();
  await store.create(id, data);
  await reload();
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">Lớp học</h2>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showForm = true">Thêm lớp</v-btn>
    </div>

    <EmptyState
      v-if="items.length === 0"
      title="Chưa có lớp nào"
      subtitle="Bấm 'Thêm lớp' để tạo lớp đầu tiên"
      icon="mdi-google-classroom"
    />

    <v-data-table
      v-else
      :headers="[
        { title: 'Tên', key: 'name' },
        { title: 'Bắt đầu', key: 'startDate' },
        { title: 'Kết thúc', key: 'endDate' },
        { title: 'Lịch tuần', key: 'days' },
        { title: 'Đơn giá', key: 'rate' },
        { title: '', key: 'actions', sortable: false },
      ]"
      :items="items"
      density="comfortable"
    >
      <template #item.startDate="{ item }">{{ formatVnDate(item.startDate) }}</template>
      <template #item.endDate="{ item }">{{ formatVnDate(item.endDate) }}</template>
      <template #item.days="{ item }">{{ dayLabels(item) }}</template>
      <template #item.rate="{ item }">{{ formatVnd(currentRate(item)) }}</template>
      <template #item.actions="{ item }">
        <v-btn variant="text" size="small" @click="router.push({ name: 'admin-class-detail', params: { classId: item.id } })">
          Chi tiết
        </v-btn>
      </template>
    </v-data-table>

    <ClassFormDialog v-model="showForm" title="Thêm lớp mới" @submit="onSubmit" />
  </div>
</template>
```

- [ ] **Step 5: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(admin): class list + class form (weekly schedule + rate history editor)"
```

---

### Task 7.3 — Class detail page (3 tabs: Info / Schedule / Students)

**Files:**
- Modify: `src/pages/admin/ClassDetailPage.vue`
- Create: `src/components/StudentFormDialog.vue`

- [ ] **Step 1: Write `StudentFormDialog.vue`**

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { Student } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  initial?: Partial<Student>;
  classStartDate: string;
  title: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [boolean];
  submit: [Omit<Student, "id" | "parentLinkToken">];
}>();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Bắt buộc"),
    parentPhone: z.string().min(0),
  }),
);
const { defineField, handleSubmit, resetForm } = useForm({ validationSchema: schema });
const [name, nameAttrs] = defineField("name");
const [parentPhone, parentPhoneAttrs] = defineField("parentPhone");

const dob = ref<string>("");
const parentName = ref<string>("");
const startDate = ref<string>(props.classStartDate);
const endDate = ref<string>("");
const notes = ref<string>("");

watch(() => props.modelValue, (v) => {
  if (v) {
    resetForm({ values: { name: props.initial?.name ?? "", parentPhone: props.initial?.parentPhone ?? "" } });
    dob.value = props.initial?.dob ?? "";
    parentName.value = props.initial?.parentName ?? "";
    startDate.value = props.initial?.startDate ?? props.classStartDate;
    endDate.value = props.initial?.endDate ?? "";
    notes.value = props.initial?.notes ?? "";
  }
});

const submit = handleSubmit((values) => {
  emit("submit", {
    classId: props.initial?.classId ?? "",
    name: values.name,
    dob: dob.value || null,
    parentName: parentName.value,
    parentPhone: values.parentPhone,
    startDate: startDate.value,
    endDate: endDate.value || null,
    notes: notes.value,
    status: props.initial?.status ?? "active",
  });
  emit("update:modelValue", false);
});

void nameAttrs; void parentPhoneAttrs;
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="name" label="Họ tên" v-bind="nameAttrs" />
          <v-text-field v-model="dob" label="Ngày sinh" type="date" />
          <v-text-field v-model="parentName" label="Tên phụ huynh" />
          <v-text-field v-model="parentPhone" label="SĐT phụ huynh" v-bind="parentPhoneAttrs" />
          <v-text-field v-model="startDate" label="Ngày bắt đầu học" type="date" />
          <v-text-field v-model="endDate" label="Ngày nghỉ (nếu có)" type="date" />
          <v-textarea v-model="notes" label="Ghi chú" rows="2" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Huỷ</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Lưu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

- [ ] **Step 2: Write `ClassDetailPage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import type { Class, Student } from "@/types";
import ClassFormDialog from "@/components/ClassFormDialog.vue";
import StudentFormDialog from "@/components/StudentFormDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import EmptyState from "@/components/EmptyState.vue";
import ParentLinkCard from "@/components/ParentLinkCard.vue";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { formatVnDate, monthOf, monthStart, monthEnd, todayISO } from "@/lib/dates";

const props = defineProps<{ classId: string }>();
const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const cls = ref<Class | null>(null);
const studentList = ref<Student[]>([]);
const tab = ref<"info" | "schedule" | "students">("info");
const showClassForm = ref(false);
const showStudentForm = ref(false);
const editingStudent = ref<Student | null>(null);
const confirmDelete = ref<{ open: boolean; student: Student | null }>({ open: false, student: null });
const showLinkFor = ref<string | null>(null);
const month = ref(monthOf(todayISO()));

async function reload(): Promise<void> {
  cls.value = await classes.get(props.classId);
  if (cls.value) {
    studentList.value = await students.listByClass(props.classId, "active");
  }
}

onMounted(reload);

const sessions = computed(() => {
  if (!cls.value) return [];
  return expandSchedule({
    cls: cls.value,
    from: monthStart(month.value),
    to: monthEnd(month.value),
  });
});

async function onClassSubmit(data: Omit<Class, "id">): Promise<void> {
  await classes.update(props.classId, data);
  await reload();
}

async function onStudentSubmit(data: Omit<Student, "id" | "parentLinkToken">): Promise<void> {
  if (editingStudent.value) {
    await students.update(editingStudent.value.id, { ...data, classId: props.classId });
  } else {
    const id = crypto.randomUUID();
    await students.create(id, { ...data, classId: props.classId });
  }
  editingStudent.value = null;
  await reload();
}

async function doDelete(): Promise<void> {
  if (!confirmDelete.value.student) return;
  await students.remove(confirmDelete.value.student.id);
  confirmDelete.value = { open: false, student: null };
  await reload();
}

function openEdit(s: Student): void {
  editingStudent.value = s;
  showStudentForm.value = true;
}

function gotoAttendance(date: string): void {
  router.push({ name: "admin-attendance", params: { classId: props.classId, date } });
}

function toggleExcluded(date: string): void {
  if (!cls.value) return;
  const set = new Set(cls.value.excludedDates);
  if (set.has(date)) set.delete(date);
  else set.add(date);
  classes.update(props.classId, { excludedDates: Array.from(set).sort() }).then(reload);
}
</script>

<template>
  <div v-if="cls">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">{{ cls.name }}</h2>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-pencil" @click="showClassForm = true">Sửa lớp</v-btn>
    </div>

    <v-tabs v-model="tab" color="primary">
      <v-tab value="info">Thông tin</v-tab>
      <v-tab value="schedule">Lịch học</v-tab>
      <v-tab value="students">Học sinh ({{ studentList.length }})</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-4">
      <v-window-item value="info">
        <v-card class="pa-4">
          <p><strong>Thời gian:</strong> {{ formatVnDate(cls.startDate) }} – {{ formatVnDate(cls.endDate) }}</p>
          <p><strong>Đơn giá hiện tại:</strong>
            {{ [...cls.rateHistory].sort((a,b)=>a.effectiveFrom>b.effectiveFrom?-1:1)[0]?.rate.toLocaleString("vi-VN") }} đ/buổi
          </p>
        </v-card>
      </v-window-item>

      <v-window-item value="schedule">
        <div class="d-flex align-center mb-3">
          <strong>Tháng:</strong>
          <v-text-field v-model="month" type="month" density="compact" hide-details class="ml-2" style="max-width: 180px;" />
        </div>
        <v-list>
          <v-list-item
            v-for="s in sessions"
            :key="s.date"
            :title="`${formatVnDate(s.date)} (${s.start}–${s.end})`"
            :subtitle="s.source === 'added' ? 'Buổi thêm bù' : ''"
          >
            <template #append>
              <v-btn size="small" variant="text" @click="gotoAttendance(s.date)">Điểm danh</v-btn>
            </template>
          </v-list-item>
        </v-list>
        <p class="text-caption mt-2 text-medium-emphasis">
          Mở rộng: bấm vào ngày để toggle loại trừ (chưa cài đặt giao diện rich — dùng RateHistoryEditor pattern khi cần).
        </p>
      </v-window-item>

      <v-window-item value="students">
        <div class="d-flex align-center mb-3">
          <v-spacer />
          <v-btn color="primary" prepend-icon="mdi-plus" @click="editingStudent = null; showStudentForm = true">
            Thêm học sinh
          </v-btn>
        </div>
        <EmptyState v-if="studentList.length === 0" title="Chưa có học sinh" icon="mdi-account-multiple" />
        <v-list v-else>
          <v-list-item
            v-for="s in studentList"
            :key="s.id"
            :title="s.name"
            :subtitle="`SĐT phụ huynh: ${s.parentPhone || '—'}`"
            @click="router.push({ name: 'admin-student-detail', params: { studentId: s.id } })"
          >
            <template #append>
              <v-btn icon="mdi-link" variant="text" size="small" @click.stop="showLinkFor = s.parentLinkToken" />
              <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="openEdit(s)" />
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="confirmDelete = { open: true, student: s }" />
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>
    </v-window>

    <ClassFormDialog v-model="showClassForm" :initial="cls" title="Sửa lớp" @submit="onClassSubmit" />
    <StudentFormDialog
      v-model="showStudentForm"
      :initial="editingStudent ?? undefined"
      :class-start-date="cls.startDate"
      :title="editingStudent ? 'Sửa học sinh' : 'Thêm học sinh'"
      @submit="onStudentSubmit"
    />
    <ConfirmDialog
      v-model="confirmDelete.open"
      title="Xoá học sinh?"
      :message="`Xoá ${confirmDelete.student?.name ?? ''}? Toàn bộ điểm danh & thanh toán sẽ bị xoá.`"
      destructive
      @confirm="doDelete"
    />
    <v-dialog :model-value="!!showLinkFor" @update:model-value="showLinkFor = null">
      <ParentLinkCard v-if="showLinkFor" :token="showLinkFor" />
    </v-dialog>
  </div>
</template>
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): class detail tabs (info / schedule / students) + student form"
```

---

### Task 7.4 — Attendance entry page

**Files:**
- Modify: `src/pages/admin/AttendanceEntryPage.vue`

- [ ] **Step 1: Implement attendance page**

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { AttendanceStatus, Class, Student } from "@/types";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { formatVnDate, monthOf, monthStart, monthEnd, addDays } from "@/lib/dates";

const props = defineProps<{ classId: string; date: string }>();
const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const cls = ref<Class | null>(null);
const list = ref<Student[]>([]);
const status = ref<Record<string, "unmarked" | AttendanceStatus>>({});
const notes = ref<Record<string, string>>({});
const saving = ref(false);
const unsubs: (() => void)[] = [];

async function reload(): Promise<void> {
  cls.value = await classes.get(props.classId);
  if (!cls.value) return;
  list.value = await students.listByClass(props.classId, "active");

  // Cleanup old subs
  unsubs.forEach((u) => u());
  unsubs.length = 0;

  const ym = monthOf(props.date);
  for (const s of list.value) {
    const unsub = months.subscribe(s.id, ym, (doc) => {
      status.value = { ...status.value, [s.id]: doc?.attendance?.[props.date]?.status ?? "unmarked" };
      notes.value = { ...notes.value, [s.id]: doc?.attendance?.[props.date]?.note ?? "" };
    });
    unsubs.push(unsub);
  }
}

onMounted(reload);
onBeforeUnmount(() => unsubs.forEach((u) => u()));

const session = computed(() => {
  if (!cls.value) return null;
  const all = expandSchedule({ cls: cls.value, from: monthStart(monthOf(props.date)), to: monthEnd(monthOf(props.date)) });
  return all.find((s) => s.date === props.date) ?? null;
});

const markedCount = computed(() => Object.values(status.value).filter((v) => v !== "unmarked").length);

async function saveAll(): Promise<void> {
  saving.value = true;
  try {
    const marks = list.value
      .filter((s) => status.value[s.id] && status.value[s.id] !== "unmarked")
      .map((s) => ({
        studentId: s.id,
        status: status.value[s.id] as AttendanceStatus,
        note: notes.value[s.id] || undefined,
      }));
    await months.markAttendanceBatch(props.classId, props.date, marks);
  } finally {
    saving.value = false;
  }
}

function shiftDate(delta: number): void {
  router.replace({ name: "admin-attendance", params: { classId: props.classId, date: addDays(props.date, delta) } });
}
</script>

<template>
  <div v-if="cls && session">
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">{{ cls.name }}</h2>
      <v-spacer />
      <v-btn variant="text" prepend-icon="mdi-chevron-left" @click="shiftDate(-1)">Hôm trước</v-btn>
      <v-btn variant="text" append-icon="mdi-chevron-right" @click="shiftDate(1)">Hôm sau</v-btn>
    </div>
    <p class="text-body-1">{{ formatVnDate(date) }} — {{ session.start }} đến {{ session.end }}</p>
    <p class="text-caption mb-4">Đã điểm danh: {{ markedCount }}/{{ list.length }}</p>

    <v-list>
      <v-list-item v-for="s in list" :key="s.id" :title="s.name">
        <template #append>
          <v-btn-toggle
            v-model="status[s.id]"
            color="primary"
            mandatory="force"
            density="comfortable"
            class="mr-2"
          >
            <v-btn value="present" color="success">Có</v-btn>
            <v-btn value="excused" color="info">Có phép</v-btn>
            <v-btn value="absent" color="error">Không phép</v-btn>
          </v-btn-toggle>
          <v-text-field
            v-model="notes[s.id]"
            placeholder="Ghi chú"
            density="compact"
            hide-details
            style="width: 180px;"
          />
        </template>
      </v-list-item>
    </v-list>

    <div class="d-flex justify-end mt-4">
      <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="saveAll">
        Lưu tất cả
      </v-btn>
    </div>
  </div>
  <v-alert v-else type="info">Đang tải buổi học, hoặc ngày này không có buổi.</v-alert>
</template>
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): AttendanceEntryPage with realtime per-student listener + batch save"
```

---

### Task 7.5 — Student detail page

**Files:**
- Modify: `src/pages/admin/StudentDetailPage.vue`

- [ ] **Step 1: Implement student detail**

```vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, MonthDoc, Student } from "@/types";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO } from "@/lib/dates";
import ParentLinkCard from "@/components/ParentLinkCard.vue";
import MonthPicker from "@/components/MonthPicker.vue";
import MoneyText from "@/components/MoneyText.vue";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge.vue";
import { parentInvoiceUrl } from "@/services/parentLinkUrl";

const props = defineProps<{ studentId: string }>();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const student = ref<Student | null>(null);
const cls = ref<Class | null>(null);
const month = ref(monthOf(todayISO()));
const monthDoc = ref<MonthDoc | null>(null);
const tab = ref<"schedule" | "billing">("schedule");

async function reload(): Promise<void> {
  student.value = await students.get(props.studentId);
  if (student.value) {
    cls.value = await classes.get(student.value.classId);
  }
}
onMounted(reload);

watch(month, async () => {
  if (!student.value) return;
  monthDoc.value = await months.get(student.value.id, month.value, false);
});

watch(student, async () => {
  if (student.value) monthDoc.value = await months.get(student.value.id, month.value, false);
});

const result = computed(() => {
  if (!student.value || !cls.value) return null;
  return computeMonth({ cls: cls.value, student: student.value, monthDoc: monthDoc.value, yearMonth: month.value });
});

const invoiceUrl = computed(() =>
  student.value ? parentInvoiceUrl(student.value.parentLinkToken, month.value) : "",
);

async function markPaid(): Promise<void> {
  if (!student.value || !result.value) return;
  await months.markPaid(student.value.id, month.value, result.value.totals.confirmedAmount);
  monthDoc.value = await months.get(student.value.id, month.value, false);
}

async function unmarkPaid(): Promise<void> {
  if (!student.value) return;
  await months.unmarkPaid(student.value.id, month.value);
  monthDoc.value = await months.get(student.value.id, month.value, false);
}
</script>

<template>
  <div v-if="student && cls">
    <h2 class="text-h5 mb-2">{{ student.name }}</h2>
    <p class="text-body-2 mb-4 text-medium-emphasis">Lớp: {{ cls.name }}</p>

    <v-row>
      <v-col cols="12" md="4">
        <ParentLinkCard :token="student.parentLinkToken" />
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <MonthPicker v-model="month" />
            <v-spacer />
            <v-btn-toggle v-model="tab" mandatory="force" density="comfortable">
              <v-btn value="schedule">Lịch & điểm danh</v-btn>
              <v-btn value="billing">Học phí</v-btn>
            </v-btn-toggle>
          </div>

          <v-divider class="my-3" />

          <template v-if="tab === 'schedule' && result">
            <v-list density="compact">
              <v-list-item v-for="s in result.sessions" :key="s.date">
                <v-list-item-title>{{ s.date }} ({{ s.start }}–{{ s.end }})</v-list-item-title>
                <template #append>
                  <AttendanceStatusBadge :status="s.status" />
                </template>
              </v-list-item>
            </v-list>
          </template>

          <template v-else-if="tab === 'billing' && result">
            <p>Buổi đã marked: {{ result.totals.sessionCount - result.totals.unmarked }}/{{ result.totals.sessionCount }}</p>
            <p>Confirmed: <MoneyText :value="result.totals.confirmedAmount" /></p>
            <p>Projected: <MoneyText :value="result.totals.projectedAmount" /></p>
            <v-alert v-for="(w, i) in result.warnings" :key="i" type="warning" class="my-2">{{ w }}</v-alert>

            <div class="d-flex align-center mt-4">
              <v-chip :color="result.paymentStatus === 'paid' ? 'success' : 'warning'">
                {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
              </v-chip>
              <v-spacer />
              <v-btn v-if="result.paymentStatus === 'unpaid'" color="primary" @click="markPaid">
                Đánh dấu đã thu
              </v-btn>
              <v-btn v-else variant="text" color="error" @click="unmarkPaid">Bỏ đánh dấu</v-btn>
            </div>

            <v-divider class="my-3" />
            <p class="text-body-2">Link hoá đơn (gửi phụ huynh):</p>
            <v-text-field :model-value="invoiceUrl" readonly density="compact" hide-details />
          </template>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(admin): StudentDetailPage with schedule/billing tabs + mark-paid"
```

---

### Task 7.6 — Billing overview + Dashboard

**Files:**
- Modify: `src/pages/admin/BillingOverviewPage.vue`, `src/pages/admin/DashboardPage.vue`

- [ ] **Step 1: Implement `BillingOverviewPage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, Student } from "@/types";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO } from "@/lib/dates";
import MonthPicker from "@/components/MonthPicker.vue";
import MoneyText from "@/components/MoneyText.vue";

const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const month = ref(monthOf(todayISO()));
const rows = ref<{ student: Student; cls: Class; confirmed: number; status: "paid" | "unpaid" }[]>([]);
const loading = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  rows.value = [];
  try {
    const clsList = await classes.list("active");
    for (const cls of clsList) {
      const stuList = await students.listByClass(cls.id, "active");
      for (const stu of stuList) {
        const md = await months.get(stu.id, month.value, false);
        const r = computeMonth({ cls, student: stu, monthDoc: md, yearMonth: month.value });
        rows.value.push({ student: stu, cls, confirmed: r.totals.confirmedAmount, status: r.paymentStatus });
      }
    }
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(month, load);
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">Học phí</h2>
      <v-spacer />
      <MonthPicker v-model="month" />
    </div>

    <v-progress-linear v-if="loading" indeterminate />
    <v-data-table
      v-else
      :headers="[
        { title: 'Học sinh', key: 'name' },
        { title: 'Lớp', key: 'className' },
        { title: 'Confirmed', key: 'confirmed' },
        { title: 'Trạng thái', key: 'status' },
        { title: '', key: 'actions', sortable: false },
      ]"
      :items="rows.map((r) => ({ id: r.student.id, name: r.student.name, className: r.cls.name, confirmed: r.confirmed, status: r.status }))"
    >
      <template #item.confirmed="{ item }">
        <MoneyText :value="item.confirmed" />
      </template>
      <template #item.status="{ item }">
        <v-chip :color="item.status === 'paid' ? 'success' : 'warning'" size="small">
          {{ item.status === 'paid' ? 'Đã thu' : 'Chưa thu' }}
        </v-chip>
      </template>
      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" @click="router.push({ name: 'admin-student-detail', params: { studentId: item.id } })">
          Chi tiết
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
```

- [ ] **Step 2: Implement `DashboardPage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import type { Class } from "@/types";
import { todayISO, dayKeyOf } from "@/lib/dates";

const classes = useClassesStore();
const students = useStudentsStore();
const today = todayISO();
const todayKey = dayKeyOf(today);
const classCount = ref(0);
const studentCount = ref(0);
const todaysClasses = ref<Class[]>([]);

onMounted(async () => {
  const all = await classes.list("active");
  classCount.value = all.length;
  let total = 0;
  for (const c of all) {
    const list = await students.listByClass(c.id, "active");
    total += list.length;
    if (c.weeklySchedule[todayKey] && !c.excludedDates.includes(today)) {
      todaysClasses.value.push(c);
    }
  }
  studentCount.value = total;
});
</script>

<template>
  <div>
    <h2 class="text-h5 mb-4">Tổng quan</h2>
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Số lớp đang dạy</div>
          <div class="text-h4">{{ classCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Tổng học sinh</div>
          <div class="text-h4">{{ studentCount }}</div>
        </v-card>
      </v-col>
    </v-row>

    <h3 class="text-h6 mt-6 mb-2">Buổi học hôm nay</h3>
    <v-list>
      <v-list-item
        v-for="c in todaysClasses"
        :key="c.id"
        :title="c.name"
        :to="{ name: 'admin-attendance', params: { classId: c.id, date: today } }"
      />
    </v-list>
  </div>
</template>
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(admin): BillingOverview + Dashboard"
```

---

## Phase 8 — Parent UI + deploy

### Task 8.1 — Parent home + schedule + attendance

**Files:**
- Modify: `src/pages/parent/ParentHomePage.vue`, `ParentSchedulePage.vue`, `ParentAttendancePage.vue`

- [ ] **Step 1: `ParentHomePage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate } from "@/lib/dates";
import type { MonthDoc } from "@/types";
import MoneyText from "@/components/MoneyText.vue";

const props = defineProps<{ token: string }>();
const parent = useParentStore();
const monthYM = monthOf(todayISO());
const monthDoc = ref<MonthDoc | null>(null);

onMounted(async () => {
  if (parent.student) {
    monthDoc.value = await parent.getMonth(parent.student.id, monthYM);
  }
});

const result = computed(() => {
  if (!parent.student || !parent.cls) return null;
  return computeMonth({
    cls: parent.cls,
    student: parent.student,
    monthDoc: monthDoc.value,
    yearMonth: monthYM,
  });
});

const dayLabel = computed(() => {
  if (!parent.cls) return "";
  const labels: Record<string, string> = { mon: "T2", tue: "T3", wed: "T4", thu: "T5", fri: "T6", sat: "T7", sun: "CN" };
  return Object.keys(parent.cls.weeklySchedule).map((k) => labels[k]).join(", ");
});

void props;
</script>

<template>
  <div v-if="parent.student && parent.cls">
    <v-card class="pa-4 mb-3" variant="tonal" color="primary">
      <p class="text-body-2">Học sinh</p>
      <p class="text-h5 mb-2">{{ parent.student.name }}</p>
      <p class="text-body-2">Lớp <strong>{{ parent.cls.name }}</strong></p>
      <p class="text-body-2">Lịch học: {{ dayLabel }}</p>
      <p class="text-caption text-medium-emphasis">
        {{ formatVnDate(parent.cls.startDate) }} – {{ formatVnDate(parent.cls.endDate) }}
      </p>
    </v-card>

    <v-card v-if="result" class="pa-4 mb-3">
      <p class="text-subtitle-2">Tháng này</p>
      <p>Số buổi đã học: {{ result.totals.present + result.totals.absent }}</p>
      <p>Tổng phí: <MoneyText :value="result.totals.confirmedAmount" /></p>
      <v-chip :color="result.paymentStatus === 'paid' ? 'success' : 'warning'" size="small">
        {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
      </v-chip>
    </v-card>
  </div>
</template>
```

- [ ] **Step 2: `ParentSchedulePage.vue`**

```vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { expandSchedule } from "@/composables/useScheduleCompute";
import { monthOf, todayISO, monthStart, monthEnd, formatVnDate, vnDayLabel } from "@/lib/dates";
import MonthPicker from "@/components/MonthPicker.vue";

const parent = useParentStore();
const month = ref(monthOf(todayISO()));

const sessions = computed(() => {
  if (!parent.cls || !parent.student) return [];
  return expandSchedule({
    cls: parent.cls,
    from: monthStart(month.value),
    to: monthEnd(month.value),
    studentStart: parent.student.startDate,
    studentEnd: parent.student.endDate,
  });
});

void onMounted; void watch;
</script>

<template>
  <div>
    <MonthPicker v-model="month" />
    <v-list density="comfortable" class="mt-3">
      <v-list-item
        v-for="s in sessions"
        :key="s.date"
        :title="`${vnDayLabel(s.date)}, ${formatVnDate(s.date)}`"
        :subtitle="`${s.start} – ${s.end}${s.source === 'added' ? ' (bù)' : ''}`"
      />
    </v-list>
    <v-alert v-if="sessions.length === 0" type="info" class="mt-3">
      Không có buổi học nào trong tháng này.
    </v-alert>
  </div>
</template>
```

- [ ] **Step 3: `ParentAttendancePage.vue`**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnDate } from "@/lib/dates";
import type { MonthDoc } from "@/types";
import MonthPicker from "@/components/MonthPicker.vue";
import AttendanceStatusBadge from "@/components/AttendanceStatusBadge.vue";

const parent = useParentStore();
const month = ref(monthOf(todayISO()));
const monthDoc = ref<MonthDoc | null>(null);

async function load(): Promise<void> {
  if (parent.student) monthDoc.value = await parent.getMonth(parent.student.id, month.value);
}
onMounted(load);
watch(month, load);

const result = computed(() => {
  if (!parent.cls || !parent.student) return null;
  return computeMonth({ cls: parent.cls, student: parent.student, monthDoc: monthDoc.value, yearMonth: month.value });
});
</script>

<template>
  <div>
    <MonthPicker v-model="month" />
    <v-list v-if="result" class="mt-3">
      <v-list-item v-for="s in result.sessions" :key="s.date" :title="formatVnDate(s.date)" :subtitle="`${s.start} – ${s.end}`">
        <template #append>
          <AttendanceStatusBadge :status="s.status" />
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(parent): home, schedule, attendance pages"
```

---

### Task 8.2 — Parent invoice page

**Files:**
- Modify: `src/pages/parent/ParentInvoicePage.vue`

- [ ] **Step 1: Implement invoice page**

```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useParentStore } from "@/stores/useParentStore";
import { computeMonth } from "@/composables/useBillingCompute";
import { formatVnDate, formatVnd } from "@/lib/dates";
import type { MonthDoc } from "@/types";

const props = defineProps<{ token: string; yearMonth: string }>();
const parent = useParentStore();
const monthDoc = ref<MonthDoc | null>(null);

async function load(): Promise<void> {
  if (parent.student) monthDoc.value = await parent.getMonth(parent.student.id, props.yearMonth);
}
onMounted(load);
watch(() => props.yearMonth, load);

const result = computed(() => {
  if (!parent.cls || !parent.student) return null;
  return computeMonth({ cls: parent.cls, student: parent.student, monthDoc: monthDoc.value, yearMonth: props.yearMonth });
});

const monthLabel = computed(() => {
  const [y, m] = props.yearMonth.split("-");
  return `Tháng ${m}/${y}`;
});
void props.token;
</script>

<template>
  <div v-if="parent.student && parent.cls && result">
    <v-card class="pa-4">
      <h2 class="text-h6 text-center">HOÁ ĐƠN HỌC PHÍ</h2>
      <p class="text-center text-body-2">{{ monthLabel }}</p>
      <v-divider class="my-3" />
      <p><strong>Học sinh:</strong> {{ parent.student.name }}</p>
      <p><strong>Lớp:</strong> {{ parent.cls.name }}</p>
      <v-divider class="my-3" />
      <table class="w-100">
        <thead>
          <tr>
            <th class="text-left">STT</th>
            <th class="text-left">Ngày</th>
            <th class="text-left">Giờ</th>
            <th class="text-left">Trạng thái</th>
            <th class="text-right">Đơn giá</th>
            <th class="text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in result.sessions" :key="s.date">
            <td>{{ i + 1 }}</td>
            <td>{{ formatVnDate(s.date) }}</td>
            <td>{{ s.start }}–{{ s.end }}</td>
            <td>
              <span v-if="s.status === 'present'">Có đi học</span>
              <span v-else-if="s.status === 'excused'">Vắng có phép</span>
              <span v-else-if="s.status === 'absent'">Vắng không phép</span>
              <span v-else class="text-medium-emphasis">Chưa điểm danh</span>
            </td>
            <td class="text-right">{{ formatVnd(s.rate) }}</td>
            <td class="text-right">{{ s.billable ? formatVnd(s.amount) : "—" }}</td>
          </tr>
        </tbody>
      </table>
      <v-divider class="my-3" />
      <div class="d-flex">
        <strong>Tổng cộng:</strong>
        <v-spacer />
        <strong>{{ formatVnd(result.totals.confirmedAmount) }}</strong>
      </div>
      <div class="d-flex mt-2">
        <span>Trạng thái:</span>
        <v-spacer />
        <v-chip :color="result.paymentStatus === 'paid' ? 'success' : 'warning'" size="small">
          {{ result.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu' }}
        </v-chip>
      </div>
      <p v-if="result.paidInfo?.note" class="mt-2 text-body-2">
        Ghi chú: {{ result.paidInfo.note }}
      </p>
    </v-card>
  </div>
</template>

<style scoped>
table { border-collapse: collapse; }
th, td { padding: 6px 4px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.w-100 { width: 100%; }
</style>
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(parent): invoice page (shareable URL)"
```

---

### Task 8.3 — Build, manual test, deploy

**Files:** (no source changes — manual steps)

- [ ] **Step 1: Manual setup in Firebase Console**

Follow the checklist in `docs/superpowers/specs/2026-06-15-attendance-management-design.md` section "One-time Firebase setup":
1. Enable Google sign-in provider
2. Create Firestore database (region `asia-southeast1`)
3. Register a Web App → copy config snippet
4. Add hosting domain to Authentication → Settings → Authorized domains

- [ ] **Step 2: Fill `.env.production` with real values copied from console**

Replace `REPLACE_AT_DEPLOY_TIME` placeholders for `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_APP_ID`.

- [ ] **Step 3: Run typecheck + tests + lint**

```bash
npm run typecheck
npm test
npm run lint
npx firebase emulators:exec --only firestore "npm run test:rules"
```
Expected: all exit 0.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: `dist/` produced.

- [ ] **Step 5: Preview locally**

```bash
npm run preview
```
Expected: app loads on the printed URL. Stop with Ctrl+C.

- [ ] **Step 6: Login to Firebase CLI**

```bash
npx firebase-tools@latest login
npx firebase-tools@latest use attendance-fa916
```

- [ ] **Step 7: Deploy rules + indexes + hosting**

```bash
npm run deploy
```
Expected: prints hosting URL `https://attendance-fa916.web.app`.

- [ ] **Step 8: Smoke test on production**

- Open `https://attendance-fa916.web.app/admin/login` → sign in with `dang.nh.aprotrain@gmail.com` → expect dashboard
- Create a test class with a 1-week schedule
- Add a test student → copy parent link
- Mark attendance on a session date → save
- Mark month as paid → unmark
- Open the parent link in a private window → expect home page with class info
- Open `/p/<token>/invoice/<YYYY-MM>` → expect invoice table

- [ ] **Step 9: Commit & tag**

```bash
git add -A
git commit -m "release: v1.0.0 — initial production deploy"
git tag v1.0.0
```

---

## Self-review checklist

After implementing every task, re-verify before final hand-off:

- [ ] Pure logic 100% test coverage (`expandSchedule`, `getRateAtDate`, `computeMonth`, all `lib/dates.ts` helpers)
- [ ] All security rule tests pass
- [ ] All admin acceptance criteria from `docs/PRD.md` ✓
- [ ] All parent acceptance criteria from `docs/PRD.md` ✓
- [ ] Parent app bundle code-split (verify by `npm run build` and inspecting chunks in `dist/assets`)
- [ ] Locale: VND, dd/MM/yyyy, T2-CN, tiếng Việt UI throughout
- [ ] No `Date.now()` usage in pure logic (only in `markedAt`/`paidAt`)
- [ ] No `onSnapshot` outside of `AttendanceEntryPage.vue` and `useMonthsStore.subscribe`
- [ ] `meta/config` and `parentLinks/{token}` are cached in `localStorage`
- [ ] All TypeScript strict, no `any`

