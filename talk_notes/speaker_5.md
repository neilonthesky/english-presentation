# Kịch bản và ghi chú thuyết trình của Diễn giả 5

- **Họ và tên diễn giả:** Nguyen Phuong Nam
- **Vai trò trong đề tài:** Tổng quan tài liệu nghiên cứu liên quan; Thảo luận hạn chế nghiên cứu; Thiết kế trực quan slide; Chuẩn bị câu hỏi Q&A và điều phối thảo luận
- **Tỷ lệ phân công:** 15% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 2 phút 15 giây (135 giây)
- **Số từ mục tiêu:** ~290 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 9 và Slide 10 (trước đây là Slide 11 và 12). Thời gian không đổi: 2 phút 15 giây. Các phần nói về kiểm chứng riêng cho Security rule và về dữ liệu giả mạo đã bị bỏ khỏi cả hai slide; hạn chế nay nói thẳng rằng Security rule được thêm sau khi thấy lỗi gian lận trên 50 yêu cầu nên số liệu chính không phải kiểm tra mù.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Nguyen Phuong Nam. I am responsible for our literature review, research limitations, and Q&A session coordination."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 9: Thảo luận và các hạn chế nghiên cứu
- **Tiêu đề slide:** Limits and what we claim
- **Thời gian dự kiến trên slide:** 1 phút 15 giây (75 giây, ~160 từ)

> `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`  
> Thank you, Quy.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> In our literature review, the Intercom Fin agent reports over seventy-five percent resolution without a human. Commercial systems rarely publish how they fail. In scientific writing, we must be honest about the limits of our study.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> First, the evidence comes from two hosted models, one synthetic product, and our own labels: fifty requests in twenty-four types. Zero harmful runs in fifty requests is not proof of zero. The ninety-five percent upper limit is about six percent.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Second, real users write slang, emotional rants, and spelling mistakes, and our data is synthetic. Third, the ninety seconds at Level One is assumed, and we did not simulate the popup or the silence timer.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Last, we added the Security rule after fraud reports showed a defect on these fifty requests. So the main numbers are not a blind test. Also, the provider's prompt cache supplied 22.3 percent of the input tokens, so our costs are upper bounds.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 10]`

---

### Slide 10: Kết luận, câu hỏi mở và chuyển sang Q&A
- **Tiêu đề slide:** Conclusion
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)

> To conclude, we built three levels of customer support on one ladder and measured them on the same fifty requests.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We have three takeaways.  
> First, Level Three, with Jev and DeepSeek, is 2.2 times faster and 2.4 times cheaper than the LLM agent, and it is never worse in any measured outcome.  
> Second, Jev gives a confidence with every label, and it triages in under a quarter of a second.  
> And third, the written rules make a weaker classifier safe. Jev is behind the LLM on four fields, yet no wrong answer becomes an error of Level Three. A Security rule closes the fraud defect that we found.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> As our closing thought, we leave you with one question: as AI models become smarter, where should software companies draw the line between automated AI and fixed business rules?  
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

### Câu hỏi 1:
**"How does your state machine compare to real commercial customer support platforms like Intercom or Salesforce?"**
- **Câu trả lời ngắn (3 câu):**
  > "Commercial platforms rely heavily on static keyword triggers and manual routing rules configured by support administrators. Our architecture modernizes this workflow by inserting a fast neural classifier for automated triage, while preserving deterministic safety checks. It bridges modern AI capabilities with established enterprise reliability."

### Câu hỏi 2:
**"If you had more time and budget, what would be your next experiment?"**
- **Câu trả lời ngắn (3 câu):**
  > "Our primary next step would be evaluating real, anonymized customer support logs from a live SaaS production system. We would also recruit professional support staff to benchmark true human response times and compare human agreement against our automated rules."

### Câu hỏi 3:
**"Why do you say that your costs are upper bounds?"**
- **Câu trả lời ngắn (2 câu):**
  > "We use list prices with no cache discount, but the provider's prompt cache supplied 22.3 percent of the input tokens. So the real cost of every level is lower than the cost that we report."

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
| **Confidence** | **KON-fih-dens** | Có 3 âm tiết; nhấn mạnh vào 'KON'; đuôi 'dens' đọc nhẹ. |
| **Cache** | **KASH** | Có 1 âm tiết; đọc giống 'cash'. |
| **Blind** | **BLYND** | Có 1 âm tiết; vần giống 'kind'; bật nhẹ âm 'd'. |
| **Coordination** | **koh-OR-dih-nay-shun** | Có 5 âm tiết; trọng âm chính rơi vào 'nay'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Quét mắt bao quát phòng học để duy trì sự ấm áp và tự tin.
- `[NGHỈ 1 GIÂY]`: Ngắt nhịp cẩn thận giữa các hạn chế nghiên cứu để thể hiện sự trung thực trong học thuật.
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp tạo ấn tượng sâu sắc sau câu hỏi suy ngẫm trước khi chuyển sang phần Q&A.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
