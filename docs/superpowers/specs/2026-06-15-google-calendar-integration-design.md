# Thiết kế: Tích hợp Google Calendar (lịch cá nhân trong app)

> Spec ngày 2026-06-15. Trạng thái: chờ user review.

## 1. Mục tiêu

Nhúng **lịch Google cá nhân** của người đang đăng nhập vào khu admin: xem và quản lý sự kiện bất kỳ (CRUD), tách biệt hoàn toàn với domain lớp học / điểm danh / học phí. Toàn bộ dữ liệu sự kiện nằm ở **Google Calendar**, **không** lưu Firestore.

Phi mục tiêu: không thay thế lịch buổi học của lớp (vẫn dùng `weeklySchedule`/`addedDates`/`excludedDates` trong Firestore). Không đồng bộ buổi học ↔ GCal.

## 2. Phạm vi (MVP "Trung bình")

**Có:**
- Lịch chính (`primary`) của chính user đăng nhập.
- 3 chế độ xem: **Tháng**, **Tuần**, **Ngày**.
- CRUD sự kiện: tiêu đề, thời gian bắt đầu/kết thúc, cả ngày (all-day), mô tả, địa điểm.
- **Sự kiện lặp lại** (recurring) qua preset RRULE: Không lặp / Hằng ngày / Hằng tuần / Hằng tháng (không cần UI RRULE tuỳ biến đầy đủ).
- **Nhắc nhở** (reminders) qua preset: Không / 10 phút / 30 phút / 1 giờ / 1 ngày trước (override `popup`).
- Điều hướng: ◀ ▶, "Hôm nay". Timezone hard-code `Asia/Ho_Chi_Minh`.

**Không (YAGNI — để sau):** nhiều lịch, mời khách (guests/attendees), kéo–thả đổi giờ, màu theo sự kiện, tìm kiếm, đính kèm, RRULE tuỳ biến nâng cao.

## 3. Ràng buộc nền tảng

- **Firebase Spark, KHÔNG Cloud Functions.** Mọi lệnh gọi Google Calendar chạy **client-side** từ trình duyệt bằng OAuth access token.
- Không có service account, **không** đồng bộ nền/webhook/push. Chỉ đồng bộ khi user đang mở app và bấm thao tác / tải lại range.

## 4. Xác thực & vòng đời token (gộp vào đăng nhập Google)

- `useAuthStore.signIn()` thêm scope `https://www.googleapis.com/auth/calendar.events` vào `GoogleAuthProvider` hiện có.
- Sau `signInWithPopup(result)`, lấy access token: `GoogleAuthProvider.credentialFromResult(result)?.accessToken`. Lưu **trong bộ nhớ** ở authStore (`calendarToken: Ref<string | null>`). **Không** lưu localStorage (token nhạy cảm, ngắn hạn).
- **Hạn chế đã chấp nhận:** Firebase không lưu/không refresh token Calendar.
  - Tải lại trang → mất token (Firebase user còn, token Calendar mất).
  - Token hết hạn ~1 giờ.
  - Calendar API trả 401 khi token hết/không có.
- **Khôi phục token:** hàm `reconnectCalendar()` gọi `reauthenticateWithPopup(user, provider-có-scope)` để lấy access token mới, cập nhật `calendarToken`. Trang Lịch hiển thị trạng thái "Chưa kết nối / token hết hạn" + nút **"Kết nối Google Calendar"** gọi hàm này. Service gặp 401 → set cờ để UI hiện nút này.

## 5. Kiến trúc & các đơn vị

### 5.1 Service: `src/services/googleCalendar.ts`
Bọc REST API (`https://www.googleapis.com/calendar/v3/calendars/primary/events`) bằng `fetch` + header `Authorization: Bearer <token>`. Token truyền vào (lấy getter từ authStore), service không tự biết về Firebase.

```ts
interface GCalEvent { id; summary; description?; location?; start; end; recurrence?; reminders?; ... }
listEvents(token, timeMinISO, timeMaxISO): Promise<GCalEvent[]>   // GET, singleEvents=true, orderBy=startTime
createEvent(token, payload): Promise<GCalEvent>                   // POST
updateEvent(token, id, payload): Promise<GCalEvent>               // PATCH
deleteEvent(token, id): Promise<void>                             // DELETE
```
- Lỗi: ném `CalendarAuthError` khi HTTP 401; `CalendarApiError` cho lỗi khác (kèm message).

### 5.2 Logic thuần (test được, không I/O): `src/composables/useCalendarGrid.ts` + `src/lib/gcal.ts`
- `monthGrid(ym)`, `weekDays(dateISO)`, `dayHours()` — dựng khung lưới (tái dùng helper `src/lib/dates.ts`).
- `lib/gcal.ts`: `toGcalPayload(form)` ⇄ `fromGcalEvent(event)`; `buildRecurrence(preset)` → mảng RRULE; `buildReminders(preset)`; tách event theo ngày để render trên lưới.

### 5.3 State: Pinia store `src/stores/useGoogleCalendarStore.ts` (theo convention store-per-aggregate)
- Giữ `events`, `loading`, `error`, `needsReconnect`.
- `loadRange(timeMin, timeMax)`, `save(form)`, `remove(id)` → gọi service với token từ authStore; bắt `CalendarAuthError` → `needsReconnect = true`.

### 5.4 UI: `src/pages/admin/CalendarPage.vue` + `src/components/calendar/*`
- Toggle Tháng/Tuần/Ngày, thanh điều hướng, banner kết nối khi `needsReconnect`.
- `EventDialog.vue`: form tạo/sửa (vee-validate + Zod), preset recurring & reminder.
- Click ô trống → tạo (prefill thời gian); click sự kiện → sửa/xoá (ConfirmDialog khi xoá).
- Route `admin-calendar` path `calendar`, thêm nav "Lịch" (icon `mdi-calendar`).

## 6. Luồng dữ liệu
1. Vào trang Lịch → nếu không có token → banner "Kết nối Google Calendar".
2. Có token → `loadRange()` cho khoảng đang xem → render.
3. Tạo/sửa/xoá → gọi service → thành công thì `loadRange()` lại (hoặc cập nhật cục bộ) → snackbar.
4. Bất kỳ call nào 401 → `needsReconnect=true` → user bấm kết nối lại → thử lại.

## 7. Xử lý lỗi (theo CLAUDE.md)
- Lỗi mạng/API → `VSnackbar`. Không alert/confirm trình duyệt.
- 401/thiếu token → banner + nút kết nối lại (không phải snackbar thoáng qua).
- Validation form → vee-validate inline.

## 8. Kiểm thử
- Unit (100% cho logic thuần): `lib/gcal.ts` (map payload, RRULE/reminder builder), `useCalendarGrid` (khung lưới, tách event theo ngày).
- Service: test với `fetch` mock (thành công, 401 → `CalendarAuthError`, lỗi khác → `CalendarApiError`).
- Không cần Firestore emulator (GCal là dịch vụ ngoài, mock toàn bộ).

## 9. Điều kiện phía Google (ngoài code — user thực hiện)
- Bật **Google Calendar API** (đã làm).
- Cấu hình **OAuth consent screen**: thêm scope `.../auth/calendar.events`; thêm bản thân + admin vào **Test users** (vì scope nhạy cảm; chưa verify thì chỉ test users dùng được, sẽ thấy cảnh báo "app chưa xác minh" → Advanced → tiếp tục).
- Đảm bảo authorized domains của Firebase Auth bao gồm domain hosting.

## 10. Ảnh hưởng tới phần hiện có
- `useAuthStore`: thêm scope + lưu `calendarToken` + `reconnectCalendar()`.
- Router + AdminLayout: thêm route & nav "Lịch".
- Firestore rules: **không đổi**.
- Không đụng tới lớp/điểm danh/học phí.
