# Kịch bản và ghi chú thuyết trình của Diễn giả 3

- **Họ và tên diễn giả:** Vu Van Son
- **Vai trò trong đề tài:** Xây dựng tập dữ liệu tổng hợp (100 yêu cầu qua 24 loại); Thiết kế thế giới khách hàng FrameForge; Thực thi thực nghiệm và đo lường API trực tiếp
- **Tỷ lệ phân công:** 18% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Son nói 120 giây trên tổng 900 giây.
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho ba slide: Slide 23 (42 giây), Slide 24 (38 giây), Slide 25 (40 giây).
- **Số từ mục tiêu:** ~249 từ (tốc độ ~120 đến 130 từ/phút, nói chậm vì có nhiều số liệu)
- **Slide phụ trách:** Slide 23 (42 giây): lần chạy thí nghiệm; Slide 24 (38 giây): cùng đầu vào và giá niêm yết; Slide 25 (40 giây): Kết quả 1 (Jev nhanh hơn 19.8 lần, rẻ hơn 10.9 lần). Câu bàn giao cho Quy nằm ở cuối Slide 25.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 23: Lần chạy: hai model, 600 lượt gọi
- **Tiêu đề slide:** The run: two hosted models, 600 calls
- **Thời gian dự kiến trên slide:** 0 phút 42 giây (42 giây, ~85 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment. We call two hosted models for real: Jev, version 1.13.0, and DeepSeek V4.1 Flash. A full run makes 600 model calls, 200 for each of the three runs. In the final recording, 412 LLM calls are live, and 0 Jev calls are live: those answers came from a cache. We ask two questions: what does each level buy and cost, and what changes when Jev replaces the LLM?  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 24]`

---

### Slide 24: Cùng đầu vào, giá niêm yết: một lần gọi tốn bao nhiêu
- **Tiêu đề slide:** Same input, list prices: what one call costs
- **Thời gian dự kiến trên slide:** 0 phút 38 giây (38 giây, ~78 từ)

> Both classifiers get the same input: the chat text, the sender role, the channel, and the matching help articles. Neither reads the account. Jev costs 4.2 cents per million input tokens, and its output is free. The LLM costs 15 cents in and 60 cents out per million tokens, with high reasoning effort. One Jev call writes 196 tokens, and one LLM call writes 690, because reasoning counts. All 600 calls cost about 17 cents at list price.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 25]`

---

### Slide 25: Kết quả 1: So sánh giai đoạn phân loại
- **Tiêu đề slide:** Result 1: Jev is 19.8x faster, 10.9x cheaper
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~86 từ)

> Now the first result. One Jev call takes 0.263 seconds at the median, and one LLM call takes 5.223 seconds: Jev is 19.8 times faster. Jev costs 5 cents per 1,000 requests, and the LLM costs 56 cents: 10.9 times cheaper. Jev is behind the LLM on four of the five answers, but ahead on the topic: 87.5% against 82.3%. Jev gives a wrong topic or action on 27 of the 100 requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG VUONG QUANG QUY]`  
> 
> Now my teammate Vuong Quang Quy will show what happens to these errors.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Quy (Diễn giả 4):

> "Now my teammate Vuong Quang Quy will show what happens to these errors."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why do you say that the experiment replays offline with the same numbers?"**
- **Câu trả lời ngắn (4 câu):**
  > "We save every model call in a local cache. A full run makes six hundred model calls. The final recording made four hundred and twelve live LLM calls and no live Jev call. So an offline replay of the main run gives every number in our paper."

### Câu hỏi 2:
**"Why does DeepSeek use 'high reasoning effort' if you only want five JSON fields?"**
- **Câu trả lời ngắn (4 câu):**
  > "DeepSeek writes internal reasoning tokens before it answers. This helps with hard requests where a customer wants two things at once. We chose high reasoning effort so that the LLM works at its best. But these tokens add time and cost."

### Câu hỏi 3:
**"What is the list pricing for Jev versus DeepSeek?"**
- **Câu trả lời ngắn (5 câu):**
  > "Jev costs 0.042 dollars for each million input tokens. Its output tokens are free. DeepSeek off-peak price is 0.15 dollars for each million input tokens. It is 0.60 dollars for each million output tokens, and this includes reasoning tokens. So each Jev call costs much less."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Seeded** | **SEE-did** | Có 2 âm tiết; nhấn vào 'SEE'; phát âm rõ 'did'. |
| **Generator** | **JEN-uh-ray-ter** | Có 4 âm tiết; nhấn vào 'JEN'; đuôi 'ter' đọc nhẹ. |
| **Fraud** | **FRAWD** | Có 1 âm tiết; vần với 'broad'; không đọc 'frau-dơ'. |
| **Injections** | **in-JEK-shunz** | Có 3 âm tiết; nhấn vào 'JEK'; kết thúc bằng âm rung 'z'. |
| **Cancellations** | **kan-suh-LAY-shunz** | Có 4 âm tiết; nhấn vào 'LAY'; kết thúc bằng âm 'z'. |
| **Reasoning** | **REE-zun-ing** | Có 3 âm tiết; nhấn vào 'REE'; 's' đọc thành 'z'. |
| **Temperature** | **TEM-per-uh-chur** | Có 4 âm tiết; nhấn vào 'TEM'; đuôi 'chur' đọc nhẹ. |
| **Recording** | **rih-KOR-ding** | Có 3 âm tiết; nhấn vào 'KOR'; đuôi 'ding' rõ ràng. |
| **Replay** | **ree-PLAY** | Có 2 âm tiết; nhấn vào 'PLAY'; 'ree' đọc ngắn. |
| **Cache** | **KASH** | Có 1 âm tiết; đọc giống 'cash'; không đọc 'ca-che'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`: Tư thế ấm áp, tự tin trước khi bắt đầu phần kỹ thuật.
- `[NGHỈ 1 GIÂY]`: Giúp khán giả theo dõi kịp các số liệu tập dữ liệu (72 hồ sơ, 100 yêu cầu, 24 loại).
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo điểm nhấn trước khi nêu 2 câu hỏi nghiên cứu trọng tâm.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
