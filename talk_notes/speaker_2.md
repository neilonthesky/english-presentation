# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Các câu hỏi luật của Level 3; Quy tắc điều hướng khi phát hiện injection; Security rule
- **Tỷ lệ đóng góp trong bài báo:** 22% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Nam nói 120 giây trên tổng 940 giây (12,8%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 22 (60 giây) và Slide 23 (60 giây).
- **Số từ mục tiêu:** ~227 từ tiếng Anh (132 + 95) trong 120 giây, tức khoảng 114 từ mỗi phút, đã gồm câu tự giới thiệu và câu bàn giao. Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 22 (60 giây): dữ liệu thử nghiệm (512 khách hàng, 1.024 yêu cầu, năm nhóm); Slide 23 (60 giây): cách chấm (ba kết cục và lần chạy gây hại). Nam nói ngay sau ba walk-through của Long. Nam **không đặt câu hỏi** và **không tổ chức bình chọn** với khán giả: mọi tương tác do Long thực hiện ở Slide 1 đến 3.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 22: Dữ liệu thử nghiệm: 512 khách hàng, 1.024 yêu cầu
- **Tiêu đề slide:** Test data: 512 customers, 1,024 requests
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~132 từ)
- **Nếu vượt khung:** bỏ câu "High-impact actions are the largest group..." và giữ nguyên các số: 512 khách hàng, 1.024 yêu cầu, 199 yêu cầu bị một luật từ chối.

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Long. My name is Nguyen Thanh Nam. I will explain our test data. Public datasets have no SaaS accounts, so we built our own: five hundred and twelve FrameForge customers, each with one purchase, a credit balance, and a log of password reset links.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Each customer sends two requests, so we have one thousand and twenty-four requests of twenty-six types in five groups. High-impact actions are the largest group, with three hundred and fifty-nine requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We made the set hard on purpose: a written rule denies the action on one hundred and ninety-nine requests, and twenty-seven requests hide an order in the message. A seeded generator writes the requests and runs the real code of the system to make the correct answers. This is a challenge set, not production traffic.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 23]`

---

### Slide 23: Cách chấm: ba kết cục và một lần chạy gây hại
- **Tiêu đề slide:** Every request ends served, stopped, or in error
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~95 từ)
- **Nếu vượt khung:** bỏ câu "We also report the machine time..." và đọc nhanh ba định nghĩa Served, Stopped, Error.

> Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report the machine time of one request, the API cost per one thousand requests, and the error counts on this request set.
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
  > "Public datasets give intent labels only, with no SaaS account behind them. Our written rules need account fields: the purchase, the credit balance, and the log of password reset links. So we generated five hundred and twelve customer accounts, and the rules read the same fields as a real support system."

### Câu hỏi 2:
**"Where do the correct answers of the test data come from?"**
- **Câu trả lời ngắn (3 câu):**
  > "The generator runs the real code of the system, so the correct result of each request is what the written rules give on that account. A rule denies the action on one hundred and ninety-nine of the one thousand and twenty-four requests. This keeps the labels and the code consistent, but it also means the labels are not an independent source of truth."

### Câu hỏi 3:
**"Is a challenge set fair? Why are there so many high-impact and security requests?"**
- **Câu trả lời ngắn (4 câu):**
  > "It is not an estimate of production traffic, and we say so on the slide. We built the set to stress what can do harm: actions that change money, data, or the plan, active security incidents, and requests where time matters. High-impact actions and security incidents are six hundred and sixty-six of the one thousand and twenty-four requests. So the error counts show how each design behaves under pressure, not how often it fails in a normal week."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Synthetic** | **sin-THET-ik** | Có 3 âm tiết; nhấn vào 'THET'; đuôi 'ik' ngắn. |
| **Customers** | **KUS-tuh-merz** | Có 3 âm tiết; nhấn vào 'KUS'; đuôi 'merz' đọc nhẹ. |
| **Generator** | **JEN-uh-ray-ter** | Có 4 âm tiết; nhấn vào 'JEN'; đuôi 'ter' đọc nhẹ. |
| **Seeded** | **SEE-did** | Có 2 âm tiết; nhấn vào 'SEE'; phát âm rõ 'did'. |
| **Challenge** | **CHAL-inj** | Có 2 âm tiết; nhấn vào 'CHAL'; đuôi 'inj' đọc nhẹ. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ. |
| **Served** | **SURVD** | Có 1 âm tiết; kết thúc bằng âm 'd' rõ. |
| **Stopped** | **STOPT** | Có 1 âm tiết; kết thúc bằng âm 't', không đọc 'sto-ped'. |
| **Teammate** | **TEEM-mayt** | Có 2 âm tiết; nhấn vào 'TEEM'; không đọc lướt thành 'team-it'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Bao quát toàn bộ lớp học trước khi nói.
- `[NGHỈ 1 GIÂY]`: Cho người nghe thời gian xử lý các con số (512 khách hàng, 1.024 yêu cầu, 199 luật từ chối).
- `[NHÌN SANG VU VAN SON]`: Nhìn sang người nói tiếp theo khi đọc câu bàn giao lượt nói.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
