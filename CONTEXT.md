# CONTEXT — Thuật ngữ & Nghiệp vụ

> Tài liệu nguồn cho **ngôn ngữ miền** (domain language) của hệ thống quản lý điểm danh & học phí. Mọi code, UI label, doc đều phải dùng đúng các thuật ngữ ở đây.

## 1. Personas

| Persona | Mô tả |
|---|---|
| **Chủ tài khoản** (Owner) | Giáo viên gốc, xác định bằng `meta/config.teacherUid`. Toàn quyền + quản lý admin phụ. |
| **Admin phụ** (Secondary admin) | Giáo viên hỗ trợ/dạy thay. Email Google nằm trong `meta/config.adminEmails`. **Toàn quyền** như chủ, nhưng KHÔNG sửa được danh sách admin. |
| **Phụ huynh** (Parent) | Không đăng nhập. Truy cập qua **Link phụ huynh** hoặc **trang tra cứu chung + mã**. Chỉ đọc, không sửa. |

## 2. Khái niệm cốt lõi

### Lớp học (Class)
Một khoá học có:
- Tên lớp
- **Ngày bắt đầu** và **ngày kết thúc** cố định
- **Lịch tuần** (Weekly Schedule): các thứ trong tuần có buổi học, mỗi thứ có giờ bắt đầu/kết thúc riêng (vd T2: 18:00-19:30, T4: 19:00-20:00, T6: 18:00-19:30)
- **Lịch sử đơn giá** (Rate History): danh sách các thay đổi đơn giá, mỗi entry là `{effectiveFrom, rate}`. Buổi nào diễn ra ngày D dùng entry có `effectiveFrom <= D` mới nhất.
- **Ngày loại trừ** (Excluded Dates): các ngày bị bỏ khỏi lịch (vd nghỉ lễ)
- **Ngày thêm bù** (Added Dates): các ngày *thêm* vào lịch ngoài pattern tuần, có giờ riêng
- **Trạng thái lớp**: `active` | `archived`

### Buổi học (Session)
Một lần lớp diễn ra. Sinh ra từ thuật toán **Mở rộng lịch** (`expandSchedule`):
- Lấy weekly pattern, trừ excluded, cộng added → list session trong khoảng `[lớp.startDate, lớp.endDate]`
- Mỗi session có: `date`, `dayOfWeek`, `start`, `end`, `source` ('weekly' | 'added')
- Nếu một ngày có cả weekly và added → **added override** (dùng giờ của added)

### Học sinh (Student)
Một học sinh thuộc **đúng 1 lớp**. Nếu cùng người học 2 lớp → tạo 2 student records riêng.
- Họ tên, ngày sinh, tên phụ huynh, SĐT phụ huynh, ghi chú
- **Ngày bắt đầu** (`startDate`): default = `class.startDate`, có thể sửa (HS vào trễ)
- **Ngày kết thúc** (`endDate`): null = vẫn đang học; có giá trị = HS đã nghỉ
- **Trạng thái HS**: `active` | `inactive`
- **Token link phụ huynh** (Parent Link Token): chuỗi unguessable gắn 1-1 với học sinh

### Điểm danh (Attendance)
Trạng thái của 1 học sinh trong 1 buổi. Có **4 trạng thái**:

| Trạng thái | Tiếng Việt | Tính tiền? | Mô tả |
|---|---|---|---|
| `unmarked` | Chưa điểm danh | **Không** | Mặc định khi giáo viên chưa đụng đến |
| `present` | Có đi học | **Có** | HS đến lớp |
| `excused` | Vắng có phép | **Không** | HS xin phép vắng (vd ốm, lý do chính đáng) |
| `absent` | Vắng không phép | **Có** | HS không đến, không xin phép → vẫn tính tiền |

→ **Quy tắc tính tiền**: `billable = status in {present, absent}`

### Đơn giá buổi học (Session Rate)
Số tiền cho 1 buổi học, đơn vị VND. Áp dụng cho cả lớp (không phân biệt thứ trong tuần dài/ngắn). Lưu trong `rateHistory` — thay đổi đơn giá **chỉ áp dụng cho buổi tương lai**; buổi đã diễn ra giữ giá lúc đó.

### Tháng (Billing Month)
Tháng dương lịch (`YYYY-MM`, theo `Asia/Ho_Chi_Minh`). Mọi tính toán học phí gom theo tháng dương.

### Học phí tháng (Monthly Tuition)
Có 2 giá trị:
- **Confirmed** = tổng `amount` của các buổi đã `marked` (present/absent) trong tháng. Đây là số dùng để gửi hoá đơn cuối tháng.
- **Projected** = giả định mọi buổi `unmarked` đều là `present` → ước lượng nếu đi đủ. Dùng cho dashboard giáo viên giữa tháng.

Phụ huynh chỉ thấy **confirmed**.

### Thanh toán (Payment)
Trạng thái thu tiền tháng `YYYY-MM` cho 1 học sinh:
- `unpaid`: chưa thu — mặc định
- `paid`: đã thu — khi giáo viên bấm "Đánh dấu đã thu" → ghi `{amount, paidAt, note}`, **`amount` chốt cứng** tại thời điểm đánh dấu

**Cảnh báo lệch số (Discrepancy Warning)**: nếu sau khi đã `paid` mà giáo viên sửa điểm danh quá khứ → `confirmed` của tháng đó có thể khác `payment.amount` đã ghi → UI hiện warning vàng, giáo viên tự xử lý.

### Link phụ huynh (Parent Link)
URL có dạng `https://<host>/p/<token>`:
- `<token>` là chuỗi UUID v4 base64url, ~22 ký tự
- Gắn 1-1 với học sinh
- Bền vĩnh (không hết hạn) — phụ huynh bookmark được
- Mở ra giao diện riêng cho phụ huynh xem lịch, điểm danh, hoá đơn của *đúng* con họ

### Hoá đơn tháng (Monthly Invoice)
Trang web tại `/p/<token>/invoice/<YYYY-MM>` hiển thị toàn bộ tính tiền của 1 tháng cho 1 HS:
- Danh sách buổi trong tháng, status, đơn giá tại thời điểm buổi đó, thành tiền
- Tổng cộng = `confirmed`
- Trạng thái thanh toán + ghi chú giáo viên (nếu có)
- URL bền vĩnh → giáo viên gửi link này thay vì in PDF

## 3. Quy tắc nghiệp vụ quan trọng

### R1. Tính buổi học của 1 HS trong tháng
```
sessions = expandSchedule({
  class,
  from: monthStart,
  to: monthEnd,
  studentStart: student.startDate,
  studentEnd: student.endDate
})
```

### R2. Tính tiền 1 buổi
```
status = monthDoc.attendance[date]?.status ?? 'unmarked'
rate   = getRateAtDate(class.rateHistory, date)
amount = (status in {present, absent}) ? rate : 0
```

### R3. Sửa đơn giá
Thay vì update entry cũ, **thêm entry mới** vào `rateHistory` với `effectiveFrom` là ngày bắt đầu áp dụng giá mới. Các buổi đã có trước đó giữ giá cũ.

### R4. HS join/nghỉ giữa chu kỳ
- `student.startDate` default = `class.startDate`; sửa được khi tạo/cập nhật
- `student.endDate` = null khi vẫn học; set giá trị khi nghỉ
- Chỉ các buổi trong `[student.startDate, student.endDate]` được tính tiền

### R5. Điểm danh quá khứ
Cho phép sửa điểm danh bất kỳ ngày nào. Nếu tháng đó đã `paid`, hệ thống chỉ cảnh báo, không khoá. Giáo viên tự thông báo phụ huynh nếu cần.

### R6. Xoá HS
Khi xoá HS:
- Xoá doc `students/{studentId}` + subcollection `months/*`
- Xoá doc `parentLinks/{token}` tương ứng
- Hành động không thể hoàn tác → UI yêu cầu xác nhận

### R7. Xung đột Excluded/Added cùng ngày
- Nếu cùng 1 ngày vừa có trong `excludedDates` vừa có trong `addedDates`:
  - Weekly pattern bị loại bỏ
  - Added entry vẫn được áp dụng (override)
- Tóm lại: **addedDates luôn ưu tiên**

## 4. Locale, Format, Convention

- **Ngôn ngữ**: tiếng Việt cho mọi UI label, message
- **Timezone**: `Asia/Ho_Chi_Minh` cố định
- **Date format**: lưu `YYYY-MM-DD` (ISO date string, không có time/TZ), hiển thị `DD/MM/YYYY`
- **Time format**: lưu `HH:mm`, hiển thị `HH:mm`
- **Money format**: VND integer (không cent), hiển thị `150.000 đ`
- **Day-of-week label**: T2, T3, T4, T5, T6, T7, CN
- **Month label**: `Tháng MM/YYYY` (vd "Tháng 6/2026")

## 5. Thuật ngữ bổ sung (v1.x)

### Mã tra cứu (Lookup Code)
Mã ngắn **6 ký tự** (bảng chữ bỏ ký tự dễ nhầm `0/O/1/I/L`), gắn 1-1 với học sinh, **giáo viên cấp cho phụ huynh**. Lưu ở `student.lookupCode` + doc `studentCodes/{MÃ}` → `{ studentId, token }`.

### Trang tra cứu chung (Parent Lookup)
URL công khai `/tra-cuu` — gửi cho **cả nhóm phụ huynh**. Phụ huynh nhập **mã tra cứu** → chuyển tới Link phụ huynh (`/p/<token>`) của đúng con mình. Mục đích: 1 link chung thay vì gửi link riêng từng HS.

### Nhận xét buổi học (Note)
Ghi chú của giáo viên cho 1 học sinh trong 1 buổi (`attendance[date].note`), dạng **HTML rich-text cơ bản** (đậm/nghiêng/gạch chân/danh sách/font). Render cho phụ huynh xem, **làm sạch bằng DOMPurify**.

### Cấu hình thanh toán (Payment Config) & QR
`meta/config.payment = { bankAccount, bankCode, accountHolder, storeName, template, showInfo, fullAcc }`. Dùng tạo **mã QR VietQR** (qua sepay.vn) hiển thị cho phụ huynh khi chưa thu. Nội dung CK: `<Tên HS không dấu> T<tháng><năm>` (vd `Nguyen Van A T62026`).

### Firestore collections (tổng hợp)
`meta/config` · `classes/{id}` · `students/{id}` (+ `months/{YYYY-MM}`) · `parentLinks/{token}` · `studentCodes/{code}`.

## 6. Things NOT in scope (xem PRD)

Xem `docs/PRD.md` mục "Out of scope" cho danh sách đầy đủ những thứ KHÔNG làm trong v1.
