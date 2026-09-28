# Hành trình nhà khoa học nhí — Chinh phục đo chiều dài 🚀🔬

Web game giáo dục môn Khoa học tự nhiên lớp 6 (Bài: Đo chiều dài) ứng dụng công nghệ hiện đại React 19, TypeScript, Web Audio API và cơ sở dữ liệu SQLite máy chủ với cơ chế chấm điểm chống gian lận (Anti-Cheat Server-side Grading).

---

## 🌟 Tính năng nổi bật

1. **5 Chặng thử thách sư phạm chuẩn chương trình KHTN 6:**
   - **Chặng 1:** Khu rừng đơn vị đo (Hệ SI, chọn đơn vị phù hợp).
   - **Chặng 2:** Công trường thước đo (GHĐ, ĐCNN, chọn thước, đặt vạch số 0 trùng đầu vật).
   - **Chặng 3:** Phòng thí nghiệm sai số (Đặt thước thẳng, đặt mắt vuông góc, đọc kết quả đúng).
   - **Chặng 4:** Trạm vận dụng (Đổi đơn vị, bài toán đo thực tế).
   - **Chặng 5:** Kho báu nhà khoa học (Tổng hợp kiến thức, mở rương nhận Thước Vàng KHTN).

2. **Tương tác đa dạng:**
   - Trắc nghiệm 1 đáp án đúng (MCQ) với phản hồi êm dịu, không gây giật mình.
   - Kéo thả ghép nối (Drag and drop) hỗ trợ chuột, cảm ứng và chế độ chạm chọn thẻ rồi chạm ô đích (Tap-to-select).

3. **Âm thanh tổng hợp Web Audio API:**
   - Hoạt động không cần tải tệp âm thanh ngoài, chỉ phát sau thao tác người dùng.
   - Nút bật/tắt âm thanh luôn hiển thị trên thanh điều hướng. Có tùy chọn giảm chuyển động (Reduced Motion).

4. **Khu vực quản trị giáo viên (Teacher Portal) bảo mật:**
   - Phân tách bản nháp (Draft) và bản xuất bản (Published).
   - Quản lý 5 chặng, chỉnh sửa ngân hàng câu hỏi, xem trước bài học.
   - Học sinh vào chơi bằng Mã lớp và Mã học sinh. Lưu vết từng lượt chơi độc lập.
   - Thống kê tỷ lệ câu hỏi học sinh sai nhiều nhất và xuất file Excel CSV (UTF-8 BOM).
   - Mật khẩu mặc định: `giaovienkhtn2026`.

5. **Bộ kiểm thử tự động toàn diện (E2E Tests):**
   - Đã kiểm tra 10 kịch bản thao tác thực tế bằng trình duyệt Microsoft Edge Chromium headless với kết quả **10/10 ĐẠT**.

---

## 🛠️ Cài đặt & Chạy cục bộ

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy máy chủ API SQLite (Port 3001)
npm run server

# 3. Khởi chạy giao diện game Vite (Port 5173) trong một terminal khác
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 🧪 Chạy bộ kiểm thử tự động 10 kịch bản

```bash
node tests/run_all_tests.mjs
```

---

## 🚀 Triển khai lên GitHub & Vercel

Xem tài liệu hướng dẫn chi tiết trong mục bàn giao dự án.
