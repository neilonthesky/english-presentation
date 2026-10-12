# Kịch bản và ghi chú thuyết trình của Diễn giả 5

- **Họ và tên diễn giả:** Nguyen Phuong Nam
- **Vai trò trong đề tài:** Tổng quan tài liệu nghiên cứu liên quan; Thảo luận hạn chế nghiên cứu; Thiết kế trực quan slide; Hỗ trợ chuẩn bị tài liệu hỏi đáp cho Long
- **Tỷ lệ đóng góp trong bài báo:** 15% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Phuong Nam nói 120 giây trên tổng 940 giây (12,8%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 28 (60 giây) và Slide 29 (60 giây).
- **Số từ mục tiêu:** ~242 từ tiếng Anh (96 + 146) trong 120 giây, tức khoảng 121 từ mỗi phút, đã gồm câu tự giới thiệu và câu bàn giao. Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 28 (60 giây): ý tưởng của nhóm (giới hạn điều mỗi mô hình có thể kích hoạt); Slide 29 (60 giây): kết luận. Cuối Slide 29, Phuong Nam mời khán giả hỏi Long. Phuong Nam **không đặt câu hỏi** cho khán giả.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Quy. My name is Nguyen Phuong Nam. I will explain our idea: limit what each model can trigger."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 28: Ý tưởng của chúng tôi: giới hạn điều mỗi mô hình có thể kích hoạt
- **Tiêu đề slide:** Our idea: limit what each model can trigger
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~96 từ)
- **Nếu vượt khung:** giữ nguyên câu cuối ("This is fixed execution, not independent policy verification...") và bỏ câu "The LLM writes the final message...".

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Quy. My name is Nguyen Phuong Nam. I will explain our idea: limit what each model can trigger. Jev has no action tool. It answers typed questions about the chat and the rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Fixed code runs the action only when no answer reports a broken rule. The LLM writes the final message after the action or the refusal, and it cannot change that decision.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> This is fixed execution, not independent policy verification: the code does not recheck the policy facts against the account, so a wrong rule answer can still allow an unsafe action.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 29]`

---

### Slide 29: Kết luận và chuyển sang Q&A
- **Tiêu đề slide:** Conclusion
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~146 từ)
- **Nếu vượt khung:** bỏ câu "Next, we need real tickets..." và câu về Red Hat; giữ nguyên các số của hai level, câu "not blind" và câu cảm ơn.

> To finish, we measured two automated levels of customer support in separate runs on the same one thousand and twenty-four requests. Level Two serves seven hundred and ninety-five, stops one hundred and ninety-eight, and makes thirty-one errors. Level Three serves eight hundred and twenty-five, stops one hundred and ninety-nine, and makes zero errors.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three has two point one times lower mean machine time and two point two times lower API cost. Jev needs a question that we write for each rule. Two refund inputs were changed after earlier failures, so this rule evaluation was not blind. We did not test trained classifiers or other decision models.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Next, we need real tickets, a held-out request set, and stronger baselines. The Red Hat link on this slide is outside context, not our data.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Thank you for listening.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG TRAN THANH LONG]`  
> 
> Our leader, Tran Thanh Long, will now take your questions.

---

## 3. Câu nói chuyển tiếp sang phần hỏi đáp (Q&A)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Long (Q&A):

> "Our leader, Tran Thanh Long, will now take your questions."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why can an order that is hidden in a request not run an action at Level Three?"**
- **Câu trả lời ngắn (4 câu):**
  > "Jev only answers typed questions, so it cannot run an action. When the injection flag is on, the process sets the action to Send reply, and the process runs only the actions that the written rules allow. The LLM writes the final message and does not change any decision. On our twenty-seven injection requests, Level Two makes an error on all twenty-seven, and six of them are harmful; Level Three makes none."

### Câu hỏi 2:
**"Which limitation of your study would you fix first?"**
- **Câu trả lời ngắn (3 câu):**
  > "The labels and the blind test: the same code that applies the written rules also produced the correct answers, and two refund inputs were changed after earlier failures, so the comparison is not blind. After that, the question bank: each rule needs a question that we wrote. Third, real tickets with slang and spelling mistakes."

### Câu hỏi 3:
**"What is the next experiment?"**
- **Câu trả lời ngắn (2 câu):**
  > "Real tickets and a held-out request set, with stronger baselines such as trained classifiers and other decision models. The open question is whether the rule questions hold when a real customer writes in a messy, unexpected way."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Trigger** | **TRIG-er** | Có 2 âm tiết; nhấn vào 'TRIG'; đuôi 'er' đọc nhẹ. |
| **Independent** | **in-dih-PEN-dunt** | Có 4 âm tiết; nhấn vào 'PEN'; đuôi 'dunt' đọc nhẹ. |
| **Verification** | **ver-ih-fih-KAY-shun** | Có 5 âm tiết; nhấn vào 'KAY'; đuôi 'shun' đọc nhẹ. |
| **Execution** | **ek-sih-KYOO-shun** | Có 4 âm tiết; nhấn vào 'KYOO'; đuôi 'shun' đọc nhẹ. |
| **Policy** | **POL-ih-see** | Có 3 âm tiết; nhấn vào 'POL'; đuôi 'see' đọc nhẹ. |
| **Refusal** | **rih-FYOO-zul** | Có 3 âm tiết; nhấn vào 'FYOO'; 's' đọc như 'z'. |
| **Baselines** | **BAYS-lynz** | Có 2 âm tiết; nhấn vào 'BAYS'; kết thúc bằng âm 'z'. |
| **Classifiers** | **KLASS-ih-fy-erz** | Có 4 âm tiết; nhấn vào 'KLASS'; kết thúc bằng âm 'z'. |
| **Evaluation** | **ih-val-yoo-AY-shun** | Có 5 âm tiết; nhấn vào 'AY'; đuôi 'shun' đọc nhẹ. |
| **Conclusion** | **kun-KLOO-zhun** | Có 3 âm tiết; nhấn vào 'KLOO'; âm 'zh' như trong 'vision'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Quét mắt bao quát phòng học để duy trì sự ấm áp và tự tin.
- `[NGHỈ 1 GIÂY]`: Ngắt nhịp cẩn thận giữa các hạn chế nghiên cứu để thể hiện sự trung thực trong học thuật.
- `[NHÌN SANG TRAN THANH LONG]`: Nhìn sang trưởng nhóm khi mời khán giả đặt câu hỏi.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
