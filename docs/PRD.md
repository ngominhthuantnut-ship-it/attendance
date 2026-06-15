# PRD — Hệ thống quản lý điểm danh & học phí trung tâm

**Ngày**: 2026-06-15
**Phiên bản**: v1
**Owner**: Giáo viên (1 người — owner của trung tâm)

## 1. Tầm nhìn & Mục đích

Một web app giúp một giáo viên / chủ trung tâm nhỏ:
1. Quản lý lớp học và học sinh
2. Điểm danh từng buổi
3. Tính học phí tự động theo buổi đã học
4. Gửi link công khai cho phụ huynh xem thông tin con (lịch, điểm danh, hoá đơn) **không cần đăng nhập**

Mục tiêu phụ:
- Vận hành miễn phí trên **Firebase Spark plan**
- Triển khai và bảo trì bởi 1 dev solo
- Tối ưu workflow điểm danh nhanh trên thiết bị di động / tablet

## 2. Personas

### Giáo viên (Teacher)
- 1 người duy nhất
- Đăng nhập **Google OAuth**
- Sử dụng app ~5-10 lần/ngày, chủ yếu điểm danh buổi học
- Thiết bị: laptop, tablet, đôi khi mobile

### Phụ huynh (Parent)
- ~50-100 người (1 phụ huynh / 1 học sinh)
- **KHÔNG đăng nhập** — truy cập qua link giáo viên gửi
- Sử dụng ~2-4 lần/tháng để xem điểm danh + hoá đơn
- Thiết bị: chủ yếu **mobile**

## 3. User stories

### Giáo viên

**Đăng nhập & cài đặt**
- US-T01: Tôi đăng nhập bằng Google để vào hệ thống
- US-T02: Lần đầu đăng nhập, tôi tự động trở thành owner của hệ thống

**Quản lý lớp học**
- US-T03: Tôi tạo lớp học mới với tên, ngày bắt đầu/kết thúc, lịch tuần (chọn các thứ học và giờ học của từng thứ), đơn giá khởi điểm
- US-T04: Tôi sửa thông tin lớp (đổi tên, đổi giờ, ...)
- US-T05: Tôi thêm thay đổi đơn giá với ngày hiệu lực — buổi cũ vẫn giữ giá cũ
- US-T06: Tôi loại trừ 1 ngày khỏi lịch lớp (vd nghỉ lễ)
- US-T07: Tôi thêm 1 buổi học bù vào lịch ngoài pattern tuần
- US-T08: Tôi archive lớp đã kết thúc

**Quản lý học sinh**
- US-T09: Tôi thêm học sinh vào lớp với họ tên, ngày sinh, tên SĐT phụ huynh, ghi chú, ngày bắt đầu học (default = ngày bắt đầu lớp)
- US-T10: Tôi sửa thông tin học sinh
- US-T11: Tôi xoá học sinh (cảnh báo trước, irreversible)
- US-T12: Tôi đánh dấu học sinh đã nghỉ (set `endDate`)
- US-T13: Tôi copy link phụ huynh của 1 học sinh để gửi qua Zalo/SMS

**Điểm danh**
- US-T14: Tôi chọn 1 lớp và 1 ngày → thấy danh sách HS với 3 nút trạng thái: Có đi học / Vắng có phép / Vắng không phép
- US-T15: Tôi điểm danh nhanh từng HS, bấm 1 nút "Lưu tất cả" cuối cùng
- US-T16: Tôi có thể sửa điểm danh của buổi quá khứ
- US-T17: Tôi có thể chuyển nhanh sang buổi trước/sau cùng lớp

**Học phí**
- US-T18: Tôi xem dashboard "tháng này": dự tính thu, đã thu, còn lại
- US-T19: Tôi xem chi tiết tiền học của 1 HS trong 1 tháng (list buổi, đơn giá, thành tiền, tổng cộng)
- US-T20: Tôi đánh dấu "Đã thu" tiền tháng X cho HS — ghi nhận `amount`, ngày thu, ghi chú
- US-T21: Tôi copy link hoá đơn tháng của HS để gửi phụ huynh
- US-T22: Tôi thấy cảnh báo nếu số tính lại sau khi sửa điểm danh khác số đã thu

### Phụ huynh

- US-P01: Tôi mở link giáo viên gửi (không cần đăng nhập), thấy ngay tên con + lớp + thông tin tháng hiện tại
- US-P02: Tôi xem lịch học của con dạng calendar tháng, chuyển qua tháng khác được
- US-P03: Tôi xem bảng điểm danh chi tiết các buổi: ngày, giờ, trạng thái
- US-P04: Tôi xem hoá đơn tháng cụ thể qua link riêng (có thể bookmark, share lại)
- US-P05: Tôi xem trên điện thoại với UI tối ưu mobile

## 4. Functional requirements

### FR1 — Authentication
- Giáo viên đăng nhập bằng Google OAuth (Firebase Auth)
- Lần đầu hệ thống chưa có teacher → user đăng nhập với email cấu hình sẵn (`ngominhthuan.tnut@gmail.com`) tự động claim role
- Phụ huynh: không auth, dùng URL token làm "khoá"

### FR2 — Lớp học
- CRUD lớp với: tên, dates, weekly schedule (7 thứ × {start, end}), rate history (mảng entry effective), excluded/added dates, status
- Thay đổi rate phải thêm entry mới, không update entry cũ
- Excluded/added dates lưu list date string

### FR3 — Học sinh
- CRUD HS với: thông tin cơ bản + classId + startDate + endDate + parentLinkToken + status
- Tạo HS → auto sinh parentLinkToken (UUID v4 base64url) → tạo doc `parentLinks/{token}`
- Xoá HS → xoá luôn doc subcollection `months/*` và parentLink

### FR4 — Điểm danh
- 1 buổi học = 1 cặp (classId, date)
- Mỗi HS có status: `unmarked` | `present` | `excused` | `absent`
- Lưu trong `students/{sid}/months/{YYYY-MM}.attendance[YYYY-MM-DD]`
- Batch write khi lưu cả buổi (atomic)
- Realtime listener khi đang ở màn điểm danh để 2 device đồng bộ

### FR5 — Tính tiền
- Pure function `computeMonth({class, student, monthDoc, yearMonth})` trả về:
  - List sessions với status + rate + amount
  - Totals: `confirmed`, `projected`, đếm theo status
  - Payment status + warning lệch số
- `confirmed` tính chỉ các session đã marked
- Rate áp dụng theo ngày diễn ra session

### FR6 — Thanh toán
- Đánh dấu paid: ghi `{amount, paidAt, note}` vào `monthDoc.payment`
- Bỏ paid: xoá field `payment`
- `amount` chốt cứng tại thời điểm đánh dấu

### FR7 — Parent app
- Route `/p/:token` không yêu cầu auth
- Load parentLink → student → class → tháng hiện tại
- Cache parentLink + class trong localStorage để revisit nhanh
- Chỉ cho phép xem, không cho phép sửa

### FR8 — Hoá đơn tháng
- Route `/p/:token/invoice/:yyyyMM` công khai
- Hiển thị đủ thông tin: lớp, HS, list buổi với rate + amount, tổng, payment status
- URL bền vĩnh, share được

## 5. Non-functional requirements

### NFR1 — Cost
- Vận hành miễn phí trên Firebase Spark plan
- 50K reads/day → design phải bucketing data theo tháng + cache aggressive
- Không dùng Cloud Functions

### NFR2 — Performance
- Parent app TTI < 2s trên 4G
- Bundle parent app < 200KB gzipped (code-split khỏi admin)
- Điểm danh: lưu 1 lớp 30 HS < 1s

### NFR3 — Security
- Teacher uid validate qua Firestore rule
- Parent không list collection được
- Token parentLink ≥ 120 bit entropy (UUID v4)
- Email teacher hardcoded trong rule để chặn race condition bootstrap

### NFR4 — Browser support
- Modern browsers: Chrome, Safari, Firefox, Edge (mới nhất + 2 phiên bản trước)
- Mobile: iOS Safari 15+, Chrome Android 100+

### NFR5 — Accessibility
- Form có label rõ ràng
- Contrast đạt WCAG AA
- Keyboard navigation cho màn điểm danh (Tab/Space/Enter)

### NFR6 — Internationalization
- v1: chỉ tiếng Việt
- Code không hardcode string ở component → tách ra `lib/i18n.ts` cho dễ refactor sau

## 6. UX guidelines

- **Admin app**: desktop-first, density compact cho data table
- **Parent app**: mobile-first, single column, large touch targets
- Visual design giao cho skill `ui-ux-pro-max`
- Vuetify 4 default theme + custom primary color
- Empty state có CTA rõ ràng
- Confirm dialog cho action irreversible (xoá HS, xoá lớp)

## 7. Out of scope (KHÔNG làm trong v1)

| Tính năng | Lý do defer |
|---|---|
| Multi-tenant / nhiều giáo viên | Scope là 1 giáo viên |
| Phân quyền admin/teacher | Không cần |
| Push notification cho phụ huynh | Cần Cloud Functions + Blaze |
| Email reminder hoá đơn tự động | Cần Cloud Functions + Blaze |
| Export PDF hoá đơn | Có link xem online là đủ |
| Theo dõi thanh toán từng phần (partial payment) | Đơn giản hoá: paid/unpaid |
| Make-up class logic (đổi lịch buổi) | Chỉ exclude + add manual |
| Auto-detect lễ Việt Nam | Manual exclude là đủ |
| Audit log thay đổi (history) | Chỉ giữ `markedAt` |
| Soft delete / recover | Hard delete với confirm |
| Multi-class enrollment 1 HS | Nếu cần, tạo HS riêng cho mỗi lớp |
| I18n / đa ngôn ngữ | Tiếng Việt only |
| Dark mode | Vuetify hỗ trợ, không bật ban đầu |
| PWA / offline | ~~Không priority~~ → **đã làm ở v1.x** (mục 10) |
| Phân quyền admin/teacher | ~~Không cần~~ → **đã làm admin phụ ở v1.x** (mục 10) |
| Print PDF từ trình duyệt | User đã chọn link share thay vì print |

## 8. Tiêu chí nghiệm thu v1

Xem `docs/superpowers/specs/2026-06-15-attendance-management-design.md` mục "Acceptance criteria cho v1".

## 10. Bổ sung sau v1 (v1.x — đã triển khai)

Các tính năng phát triển thêm sau bản v1, đã deploy lên production:

### 10.1. Admin phụ (multi-admin allow-list)
- US-T23: Là **chủ tài khoản**, tôi vào **Cài đặt** thêm/xoá **email Google** của người hỗ trợ (giáo viên dạy thay).
- Người có email trong `meta/config.adminEmails` (đã xác thực) đăng nhập Google → **toàn quyền** như chủ.
- **Chỉ chủ** (`teacherUid`) sửa được danh sách admin; `teacherUid` bất biến. Rule: `isTeacher() = chủ HOẶC email ∈ adminEmails`.

### 10.2. Mã tra cứu + trang tra cứu chung cho phụ huynh
- US-T24: Mỗi học sinh có **mã tra cứu** ngắn (6 ký tự, tự sinh). Hiển thị trong danh sách HS + thẻ chia sẻ; tải Excel (`Họ tên · SĐT · Mã`).
- US-P06: Phụ huynh mở **1 link chung** `/tra-cuu`, nhập **mã** của con → xem được Tổng quan + Điểm danh (thay vì gửi link riêng từng HS).
- Collection mới `studentCodes/{MÃ}` → `{ studentId, token }` (get công khai, list cấm, ghi chỉ teacher).

### 10.3. Ghi chú/nhận xét buổi học (rich-text)
- US-T25: Khi điểm danh, mỗi HS có ô **ghi chú nhiều dòng + định dạng cơ bản** (đậm/nghiêng/gạch chân/danh sách/chọn font). Mặc định thu gọn, mở khi cần.
- US-P07: Phụ huynh xem **nhận xét** (render HTML) trong tab điểm danh. HTML được **làm sạch bằng DOMPurify** trước khi lưu & hiển thị.

### 10.4. QR chuyển khoản (VietQR / sepay)
- US-T26: Cài đặt thông tin ngân hàng (số TK, mã NH, chủ TK…) ở **Cài đặt → Thanh toán**.
- US-P08: Ở Tổng quan phụ huynh, khi **chưa thu** & số tiền > 0 → hiện **mã QR** chuyển khoản (số tiền = học phí đã chốt; nội dung = `<Tên HS> T<tháng><năm>`).

### 10.5. Nhập học sinh từ Excel
- US-T27: Tải **file mẫu** Excel; nhập danh sách HS hàng loạt; **xem trước** rồi mới lưu. Trùng **tên + SĐT + tên phụ huynh** → ghi đè.

### 10.6. Lịch Google Calendar (cá nhân)
- US-T28: Trang **Lịch** nhúng Google Calendar cá nhân (xem Tháng/Tuần/Ngày, tạo/sửa/xoá sự kiện, lặp lại, nhắc nhở). Dữ liệu ở Google, không lưu Firestore. Quyền `calendar.events` gộp vào đăng nhập Google. Xem spec: `docs/superpowers/specs/2026-06-15-google-calendar-integration-design.md`.

### 10.7. PWA (cài như app)
- US-T29 / US-P09: Cài app vào màn hình chính trên mobile/desktop (nút **"Cài đặt ứng dụng"**; iOS có hướng dẫn). Service worker + manifest qua `vite-plugin-pwa`.

### 10.8. Cải tiến điểm danh & dashboard
- Điểm danh **hàng loạt** (nút "Tất cả: Có mặt / Có phép / Vắng").
- Màn ngày không có buổi: vẫn giữ điều hướng ‹ ›, chỉ ẩn danh sách/nút lưu.
- Dashboard có **timeline lịch dạy hôm nay** (theo khung giờ). Thống kê chỉ tính lớp **chưa kết thúc**.
- Màn Học phí: **bộ lọc** (tên/lớp/SĐT/trạng thái), **bắt chọn lớp** trước khi tải (giảm reads), công tắc on/off đánh dấu đã thu (có xác nhận).

## 9. References

- Design doc: `docs/superpowers/specs/2026-06-15-attendance-management-design.md`
- Domain language: `CONTEXT.md`
- Tech & convention: `CLAUDE.md`
- Firebase project ID: `attendance-fa916`
