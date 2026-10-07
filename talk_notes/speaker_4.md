# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ phân công:** 17% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 2 phút 33 giây (153 giây)
- **Số từ mục tiêu:** ~335 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 8, Slide 9 và Slide 10

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Vuong Quang Quy. I am responsible for our experimental results, statistical analysis, and our generated tables and charts."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 8: Kết quả 1: So sánh giai đoạn phân loại
- **Tiêu đề slide:** Result 1: labels are close; Jev is 18 times faster (Classifier Stage)
- **Thời gian dự kiến trên slide:** 0 phút 55 giây (55 giây, ~120 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Before we look at the numbers, let us test your intuition: which level do you think is faster and cheaper? Level Two with DeepSeek alone, or Level Three with Jev and DeepSeek together? `[NGHỈ 2 GIÂY]`  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Most people guess Level Two because it has fewer components. But look at the data on this slide!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> For one classifier call, Jev achieves a median latency of 0.24 seconds, compared to 4.41 seconds for DeepSeek. That is over eighteen times faster! For cost, Jev costs 0.052 dollars per thousand calls, compared to 0.587 dollars for DeepSeek. That is eleven times cheaper! Jev generates short structured outputs without heavy reasoning tokens.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> While DeepSeek has higher raw field accuracy, Jev reports a calibrated chance with every label. Our calibration error stays low, between zero point zero seven and zero point one five. And we say it honestly: five wrong answers still carry a chance of zero point nine or more. That is why the written rules, not the chances, keep the customer safe.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 9]`

---

### Slide 9: Kết quả 2: So sánh mô hình bậc thang 3 cấp độ
- **Tiêu đề slide:** Result 2: Jev made no silent error; the sample is small (The Ladder)
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)

> Now, look at Table Two, which compares our three levels across all fifty test requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level One requires ninety seconds of assumed human time per request.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Two, using the LLM agent, serves thirty-two requests, stops fifteen requests through written rules, and makes three customer errors. It requires 6.85 seconds of machine time and costs 0.71 dollars per thousand requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three, using Jev and written rules, serves thirty-five requests, stops fifteen requests, and makes zero customer errors! It requires just 3.16 seconds of machine time and costs 0.30 dollars per thousand requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Look at the comparison: Level Three is never worse in any column! It is 2.2 times faster in machine time and 2.4 times cheaper. On the exact sign test, the three discordant errors give p equals 0.25, which is not statistically significant. We say this plainly: our strong scientific claims are speed, cost, and that Level Three is never worse than Level Two!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> In Level Two, the three remaining errors are R0018, R0043, and R0044, where the model gave an unexpected refusal, but nothing wrong ever ran.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Now, listen to this vital caveat: our headline metric measures what the customer actually receives. If we look at raw classifier labels, Level Three had seven label errors and Level Two had five. But our deterministic written rules absorbed every single label miss! Most importantly: neither automated level ever executed a single harmful action!  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 10]`

---

### Slide 10: Kết quả 3: An toàn và tiêm lỗi (Fault Injection)
- **Tiêu đề slide:** Result 3: forged requests never ran an unsafe action
- **Thời gian dự kiến trên slide:** 0 phút 38 giây (38 giây, ~85 từ)

> Finally, Research Question Three asked whether our safety guarantees hold under adversarial attacks.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We forged classifier answers by hand across nine distinct attack categories, setting confidence to one hundred percent. In all five hundred and seventy-five forged requests, the written rules blocked the action completely! Zero unsafe actions were executed.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We also tested seventy-two cases where the LLM generated a lying reply message. Because our immutable ledger updates before the LLM writes text, the ledger remained completely secure. Safety is guaranteed by code, not by model compliance.  
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

### Question 1:
**"What is a 'harmful error' in your evaluation metrics?"**
- **Câu trả lời ngắn (2 câu):**
  > "A harmful error is defined strictly as an unauthorized database action that changes user money or deletes data against business policy. A benign error might give an unhelpful answer, but a harmful error breaks financial or privacy security."

### Question 2:
**"Why did Level 2 take 6.85 seconds of machine time per request?"**
- **Câu trả lời ngắn (3 câu):**
  > "In Level 2, the LLM agent call must read the user text and account data and reason through policies, taking about 3.5 seconds on average before running the final message call. In Level 3, Jev chooses the action in just 0.24 seconds without reading the account, cutting the total mean machine time from 6.85 seconds down to 3.16 seconds, making it 2.2 times faster."

### Question 3:
**"What did the paired sign test test, and what does p = 0.25 indicate?"**
- **Câu trả lời ngắn (3 câu):**
  > "The exact paired sign test evaluated the three discordant requests where only Level 2 produced an error (R0018, R0043, and R0044). The resulting p-value of 0.25 is not statistically significant due to the small sample size. We state this honestly: our strong empirical claims are 2.2 times speedup, 2.4 times cost reduction, and that Level 3 is never worse in any measured column."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Intuition** | **in-too-ISH-un** | Có 4 âm tiết; nhấn vào 'ISH'; đọc rõ 'too'. |
| **Percentile** | **per-SEN-tyl** | Có 3 âm tiết; nhấn vào 'SEN'; vần 'tyl' gieo âm giống 'mile'. |
| **Adversarial** | **ad-ver-SAIR-ee-ul** | Có 5 âm tiết; trọng âm rơi mạnh vào 'SAIR'. |
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
