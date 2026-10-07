# Kịch bản và ghi chú thuyết trình của Diễn giả 5

- **Họ và tên diễn giả:** Nguyen Phuong Nam
- **Vai trò trong đề tài:** Tổng quan tài liệu nghiên cứu liên quan; Thảo luận hạn chế nghiên cứu; Thiết kế trực quan slide; Chuẩn bị câu hỏi Q&A và điều phối thảo luận
- **Tỷ lệ phân công:** 15% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 2 phút 15 giây (135 giây)
- **Số từ mục tiêu:** ~290 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 11 và Slide 12

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Nguyen Phuong Nam. I am responsible for our literature review, research limitations, and Q&A session coordination."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 11: Thảo luận và các hạn chế nghiên cứu
- **Tiêu đề slide:** Limits and future work
- **Thời gian dự kiến trên slide:** 1 phút 15 giây (75 giây, ~160 từ)

> `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`  
> Thank you, Quy.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> In our literature review, commercial solutions like the Intercom Fin agent claim over seventy-five percent automated resolution. However, commercial systems rarely publish their internal failure modes or exact safety architectures. Our study provides a fully transparent, open-source benchmark.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> In scientific writing, we must also be completely honest about our study limitations.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> First, our benchmark uses fifty synthetic requests. Fifty requests across twenty-four types is a focused dataset. While we observed zero harmful actions in fifty requests, statistical rule-of-three estimation means the ninety-five percent upper confidence bound for harmful errors is about six percent, not absolute zero.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Second, our data is synthetic. While our customer profiles model real business states, real users write unstructured slang, emotional rants, and spelling mistakes.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Third, our Level One staff baseline assumes ninety seconds per request without measuring live human agents. In addition, while our Security rule was validated on twenty-four unseen held-out requests, fifty requests remains a focused sample size. These numbers represent an honest first measurement.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 12]`

---

### Slide 12: Kết luận, câu hỏi mở và chuyển sang Q&A
- **Tiêu đề slide:** Conclusion
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)

> To conclude our presentation, we built and tested a three-level customer support ladder for SaaS request triage.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Our findings deliver three clear takeaways:  
> First, Level Three combines Jev with DeepSeek to achieve a 2.2 times machine speedup and a 2.4 times cost reduction compared to the LLM agent, while remaining never worse in any measured outcome.  
> Second, Jev provides native probability calibration, enabling fast triage in under a quarter of a second.  
> And third, deterministic written rules provide unconditional safety. In five hundred and seventy-five forged attacks, our system executed zero unauthorized database actions.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> As our closing thought, we leave you with one final question: as generative AI models become smarter, where should software companies draw the line between automated AI and deterministic business rules?  
> 
> `[NGHỈ 2 GIÂY]`  
> 
> Thank you very much for listening. All five team members are now ready to answer your questions.

---

## 3. Câu nói chuyển tiếp sang phần hỏi đáp (Q&A)

Nói chính xác câu tiếng Anh này để mở đầu phần hỏi đáp:

> "Thank you very much for listening. All five team members are now ready to answer your questions."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời

### Question 1:
**"How does your state machine compare to real commercial customer support platforms like Intercom or Salesforce?"**
- **Câu trả lời ngắn (3 câu):**
  > "Commercial platforms rely heavily on static keyword triggers and manual routing rules configured by support administrators. Our architecture modernizes this workflow by inserting a fast neural classifier for automated triage, while preserving deterministic safety checks. It bridges modern AI capabilities with established enterprise reliability."

### Question 2:
**"If you had more time and budget, what would be your next experiment?"**
- **Câu trả lời ngắn (3 câu):**
  > "Our primary next step would be evaluating real, anonymized customer support logs from a live SaaS production system. We would also recruit professional support staff to benchmark true human response times and compare human agreement against our automated rules."

### Question 3:
**"Why does your paper say you did not perform post-hoc prompt tuning?"**
- **Câu trả lời ngắn (2 câu):**
  > "Post-hoc prompt tuning means repeatedly tweaking prompt words after looking at test errors until the score improves, which causes artificial overfitting. By reporting our honest first measurement, our results reflect genuine generalization rather than inflated test scores."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Literature** | **LIT-er-uh-chur** | Có 4 âm tiết; nhấn vào 'LIT'; đuôi 'chur' đọc nhẹ. |
| **Transparent** | **trans-PAIR-unt** | Có 3 âm tiết; nhấn vào 'PAIR'; đuôi 'unt' dứt khoát. |
| **Statistical** | **stuh-TIS-tih-kul** | Có 4 âm tiết; nhấn vào 'TIS'; đuôi 'kul' nhẹ. |
| **Bound** | **BOWND** | Có 1 âm tiết; phát âm giống 'round'; bật âm 'd'. |
| **Commercial** | **kuh-MUR-shul** | Có 3 âm tiết; nhấn vào 'MUR'; đuôi 'shul' đọc mềm. |
| **Takeaways** | **TAYK-uh-wayz** | Có 3 âm tiết; nhấn vào 'TAYK'; đuôi 'z' rung nhẹ. |
| **Unconditional** | **un-kun-DISH-un-ul** | Có 5 âm tiết; nhấn mạnh vào 'DISH'; đuôi 'ul' rõ. |
| **Generalization** | **jen-er-ul-ih-ZAY-shun** | Có 6 âm tiết; trọng âm chính rơi vào 'ZAY'. |
| **Overfitting** | **OH-vur-fit-ing** | Có 4 âm tiết; nhấn vào 'OH' và 'fit'. |
| **Coordination** | **koh-OR-dih-nay-shun** | Có 5 âm tiết; trọng âm chính rơi vào 'nay'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Quét mắt bao quát phòng học để duy trì sự ấm áp và tự tin.
- `[NGHỈ 1 GIÂY]`: Ngắt nhịp cẩn thận giữa các hạn chế nghiên cứu để thể hiện sự trung thực trong học thuật.
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo ấn tượng sâu sắc sau câu hỏi suy ngẫm trước khi chuyển sang phần Q&A.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
