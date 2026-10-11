# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ phân công:** 17% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Quy nói 120 giây trên tổng 900 giây.
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho ba slide: Slide 26 (40 giây), Slide 27 (38 giây), Slide 28 (42 giây).
- **Số từ mục tiêu:** ~234 từ (tốc độ ~120 đến 130 từ/phút, nói chậm vì có nhiều số liệu)
- **Các slide phụ trách:** Slide 26 (40 giây): độ tin cậy của Jev; Slide 27 (38 giây): Kết quả 2 (ba cấp độ, đo với bước kiểm tra cố định phía sau Jev); Slide 28 (42 giây): không có bước kiểm tra cố định thì lỗi của Jev sẽ chạy, và câu hỏi mở về thiết kế mới. Câu bàn giao cho Phuong Nam nằm ở cuối Slide 28. Quy **không đặt câu hỏi** cho khán giả: Quy chỉ trình bày số liệu.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Son. My name is Vuong Quang Quy. I will show what the errors and the confidence mean."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 26: Độ tin cậy của Jev là một tín hiệu cảnh báo
- **Tiêu đề slide:** Jev reports a confidence, and it is a warning
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~72 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son. My name is Vuong Quang Quy. I will show what the errors and the confidence mean. With a fixed check behind Jev, none of the 27 wrong answers is an error. Jev also reports a confidence, and only Jev does. 24 of the 57 answers below 0.8 are wrong. At 0.9 or more, only 9 of 190 are wrong, which is 4.7%. So the confidence works as a warning.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 27]`

---

### Slide 27: Kết quả 2: So sánh ba cấp độ
- **Tiêu đề slide:** Result 2: Level 3 is never worse
- **Thời gian dự kiến trên slide:** 0 phút 38 giây (38 giây, ~83 từ)

> Now the three levels on the same 100 requests. In these runs a fixed check stands behind Jev. Level 2 serves 66, stops 28, and makes 6 errors, 2 of them harmful. Level 3 serves 70, stops 30, and makes 0 errors. Level 3 is 1.9 times faster, 4.19 seconds against 7.85, and 2.2 times cheaper, 28 cents against 61 cents per 1,000 requests. The sign test gives p = 0.031: significantly fewer errors. Level 1 is the assumed 90 seconds per request.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 28]`

---

### Slide 28: Không có bước kiểm tra cố định, lỗi của Jev sẽ chạy
- **Tiêu đề slide:** Without a fixed check, Jev's errors run
- **Thời gian dự kiến trên slide:** 0 phút 42 giây (42 giây, ~79 từ)

> Why does Level 3 make no error? We removed the fixed check from behind Jev. Then 22 requests become harmful errors: 66 served, 12 stopped, 22 errors. With the check, it is 70, 30, and 0. The sign test gives p below one in a million. Our new design gives Jev the rules as context instead of a check. We have not run it.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG NGUYEN PHUONG NAM]`  
> 
> Now Nguyen Phuong Nam will explain how our work fits the field, and its limits.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 5:

> "Now Nguyen Phuong Nam will explain how our work fits the field, and its limits."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"What is a 'harmful error' in your evaluation metrics?"**
- **Câu trả lời ngắn (2 câu):**
  > "A harmful error is a wrong action that moves money or deletes data against a written rule. A wrong answer in words is a smaller error."

### Câu hỏi 2:
**"Why did Level 2 take 7.85 seconds of machine time per request?"**
- **Câu trả lời ngắn (4 câu):**
  > "At Level 2, the agent call reads the chat and the account, and it checks the rules. This takes 3.97 seconds. The Final message call adds the rest, so the total is 7.85 seconds. At Level 3, the Jev call takes 0.334 seconds, and the total falls to 4.19 seconds."

### Câu hỏi 3:
**"What did the paired sign test test, and what does p = 0.031 indicate?"**
- **Câu trả lời ngắn (4 câu):**
  > "The sign test looks at six requests where only Level 2 makes an error. Level 3 has no such request. It gives p equal to 0.031, below 0.05. So Level 3 makes significantly fewer errors, though the margin is thin. Our other strong claims are speed, cost, and never worse."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Nineteen** | **nyne-TEEN** | Có 2 âm tiết; nhấn vào 'TEEN' để người nghe không nhầm với 'ninety'; dùng trong 'nineteen point eight times faster'. |
| **Significantly** | **sig-NIF-ih-kunt-lee** | Có 5 âm tiết; nhấn vào 'NIF'; các âm còn lại đọc lướt, đuôi 'lee' đọc nhẹ. |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ, không đọc thành 'haf'. |
| **Measurement** | **MEZH-er-munt** | Có 3 âm tiết; nhấn vào 'MEZH'; âm 'zh' như trong 'vision'. |
| **Assumed** | **uh-SOOMD** | Có 2 âm tiết; nhấn vào 'SOOMD'; âm cuối 'd' bật nhẹ. |
| **Written** | **RIT-un** | Có 2 âm tiết; nhấn vào 'RIT'; không đọc chữ 'w'. |
| **Accuracy** | **AK-yuh-ruh-see** | Có 4 âm tiết; nhấn vào 'AK'; đuôi 'see' rõ ràng. |
| **Column** | **KOL-um** | Có 2 âm tiết; nhấn vào 'KOL'; chữ 'n' cuối không đọc. |
| **Results** | **rih-ZULTS** | Có 2 âm tiết; nhấn vào 'ZULTS'; 's' đọc như 'z'. |
| **Errors** | **ER-erz** | Có 2 âm tiết; nhấn vào 'ER'; đuôi 'erz' đọc nhẹ. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Thể hiện sự hào hứng trước khi công bố số liệu thực nghiệm.
- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (nhanh hơn 19.8x, rẻ hơn 10.9x).
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
