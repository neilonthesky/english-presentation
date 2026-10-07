# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ phân công:** 17% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 1 phút 55 giây (115 giây). Đã giảm 38 giây so với bản trước vì slide thử nghiệm tiêm lỗi bị bỏ khỏi bộ slide.
- **Số từ mục tiêu:** ~249 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 7 và Slide 8 (trước đây là Slide 8, 9 và 10). Câu bàn giao cho Diễn giả 5 nay nằm ở cuối Slide 8.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Vuong Quang Quy. I am responsible for our experimental results, statistical analysis, and our generated tables and charts."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 7: Kết quả 1: So sánh giai đoạn phân loại
- **Tiêu đề slide:** Result 1: labels are close; Jev is 18 times faster (Classifier Stage)
- **Thời gian dự kiến trên slide:** 0 phút 55 giây (55 giây, ~120 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Before we look at the numbers, a quick guess: which level is faster and cheaper? Level Two with DeepSeek alone, or Level Three with Jev and DeepSeek together? `[NGHỈ 2 GIÂY]`  
> 
> Most people guess Level Two. But look at the data on this slide!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> One Jev call takes a median of 0.24 seconds. One DeepSeek call takes 4.41 seconds. That is eighteen times faster! Jev costs 0.052 dollars per thousand requests, and DeepSeek as a classifier costs 0.587 dollars. That is eleven times cheaper!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Jev is behind DeepSeek on four fields, but ahead on the queue, and it reports a confidence with every label. The calibration error runs from 0.07 to 0.15. Five wrong answers still carry a confidence of 0.9 or more. That is why the written rules, not the confidence, keep the customer safe.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 8]`

---

### Slide 8: Kết quả 2: So sánh mô hình bậc thang 3 cấp độ
- **Tiêu đề slide:** Result 2: Level 3 is never worse (The Ladder)
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)

> Now, look at the table for all fifty test requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level One uses ninety seconds of assumed staff time per request. Level Two serves thirty-two requests, stops fifteen, and makes three errors. These errors are wrong denials: the correct result is an answer, and nothing ran. It needs 6.85 seconds of machine time and costs 0.71 dollars per thousand requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three serves thirty-five requests, stops fifteen, and makes zero errors! It needs 3.16 seconds and costs 0.30 dollars per thousand requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> So Level Three is never worse in any column! It is 2.2 times faster and 2.4 times cheaper. The sign test has three discordant pairs and gives p equals 0.25, so the accuracy gap is not established. Our strong claims are speed, cost, and never worse!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> One caveat: we measure what the customer gets. Level Three has seven label errors and Level Two has five, but no wrong label becomes an error of Level Three. No run is harmful at either level.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[NHÌN SANG NGUYEN PHUONG NAM]`  
> 
> Finally, my teammate Nguyen Phuong Nam will discuss our study limitations and conclude our presentation.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 5:

> "Finally, my teammate Nguyen Phuong Nam will discuss our study limitations and conclude our presentation."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời

### Câu hỏi 1:
**"What is a 'harmful error' in your evaluation metrics?"**
- **Câu trả lời ngắn (2 câu):**
  > "A harmful error is defined strictly as an unauthorized database action that changes user money or deletes data against business policy. A benign error might give an unhelpful answer, but a harmful error breaks financial or privacy security."

### Câu hỏi 2:
**"Why did Level 2 take 6.85 seconds of machine time per request?"**
- **Câu trả lời ngắn (3 câu):**
  > "In Level 2, the agent call must read the user text and the account and reason through the rules, and it takes 3.11 seconds per request. The Final message call adds the rest, for 6.85 seconds of machine time. In Level 3, the Jev call takes 0.295 seconds, and the total falls to 3.16 seconds, which is 2.2 times faster."

### Câu hỏi 3:
**"What did the paired sign test test, and what does p = 0.25 indicate?"**
- **Câu trả lời ngắn (3 câu):**
  > "The exact paired sign test used the three discordant requests where only Level 2 produced an error. The resulting p-value of 0.25 is not statistically significant due to the small sample size. We state this honestly: our strong empirical claims are 2.2 times speedup, 2.4 times cost reduction, and that Level 3 is never worse in any measured column."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Intuition** | **in-too-ISH-un** | Có 4 âm tiết; nhấn vào 'ISH'; đọc rõ 'too'. |
| **Percentile** | **per-SEN-tyl** | Có 3 âm tiết; nhấn vào 'SEN'; vần 'tyl' gieo âm giống 'mile'. |
| **Denial** | **dih-NY-ul** | Có 3 âm tiết; nhấn vào 'NY'; đuôi 'ul' đọc nhẹ. |
| **Cumulative** | **KYOO-myuh-luh-tiv** | Có 4 âm tiết; nhấn vào 'KYOO'; đuôi 'tiv' dứt khoát. |
| **Discordant** | **dis-KOR-dunt** | Có 3 âm tiết; nhấn vào 'KOR'; đuôi 'dunt' rõ ràng. |
| **Statistically** | **stuh-TIS-tih-klee** | Có 4 âm tiết; nhấn vào 'TIS'; đuôi 'klee' đọc nhẹ. |
| **Compliance** | **kum-PLY-ens** | Có 3 âm tiết; nhấn vào 'PLY'; đuôi 'ens' mềm. |
| **Significant** | **sig-NIF-ih-kunt** | Có 4 âm tiết; nhấn mạnh vào 'NIF'. |
| **Median** | **MEE-dee-un** | Có 3 âm tiết; nhấn vào 'MEE'; đuôi 'un' đọc nhẹ. |
| **Latency** | **LAY-ten-see** | Có 3 âm tiết; nhấn vào 'LAY'; đuôi 'see' rõ ràng. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Thể hiện sự hào hứng trước khi công bố số liệu thực nghiệm.
- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (nhanh hơn 18x, rẻ hơn 11x).
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo kịch tính sau câu hỏi dự đoán để người nghe tập trung.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
