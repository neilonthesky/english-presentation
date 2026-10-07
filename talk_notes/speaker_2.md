# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Quy tắc điều hướng Level 3; Kiểm tra quy tắc (Rules check) cho hoàn tiền, xóa dữ liệu, hủy gói và đổi mật khẩu; Security rule
- **Tỷ lệ phân công:** 22% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 1 phút 57 giây (117 giây). Giảm 25 giây so với bản trước vì phần bình chọn ở Slide 4 đã chuyển sang Long (Slide 2).
- **Số từ mục tiêu:** ~254 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 4 (45 giây) và Slide 5 (72 giây). Câu bàn giao cho Diễn giả 3 nằm ở cuối Slide 5. Nam **không đặt câu hỏi** và **không tổ chức bình chọn** với khán giả: mọi tương tác do Long thực hiện ở Slide 1 đến 3. Nội dung Security rule vẫn còn trong Slide 4 và Slide 5.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Nguyen Thanh Nam. I am responsible for our written rules, the Level 3 routing rules, and our state machine flow."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 4: Level 2 và các quy tắc bằng văn bản
- **Tiêu đề slide:** The written rules: allow or deny
- **Thời gian dự kiến trên slide:** 0 phút 45 giây (45 giây, ~95 từ)

> `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`  
> Thank you, Long.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> For refunds, only the account owner can ask. The purchase must be within fourteen days for a monthly plan, or thirty days for an annual plan. If a credit pack is used, or if the customer has two refunds in ninety days, the rule returns deny. Data deletion is always denied in chat, because it cannot be undone.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We check the Security rule first, for every state change. If a request says that someone else used the account or the card, the rule denies the action, and the reply gives the security steps.  
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 5]`

---

### Slide 5: Kiến trúc và luồng xử lý Level 3
- **Tiêu đề slide:** Level 3: Jev, fixed code, and an LLM
- **Thời gian dự kiến trên slide:** 1 phút 12 giây (72 giây, ~155 từ)

> In Level Three, Jev replaces the LLM agent as the step that chooses the action. In one call, it answers five questions about the chat, each with a confidence: the queue, the action, the priority, the risk flag, and the injection flag.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Look at the state machine with eight states. Triage runs Jev. If the injection flag is on, the action becomes Send reply, and the orders in the text are ignored.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Gather info is fixed code. It reads only the account fields that the action needs. Then the Rules check applies the written rules, with the Security rule first. If the rules allow, Do action runs it. If they deny, nothing runs. Last, the Final message step calls DeepSeek to write a polite reply. The LLM only writes words. It never decides the action.
> 
> `[NGHỈ 1 GIÂY]`  
> `[NHÌN SANG VU VAN SON]`  
> 
> Next, my teammate Vu Van Son will explain our experimental setup and synthetic benchmark dataset.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Diễn giả 3:

> "Next, my teammate Vu Van Son will explain our experimental setup and synthetic benchmark dataset."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Why does the Security rule read the Security queue and not the risk flag?"**
- **Câu trả lời ngắn (3 câu):**
  > "The risk flag only says that money, stored data, the plan, or the password is at stake. A valid refund has the same flag as a fraud case, so it cannot tell them apart. The Security queue says that the request reports use of the account by someone else, so the rule reads the queue and denies every state change."

### Câu hỏi 2:
**"Why do you permanently deny workspace data deletion in the chat?"**
- **Câu trả lời ngắn (2 câu):**
  > "Customer video assets and custom-trained AI weights are completely permanent to delete. Allowing a conversational chatbot to delete workspace data creates severe liability from accidental prompts or account hijackers, so our policy mandates secure web dashboard settings."

### Câu hỏi 3:
**"What does 'nothing runs' mean in your state machine?"**
- **Câu trả lời ngắn (2 câu):**
  > "If the classifier answer is invalid, or a written rule denies the action, no action runs and no data changes. The Final message then tells the customer the result and the steps that the customer can take alone."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Classifier** | **KLASS-ih-fy-er** | Có 4 âm tiết; nhấn mạnh vào 'KLASS'; phát âm rõ 'fy-er'. |
| **Deterministic** | **dih-TUR-mih-nis-tik** | Có 5 âm tiết; nhấn mạnh vào 'TUR' và 'nis'. |
| **Irreversible** | **eer-ih-VUR-sih-bul** | Có 5 âm tiết; nhấn mạnh vào 'VUR'; đuôi 'bul' đọc rõ. |
| **Security** | **sih-KYUR-ih-tee** | Có 4 âm tiết; nhấn vào 'KYUR'; đuôi 'tee' đọc nhẹ. |
| **Queue** | **KYOO** | Có 1 âm tiết; đọc giống chữ 'Q'; không đọc 'que-ue'. |
| **Calibrated** | **KAL-ih-bray-tid** | Có 4 âm tiết; nhấn vào 'KAL'; đuôi 'tid' dứt khoát. |
| **Probability** | **praw-buh-BIL-ih-tee** | Có 5 âm tiết; trọng âm chính rơi vào 'BIL'. |
| **Verdict** | **VUR-dikt** | Có 2 âm tiết; nhấn vào 'VUR'; đuôi 'dikt' đọc sắc. |
| **Teammate** | **TEEM-mayt** | Có 2 âm tiết; nhấn vào 'TEEM'; không đọc lướt thành 'team-it'. |
| **Triage** | **TREE-ahzh** | Có 2 âm tiết; nhấn vào 'TREE'; âm 'ahzh' kiểu Pháp nhẹ nhàng. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Bao quát toàn bộ lớp học trước khi nói.
- `[NGHỈ 1 GIÂY]`: Cho phép người nghe có thời gian xử lý các điều kiện quy tắc phức tạp.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
