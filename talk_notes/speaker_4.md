# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ phân công:** 17% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 1 phút 30 giây (90 giây). Giảm 25 giây so với bản trước (115 giây) vì câu hỏi dự đoán ở Slide 7 đã chuyển sang Long (Slide 3).
- **Số từ mục tiêu:** ~195 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 7 (30 giây) và Slide 8 (60 giây). Câu bàn giao cho Diễn giả 5 nằm ở cuối Slide 8. Quy **không đặt câu hỏi** cho khán giả và không nhắc lại câu hỏi dự đoán: Quy chỉ trình bày số liệu, vì Long đã hỏi khán giả ở Slide 3.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Son. My name is Vuong Quang Quy. I will show our results."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 7: Kết quả 1: So sánh giai đoạn phân loại
- **Tiêu đề slide:** Result 1: labels are close; Jev is 18 times faster (Classifier Stage)
- **Thời gian dự kiến trên slide:** 0 phút 30 giây (30 giây, ~65 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son. My name is Vuong Quang Quy. I will show our results.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> One Jev call takes 0.24 seconds. One LLM call takes 4.41 seconds. Jev is eighteen times faster. Jev costs 0.052 dollars per 1,000 requests. The LLM costs 0.587. Jev is eleven times cheaper. Jev is behind the LLM on four of five answers. The written rules catch its wrong answers.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 8]`

---

### Slide 8: Kết quả 2: So sánh mô hình bậc thang 3 cấp độ
- **Tiêu đề slide:** Result 2: Level 3 is never worse (The Ladder)
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)

> All levels use the same fifty requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> At Level One, we assume staff need ninety seconds per request. It is an assumed number, not a measurement.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Two serves thirty-two requests, stops fifteen, and makes three errors. It needs 6.85 seconds and costs 0.71 dollars per 1,000 requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three serves thirty-five requests, stops fifteen, and makes zero errors. It needs 3.16 seconds and costs 0.30 dollars.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> So Level Three is never worse in any column. It is 2.2 times faster and 2.4 times cheaper. The sign test gives p equals 0.25 on three requests. So we do not show an accuracy gap. Our strong claims are speed, cost, and never worse.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[NHÌN SANG NGUYEN PHUONG NAM]`  
> 
> Next, my teammate Nguyen Phuong Nam will explain our limits and end our talk.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 5:

> "Next, my teammate Nguyen Phuong Nam will explain our limits and end our talk."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"What is a 'harmful error' in your evaluation metrics?"**
- **Câu trả lời ngắn (2 câu):**
  > "A harmful error is a wrong action that moves money or deletes data against a written rule. A wrong answer in words is a smaller error."

### Câu hỏi 2:
**"Why did Level 2 take 6.85 seconds of machine time per request?"**
- **Câu trả lời ngắn (4 câu):**
  > "At Level 2, the agent call reads the chat and the account, and it checks the rules. This takes 3.11 seconds. The Final message call adds the rest, so the total is 6.85 seconds. At Level 3, the Jev call takes 0.295 seconds, and the total falls to 3.16 seconds."

### Câu hỏi 3:
**"What did the paired sign test test, and what does p = 0.25 indicate?"**
- **Câu trả lời ngắn (4 câu):**
  > "The sign test looks at three requests where only Level 2 makes an error. It gives p equals 0.25. With only three requests, we cannot show an accuracy gap. Our strong claims are speed, cost, and never worse."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Eighteen** | **ay-TEEN** | Có 2 âm tiết; nhấn vào 'TEEN' để người nghe không nhầm với 'eighty'. |
| **Eleven** | **ih-LEV-un** | Có 3 âm tiết; nhấn vào 'LEV'; đuôi 'un' đọc nhẹ. |
| **Thirty-five** | **THUR-tee-fyv** | Có 3 âm tiết; nhấn vào 'THUR'; 'five' đọc như 'fyv'. |
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
- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (nhanh hơn 18x, rẻ hơn 11x).
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
