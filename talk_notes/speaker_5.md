# Kịch bản và ghi chú thuyết trình của Diễn giả 5

- **Họ và tên diễn giả:** Nguyen Phuong Nam
- **Vai trò trong đề tài:** Tổng quan tài liệu nghiên cứu liên quan; Thảo luận hạn chế nghiên cứu; Thiết kế trực quan slide; Hỗ trợ chuẩn bị tài liệu hỏi đáp cho Long
- **Tỷ lệ phân công:** 15% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Phuong Nam nói 125 giây trên tổng 863 giây.
- **Thời gian nói được phân bổ:** 2 phút 05 giây (125 giây) cho ba slide: Slide 28 (35 giây), Slide 29 (55 giây), Slide 30 (35 giây).
- **Số từ mục tiêu:** ~370 từ trong 125 giây, tức khoảng 178 từ mỗi phút: nhanh hơn tốc độ nói rõ ràng thông thường, nên phải bấm giờ khi luyện. Nếu vượt khung, bỏ bớt câu phụ ở Slide 29 (ví dụ câu về tập yêu cầu thứ hai) và giữ nguyên các số liệu chính
- **Các slide phụ trách:** Slide 28 (35 giây), Slide 29 (55 giây) và Slide 30 (35 giây). Cuối Slide 30, Phuong Nam mời khán giả hỏi Long. Phuong Nam **không đặt câu hỏi** cho khán giả.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Quy. My name is Nguyen Phuong Nam. I will explain how Level 3 limits each model, and the limits of our work, and its limits."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 28: Ý tưởng của chúng tôi: giới hạn từng mô hình
- **Tiêu đề slide:** Our idea: limit what each model can trigger
- **Thời gian dự kiến trên slide:** 0 phút 35 giây (35 giây, ~90 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Quy. My name is Nguyen Phuong Nam. I will explain how Level 3 limits each model, and the limits of our work, and its limits. Text in a request can give orders to a model. So at Level Three, no model decides alone. Jev only answers typed questions. It cannot run an action. The process checks the written rules and runs the action. One broken rule is enough to stop it. The LLM only writes the final message. It does not change any decision. Result Two shows what this design buys.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 29]`

---

### Slide 29: Giới hạn nghiên cứu và điều chúng tôi khẳng định
- **Tiêu đề slide:** The gain is clear, but our evidence is small
- **Thời gian dự kiến trên slide:** 0 phút 55 giây (55 giây, ~140 từ)

> Our evidence is small: two hosted models, one synthetic SaaS product, and our own labels, which the same code that applies the rules produced. Both levels run on the same one thousand and twenty-four requests, and the intervals are wide: for example, the Level Three errors are zero, with a ninety-five percent interval from zero to thirty-eight, and the sign test gives p equal to zero point zero three one.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Jev needs a question that we write for each rule. We tried questions made from the text of the rule alone, and they made about sixty-one to one hundred and twenty-three errors of one thousand and twenty-four, against none for ours. We wrote our questions knowing the twenty-four request types, and a second set of requests did not change the result.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Real users write slang and make spelling mistakes. Our test data does not. The ninety seconds at Level One is assumed. We did not simulate the popup or the silence timer.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We found the Security rule and the account fields on an earlier five-hundred-and-twelve-request set of these same twenty-four types, so the main numbers are not a blind test.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 30]`

---

### Slide 30: Kết luận và chuyển sang Q&A
- **Tiêu đề slide:** Conclusion
- **Thời gian dự kiến trên slide:** 0 phút 35 giây (35 giây, ~110 từ)

> To finish, we tested three levels of customer support on the same one thousand and twenty-four requests. Level Two serves six hundred and seventy-six, stops two hundred and eighty-seven, and makes sixty-one errors. Level Three serves seven hundred and seventeen, stops three hundred and seven, and makes no error. Level Three is one point eight times faster and two point one times cheaper, and it makes fewer errors: it was never wrong where Level Two was right, and Level Two was wrong on sixty-one requests where it was right.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Jev needs a question that we write for each rule. The next step is real tickets and a larger set of requests.
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
  > "Jev only answers typed questions, so it cannot run an action. When the injection flag is on, the process sets the action to Send reply. The process runs only the actions that the written rules allow. The LLM writes the final message and does not change any decision."

### Câu hỏi 2:
**"Which limitation of your study would you fix first?"**
- **Câu trả lời ngắn (3 câu):**
  > "The labels, because the same code that applies the written rules also produced the correct answers, so the comparison is not independent. After that, the question bank: each rule needs a question that we wrote, and questions generated from the rule text alone made about sixty-one to one hundred and twenty-three errors of one thousand and twenty-four. Third, real tickets with slang and spelling mistakes."

### Câu hỏi 3:
**"What is the next experiment?"**
- **Câu trả lời ngắn (2 câu):**
  > "Real tickets and a larger set of requests, with adversarial inputs. The open question is whether the rule questions hold when a real customer writes in a messy, unexpected way."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Related** | **rih-LAY-tid** | Có 3 âm tiết; nhấn vào 'LAY'; đuôi 'tid' dứt khoát. |
| **Literature** | **LIT-ruh-chur** | Có 3 âm tiết; nhấn vào 'LIT'; đuôi 'chur' đọc nhẹ. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Adversarial** | **ad-ver-SAIR-ee-ul** | Có 5 âm tiết; nhấn vào 'SAIR'; các âm còn lại đọc lướt. |
| **Evidence** | **EV-ih-dens** | Có 3 âm tiết; nhấn vào 'EV'; đuôi 'dens' đọc nhẹ. |
| **Synthetic** | **sin-THET-ik** | Có 3 âm tiết; nhấn vào 'THET'; đuôi 'ik' ngắn. |
| **Interval** | **IN-ter-vul** | Có 3 âm tiết; nhấn vào 'IN'; đuôi 'vul' đọc rõ. |
| **Blind** | **BLYND** | Có 1 âm tiết; vần giống 'kind'; bật nhẹ âm 'd'. |
| **Limits** | **LIM-its** | Có 2 âm tiết; nhấn vào 'LIM'; đuôi 'its' đọc rõ. |
| **Conclusion** | **kun-KLOO-zhun** | Có 3 âm tiết; nhấn vào 'KLOO'; âm 'zh' như trong 'vision'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Quét mắt bao quát phòng học để duy trì sự ấm áp và tự tin.
- `[NGHỈ 1 GIÂY]`: Ngắt nhịp cẩn thận giữa các hạn chế nghiên cứu để thể hiện sự trung thực trong học thuật.
- `[NHÌN SANG TRAN THANH LONG]`: Nhìn sang trưởng nhóm khi mời khán giả đặt câu hỏi.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
