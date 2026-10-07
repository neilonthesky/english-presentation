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

> "Hello everyone. My name is Vu Van Son. I am responsible for our synthetic benchmark dataset, our request taxonomy, and running the live experiments."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 6: Thiết lập thực nghiệm: Dữ liệu tổng hợp và gọi API thật
- **Tiêu đề slide:** Experiment: synthetic data, real model calls
- **Thời gian dự kiến trên slide:** 2 phút 42 giây (162 giây, ~350 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`  
> Thank you, Nam.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> To test our three levels fairly, we needed realistic customer requests with complete account data. Public datasets do not include SaaS accounts, so we built a synthetic benchmark.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The test data has seventy-two FrameForge customers. Each customer has a real history: an active plan, a purchase date, an unused credit pack balance, and a teammate with no billing rights. These profiles cover every branch of our written rules.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A seeded generator wrote fifty requests in twenty-four types. They group into ten families: product questions, refund requests, plan cancellations, password resets, data deletion attempts, billing disputes, fraud reports, prompt injections, mixed requests, and polite closing messages. Every request has its own wording and its own sender: forty-four owners and six teammates. The correct labels come from the written rules: our generator runs the real code of the system. A written rule denies the action on fifteen of the fifty requests, twenty-six end with an answer, and nine run an action.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> To evaluate these requests, we made real calls to two hosted models. For Jev, we called version 1.13.0, a fast System One classifier. For the LLM, we called DeepSeek V4.1 Flash with high reasoning effort and a temperature of 0.3 through the DeepSeek API.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A full run makes three hundred model calls, and we record every call. The final recording made one hundred and five live LLM calls and no live Jev call. An offline replay of the main run reproduces every number in the paper.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We ask two questions. Question One: what does each level buy and cost in served requests, stopped requests, errors, time, and API dollars? Question Two: what changes when Jev replaces the LLM as the classifier, in speed, cost, and confidence?  
> 
> `[NGHỈ 1 GIÂY]`  
> `[NHÌN SANG VUONG QUANG QUY]`  
> 
> Now, my teammate Vuong Quang Quy will present our live experimental results and comparative metrics.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 4:

> "Now, my teammate Vuong Quang Quy will present our live experimental results and comparative metrics."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why do you say that the experiment replays offline with the same numbers?"**
- **Câu trả lời ngắn (3 câu):**
  > "We record every model call to a local cache. A full run makes three hundred model calls, and the final recording made one hundred and five live LLM calls and no live Jev call. An offline replay of the main run reproduces every number in our paper."

### Câu hỏi 2:
**"Why does DeepSeek use 'high reasoning effort' if you only want five JSON fields?"**
- **Câu trả lời ngắn (3 câu):**
  > "DeepSeek V4.1 Flash utilizes internal reasoning tokens to parse complex prompts and resolve conflicting intent signals. We gave DeepSeek high reasoning effort so that the LLM performed at its best. However, this internal reasoning creates substantial latency and token costs."

### Câu hỏi 3:
**"What is the list pricing for Jev versus DeepSeek?"**
- **Câu trả lời ngắn (3 câu):**
  > "Jev charges a flat 0.042 dollars per million input tokens, and its structured output tokens are completely free. DeepSeek off-peak pricing charges 0.15 dollars per million input tokens and 0.60 dollars per million output tokens, which includes internal reasoning tokens. This pricing difference makes Jev dramatically cheaper per call."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Synthetic** | **sin-THET-ik** | Có 3 âm tiết; nhấn vào 'THET'; âm 'th' đọc nhẹ. |
| **Taxonomy** | **tak-SAW-nuh-mee** | Có 4 âm tiết; nhấn vào 'SAW'; phát âm rõ 'tak'. |
| **Commercial** | **kuh-MUR-shul** | Có 3 âm tiết; nhấn vào 'MUR'; đuôi 'shul' đọc mềm. |
| **Reproducible** | **ree-pruh-DOO-sih-bul** | Có 5 âm tiết; nhấn mạnh vào 'DOO'; đuôi 'bul' rõ ràng. |
| **Permanent** | **PUR-muh-nunt** | Có 3 âm tiết; nhấn vào 'PUR'; đuôi 'nunt' dứt khoát. |
| **Disputes** | **dih-SPYOOTS** | Có 2 âm tiết; nhấn vào 'SPYOOTS' với nguyên âm 'U' dài. |
| **Recorded** | **rih-KOR-did** | Có 3 âm tiết; nhấn vào 'KOR'; đuôi 'did' dứt khoát. |
| **Injections** | **in-JEK-shunz** | Có 3 âm tiết; nhấn vào 'JEK'; kết thúc bằng âm rung 'z'. |
| **Seeded** | **SEE-did** | Có 2 âm tiết; nhấn vào 'SEE'; phát âm rõ 'did'. |
| **Benchmarking** | **BENCH-mar-king** | Có 3 âm tiết; nhấn vào 'BENCH'; phát âm rõ 'ing'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`: Tư thế ấm áp, tự tin trước khi bắt đầu phần kỹ thuật.
- `[NGHỈ 1 GIÂY]`: Giúp khán giả theo dõi kịp các số liệu tập dữ liệu (72 hồ sơ, 50 yêu cầu, 24 loại).
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo điểm nhấn trước khi nêu 2 câu hỏi nghiên cứu trọng tâm.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
