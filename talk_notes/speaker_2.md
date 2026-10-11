# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Quy tắc điều hướng Level 3; Kiểm tra quy tắc (Rules check) cho hoàn tiền, xóa dữ liệu, hủy gói và đổi mật khẩu; Security rule
- **Tỷ lệ phân công:** 22% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Nam nói 120 giây trên tổng 900 giây.
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho ba slide: Slide 20 (41 giây), Slide 21 (39 giây), Slide 22 (40 giây).
- **Số từ mục tiêu:** ~235 từ (tốc độ ~120 đến 130 từ/phút, nói chậm vì có nhiều số liệu)
- **Các slide phụ trách:** Slide 20 (41 giây): dữ liệu thử nghiệm; Slide 21 (39 giây): mười nhóm yêu cầu; Slide 22 (40 giây): cách chấm (ba kết cục và cờ gây hại). Nam nói ngay sau ba walk-through của Long. Nam **không đặt câu hỏi** và **không tổ chức bình chọn** với khán giả: mọi tương tác do Long thực hiện ở Slide 1 đến 3.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 20: Dữ liệu thử nghiệm: 72 khách hàng, 100 yêu cầu
- **Tiêu đề slide:** Test data: 72 customers, 100 requests
- **Thời gian dự kiến trên slide:** 0 phút 41 giây (41 giây, ~79 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data. Public datasets have no SaaS accounts, so we built our own: 72 FrameForge customers. Each has one purchase, a plan and its state, a render-credit balance, a log of password reset links, and a teammate with no billing rights. So the written rules can use real account fields, and the customers cover every branch of the rules. They send 100 requests of 24 types.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 21]`

---

### Slide 21: 100 yêu cầu trong mười nhóm
- **Tiêu đề slide:** 100 requests in ten families
- **Thời gian dự kiến trên slide:** 0 phút 39 giây (39 giây, ~76 từ)

> A seeded generator wrote the 100 requests. The 24 types form ten families. Questions and answers is the largest, with 24 requests, then refunds with 16, plan cancellations with 14, and password resets with 12. Every request has its own words and its own sender: 88 owners and 12 teammates. The correct answers come from the written rules, because the generator runs the real code. A rule denies the action on 30 of the 100 requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 22]`

---

### Slide 22: Cách chấm: ba kết cục và một cờ gây hại
- **Tiêu đề slide:** What we count: three outcomes and one harm flag
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~80 từ)

> Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run. A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report time and cost per 1,000 requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG VU VAN SON]`  
> 
> Now my teammate Vu Van Son will explain the run.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Son (Diễn giả 3):

> "Now my teammate Vu Van Son will explain the run."

---

## 4. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Classifier** | **KLASS-ih-fy-er** | Có 4 âm tiết; nhấn mạnh vào 'KLASS'; phát âm rõ 'fy-er'. |
| **Deterministic** | **dih-TUR-mih-nis-tik** | Có 5 âm tiết; nhấn mạnh vào 'TUR' và 'nis'. |
| **Irreversible** | **eer-ih-VUR-sih-bul** | Có 5 âm tiết; nhấn mạnh vào 'VUR'; đuôi 'bul' đọc rõ. |
| **Security** | **sih-KYUR-ih-tee** | Có 4 âm tiết; nhấn vào 'KYUR'; đuôi 'tee' đọc nhẹ. |
| **Topic** | **TOP-ik** | Có 2 âm tiết; nhấn vào 'TOP'; đuôi 'ik' đọc nhẹ. |
| **Calibrated** | **KAL-ih-bray-tid** | Có 4 âm tiết; nhấn vào 'KAL'; đuôi 'tid' dứt khoát. |
| **Probability** | **praw-buh-BIL-ih-tee** | Có 5 âm tiết; trọng âm chính rơi vào 'BIL'. |
| **Verdict** | **VUR-dikt** | Có 2 âm tiết; nhấn vào 'VUR'; đuôi 'dikt' đọc sắc. |
| **Teammate** | **TEEM-mayt** | Có 2 âm tiết; nhấn vào 'TEEM'; không đọc lướt thành 'team-it'. |
| **Triage** | **TREE-ahzh** | Có 2 âm tiết; nhấn vào 'TREE'; âm 'ahzh' kiểu Pháp nhẹ nhàng. |

---

## 5. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Bao quát toàn bộ lớp học trước khi nói.
- `[NGHỈ 1 GIÂY]`: Cho phép người nghe có thời gian xử lý các điều kiện quy tắc phức tạp.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
