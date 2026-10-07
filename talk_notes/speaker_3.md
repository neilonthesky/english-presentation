# Kịch bản và ghi chú thuyết trình của Diễn giả 3

- **Họ và tên diễn giả:** Vu Van Son
- **Vai trò trong đề tài:** Xây dựng tập dữ liệu tổng hợp (50 yêu cầu qua 24 loại); Thiết kế thế giới khách hàng FrameForge; Thực thi thực nghiệm và đo lường API trực tiếp
- **Tỷ lệ phân công:** 18% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 2 phút 42 giây (162 giây), không đổi
- **Số từ mục tiêu:** ~350 từ (tốc độ ~130 từ/phút)
- **Slide phụ trách:** Slide 6 (trước đây là Slide 7; bộ slide đã bỏ hai slide nên số slide giảm). Các phần nói về tập yêu cầu thứ hai, bộ yêu cầu giả mạo và câu hỏi nghiên cứu thứ ba đã bị bỏ; thay bằng chi tiết về dữ liệu và cách chạy lấy từ bài báo.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Nam. My name is Vu Van Son. I will explain our test data and our experiment."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 6: Thiết lập thực nghiệm: Dữ liệu tổng hợp và gọi API thật
- **Tiêu đề slide:** Experiment: synthetic data, real model calls
- **Thời gian dự kiến trên slide:** 2 phút 42 giây (162 giây, ~350 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`  
> Thank you, Nam. My name is Vu Van Son. I will explain our test data and our experiment.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> To test the three levels fairly, we need real customer requests with full account data. Public datasets have no SaaS accounts. So we built our own test data.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The test data has seventy-two FrameForge customers. Each customer has a real history. It has an active plan, a purchase date, and an unused credit pack balance. Each account also has a teammate with no billing rights. These customers cover every branch of our written rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A seeded generator wrote fifty requests in twenty-four types. The types form ten families. Five are product questions, refund requests, plan cancellations, password resets, and data deletion attempts. Five more are billing disputes, fraud reports, prompt injections, mixed requests, and closing messages. Every request has its own words and its own sender: forty-four owners and six teammates. The correct answers come from the written rules. Our generator runs the real code of the system. A written rule denies the action on fifteen of the fifty requests. Twenty-six end with an answer. Nine run an action.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We test these requests with real calls to two online models. For Jev, we call version 1.13.0, a fast classifier. For the LLM, we call DeepSeek V4.1 Flash through the DeepSeek API. We set high reasoning effort and a temperature of 0.3.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A full run makes three hundred model calls. We record every call. The final recording made one hundred and five live LLM calls and no live Jev call. We replay the main run offline, and it gives every number in the paper.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We ask two questions. Question One: what does each level give us, and what does it cost? We look at served requests, stopped requests, errors, time, and API dollars. Question Two: what changes when Jev replaces the LLM as the classifier? We look at speed, cost, and confidence.
> 
> `[NGHỈ 1 GIÂY]`  
> `[NHÌN SANG VUONG QUANG QUY]`  
> 
> Now my teammate Vuong Quang Quy will show our test results.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 4:

> "Now my teammate Vuong Quang Quy will show our test results."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why do you say that the experiment replays offline with the same numbers?"**
- **Câu trả lời ngắn (4 câu):**
  > "We save every model call in a local cache. A full run makes three hundred model calls. The final recording made one hundred and five live LLM calls and no live Jev call. So an offline replay of the main run gives every number in our paper."

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
| **Disputes** | **dih-SPYOOTS** | Có 2 âm tiết; nhấn vào 'SPYOOTS' với nguyên âm 'U' dài. |
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
- `[NGHỈ 1 GIÂY]`: Giúp khán giả theo dõi kịp các số liệu tập dữ liệu (72 hồ sơ, 50 yêu cầu, 24 loại).
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo điểm nhấn trước khi nêu 2 câu hỏi nghiên cứu trọng tâm.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
