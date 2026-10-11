# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Các câu hỏi luật của Level 3; Quy tắc điều hướng khi phát hiện injection; Security rule
- **Tỷ lệ phân công:** 22% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Nam nói 120 giây trên tổng 858 giây.
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho ba slide: Slide 21 (41 giây), Slide 22 (39 giây), Slide 23 (40 giây).
- **Số từ mục tiêu:** ~230 từ, tức khoảng 115 từ mỗi phút: tốc độ thoải mái, nói rõ từng số liệu
- **Các slide phụ trách:** Slide 21 (41 giây): dữ liệu thử nghiệm; Slide 22 (39 giây): mười nhóm yêu cầu; Slide 23 (40 giây): cách chấm (ba kết cục và cờ gây hại). Nam nói ngay sau ba walk-through của Long. Nam **không đặt câu hỏi** và **không tổ chức bình chọn** với khán giả: mọi tương tác do Long thực hiện ở Slide 1 đến 3.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 21: Dữ liệu thử nghiệm: 512 khách hàng, 1.024 yêu cầu
- **Tiêu đề slide:** Test data: 512 customers, 1,024 requests
- **Thời gian dự kiến trên slide:** 0 phút 41 giây (41 giây, ~78 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data. Public datasets have no SaaS accounts, so we built our own: five hundred and twelve FrameForge customers. Each customer has one purchase, a plan and its state, a render-credit balance, a log of password reset links, and a teammate without billing rights. So the written rules can use real account fields, and the customers cover every branch of the rules. They send one thousand and twenty-four requests of twenty-four types.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 22]`

---

### Slide 22: 1.024 yêu cầu trong mười nhóm
- **Tiêu đề slide:** 1,024 requests in ten families
- **Thời gian dự kiến trên slide:** 0 phút 39 giây (39 giây, ~80 từ)

> A seeded generator wrote the one thousand and twenty-four requests. The twenty-four types form ten families. Questions and answers is the largest, with two hundred and forty-six requests, then refunds with one hundred and sixty-four, plan cancellations with one hundred and forty-three, and password resets with one hundred and twenty-three. Every request has its own words. Nine hundred and one senders are the account owner, and one hundred and twenty-three are a teammate of the workspace without billing rights. The correct answers come from the written rules, because the generator runs the real code. A rule denies the action on three hundred and seven of the one thousand and twenty-four requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 23]`

---

### Slide 23: Cách chấm: ba kết cục và một cờ gây hại
- **Tiêu đề slide:** Every request ends served, stopped, or in error
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~82 từ)

> Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run. A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report machine time and API cost per one thousand requests.
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

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why did you build a synthetic dataset instead of using a public customer support dataset like Bitext?"**
- **Câu trả lời ngắn (3 câu):**
  > "Public datasets give intent labels only, with no SaaS account behind them. Our written rules need real fields: the purchase date, the credits used, the state of the plan, and the teammate. So we generated five hundred and twelve complete customer accounts, and the rules read the same fields as a real support system."

### Câu hỏi 2:
**"Where do the correct answers of the test data come from?"**
- **Câu trả lời ngắn (3 câu):**
  > "The generator runs the real code of the system, so the correct answer of each request is the result that the written rules give on that account. One rule denies the action on three hundred and seven of the one thousand and twenty-four requests. This keeps the labels and the code consistent, but it also means the labels are not an independent source of truth."

### Câu hỏi 3:
**"Why do some requests come from a teammate, and what does that change?"**
- **Câu trả lời ngắn (3 câu):**
  > "Every customer account has one teammate without rights over billing or data, and one hundred and twenty-three of the one thousand and twenty-four requests come from that teammate. The rules 'owner only' and 'own account' exist exactly for those requests: a teammate cannot start a refund, cancel a plan, or delete data. So the test data covers both sides of those rules."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Classifier** | **KLASS-ih-fy-er** | Có 4 âm tiết; nhấn mạnh vào 'KLASS'; phát âm rõ 'fy-er'. |
| **Deterministic** | **dih-TUR-mih-nis-tik** | Có 5 âm tiết; nhấn mạnh vào 'TUR' và 'nis'. |
| **Irreversible** | **eer-ih-VUR-sih-bul** | Có 5 âm tiết; nhấn mạnh vào 'VUR'; đuôi 'bul' đọc rõ. |
| **Security** | **sih-KYUR-ih-tee** | Có 4 âm tiết; nhấn vào 'KYUR'; đuôi 'tee' đọc nhẹ. |
| **Topic** | **TOP-ik** | Có 2 âm tiết; nhấn vào 'TOP'; đuôi 'ik' đọc nhẹ. |
| **Teammate** | **TEEM-mayt** | Có 2 âm tiết; nhấn vào 'TEEM'; không đọc lướt thành 'team-it'. |
| **Purchase** | **PUR-chis** | Có 2 âm tiết; nhấn vào 'PUR'; đuôi 'chis' đọc nhẹ, không đọc 'pur-chase'. |
| **Generator** | **JEN-uh-ray-ter** | Có 4 âm tiết; nhấn vào 'JEN'; đuôi 'ter' đọc nhẹ. |
| **Seeded** | **SEE-did** | Có 2 âm tiết; nhấn vào 'SEE'; phát âm rõ 'did'. |
| **Triage** | **TREE-ahzh** | Có 2 âm tiết; nhấn vào 'TREE'; âm 'ahzh' đọc nhẹ. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Bao quát toàn bộ lớp học trước khi nói.
- `[NGHỈ 1 GIÂY]`: Cho phép người nghe có thời gian xử lý các con số và điều kiện quy tắc.
- `[NHÌN SANG VU VAN SON]`: Nhìn sang người nói tiếp theo khi đọc câu bàn giao lượt nói.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
