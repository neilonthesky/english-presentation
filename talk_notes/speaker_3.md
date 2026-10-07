# Kịch bản và ghi chú thuyết trình của Diễn giả 3

- **Họ và tên diễn giả:** Vu Van Son
- **Vai trò trong đề tài:** Xây dựng tập dữ liệu tổng hợp (50 yêu cầu qua 24 loại); Thiết kế thế giới khách hàng FrameForge; Thực thi thực nghiệm và đo lường API trực tiếp
- **Tỷ lệ phân công:** 18% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 2 phút 42 giây (162 giây)
- **Số từ mục tiêu:** ~350 từ (tốc độ ~130 từ/phút)
- **Slide phụ trách:** Slide 7

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Vu Van Son. I am responsible for our synthetic benchmark dataset, our request taxonomy, and running the live experiments."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 7: Thiết lập thực nghiệm: Dữ liệu tổng hợp và gọi API thật
- **Tiêu đề slide:** Experiment: synthetic data, real model calls
- **Thời gian dự kiến trên slide:** 2 phút 42 giây (162 giây, ~350 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`  
> Thank you, Nam.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> To test our three levels fairly, we needed realistic customer requests with complete database states. Because public datasets do not include SaaS ledgers, we built a comprehensive synthetic benchmark.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We created a synthetic world of seventy-two FrameForge customers. Each customer profile has a real history: an active plan, a purchase date, an unused credit pack balance, and teammate account permissions. These profiles cover every combination of our written business rules.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> From this world, our seeded generator produced fifty distinct requests across twenty-four specific types. These fifty requests group into ten realistic families: product questions, refund requests, plan cancellations, password resets, data deletion attempts, billing disputes, fraud reports, prompt injections, complex mixed requests, and polite closing messages. Every request has its own unique wording, sender identity, and gold label verified by system code. In addition, we created a frozen held-out set of twenty-four new requests built before writing our rules to test against overfitting.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> To evaluate these requests, we made real network calls to two hosted commercial models. For Jev, we called version 1.13.0, a fast System One classifier. For the LLM, we called DeepSeek V4.1 Flash with high reasoning effort and a temperature of 0.3 through the DeepSeek API.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> In total, we ran the system on seven hundred and ninety-three requests: fifty live main requests, twenty-four live held-out requests, and seven hundred and nineteen forged or adversarial fault cases. The main run alone makes three hundred model calls, and every call is recorded to a permanent local cache. That means the whole experiment replays offline with identical numbers and zero live calls!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Our experiment investigates three clear research questions:  
> First, Question One: what does each level of the ladder buy and cost in terms of served requests, stopped requests, errors, latency, and API dollars?  
> Second, Question Two: how does Jev compare directly against DeepSeek in speed, token efficiency, and probability calibration?  
> And third, Question Three: do our written rules prevent unsafe financial actions when classifier outputs are forged maliciously?  
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

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời

### Question 1:
**"Why did you generate a held-out set of 24 requests in addition to the main 50?"**
- **Câu trả lời ngắn (3 câu):**
  > "When we added our Security rule, testing it only on the original fifty requests would risk overfitting. We generated twenty-four unseen requests across four distinct groups and froze the file before writing the rule. Testing both the risk flag and Security queue on this held-out set proved that the Security queue eliminated fraud errors with zero false stops."

### Question 2:
**"Why does DeepSeek use 'high reasoning effort' if you only want five JSON fields?"**
- **Câu trả lời ngắn (3 câu):**
  > "DeepSeek V4.1 Flash utilizes internal reasoning tokens to parse complex prompts and resolve conflicting intent signals. We gave DeepSeek high reasoning effort to ensure the LLM baseline performed at its maximum possible capability. However, this internal reasoning creates substantial latency and token costs."

### Question 3:
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
| **Maliciously** | **muh-LISH-us-lee** | Có 4 âm tiết; nhấn vào 'LISH'; đuôi 'shus' đọc nhẹ. |
| **Injections** | **in-JEK-shunz** | Có 3 âm tiết; nhấn vào 'JEK'; kết thúc bằng âm rung 'z'. |
| **Seeded** | **SEE-did** | Có 2 âm tiết; nhấn vào 'SEE'; phát âm rõ 'did'. |
| **Benchmarking** | **BENCH-mar-king** | Có 3 âm tiết; nhấn vào 'BENCH'; phát âm rõ 'ing'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`: Tư thế ấm áp, tự tin trước khi bắt đầu phần kỹ thuật.
- `[NGHỈ 1 GIÂY]`: Giúp khán giả theo dõi kịp các số liệu tập dữ liệu (72 hồ sơ, 50 yêu cầu, 24 loại).
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo điểm nhấn trước khi nêu 3 câu hỏi nghiên cứu trọng tâm.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
