# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Quy tắc điều hướng Level 3; Kiểm tra quy tắc cho hoàn tiền, xóa dữ liệu, hủy gói và đổi mật khẩu
- **Tỷ lệ phân công:** 22% tổng thời lượng thuyết trình
- **Thời gian nói được phân bổ:** 3 phút 18 giây (198 giây)
- **Số từ mục tiêu:** ~430 từ (tốc độ ~130 từ/phút)
- **Các slide phụ trách:** Slide 4, Slide 5 và Slide 6

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Hello everyone. My name is Nguyen Thanh Nam. I am responsible for our written rules, the Level 3 routing rules, and our state machine flow."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 4: Level 2 và các quy tắc bằng văn bản
- **Tiêu đề slide:** The written rules guard the actions
- **Thời gian dự kiến trên slide:** 1 phút 10 giây (70 giây, ~150 từ)

> `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`  
> Thank you, Long.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Let me ask you a quick poll question. If a customer might be a victim of fraud, which AI signal would you trust to block the transaction: a generic risk flag, or a specific Security queue label? `[NGHỈ 1 GIÂY]` Hands up for the risk flag? `[NGHỈ 2 GIÂY]` Hands up for the Security queue? `[NGHỈ 2 GIÂY]`  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Many people guess the risk flag. But our held-out test proved that the generic risk flag blocked eight completely valid refunds! That is why our architecture enforces strict, deterministic written rules.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Our rules guard four specific actions: starting refunds, deleting data, cancelling subscriptions, and resetting passwords. For FrameForge, deleting data means erasing uploaded images, video projects, and fine-tuned AI models. Because deletion is irreversible, our rules permanently deny all in-chat deletion requests!  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> For refunds, our code checks strict boundaries: only the account owner can ask. Teammate requests are denied. The purchase must be within fourteen days for monthly plans, or thirty days for annual plans. If a credit pack has already been used, or if the customer has made two refunds in ninety days, the rule returns deny.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Most importantly, we enforce our Security rule before every action: if a request reports that an account or card was used by someone else, all state changes stop immediately. The reply provides account freeze steps. The model cannot override these checks.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 5]`

---

### Slide 5: Kiến trúc và luồng xử lý Level 3
- **Tiêu đề slide:** Level 3: Jev decides labels; the LLM only writes text
- **Thời gian dự kiến trên slide:** 1 phút 12 giây (72 giây, ~155 từ)

> In Level Three, we replace the LLM agent with Jev as the component that chooses the action. Jev is a System One classifier. It does not write text and it never reads the account. Instead, Jev answers five specific questions from the chat in one single network call: the queue, the action, the priority, the risk flag, and the injection flag. Along with each label, Jev outputs a calibrated confidence score.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Look at the eight-step state machine on this slide.  
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The flow starts at New message saved. Then Triage runs: Jev classifies the request in one call. Triage carries only one routing rule: if Jev flags prompt injection, the orders inside the text are ignored, and the action becomes Send reply.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> After Triage, Gather info reads the account, but only the fields the named action needs. Then the Rules check, our fixed code, applies the written rules, including the Security rule: a request in the Security queue stops every state change. If the rules allow, Do action executes it. Finally, the Final message step calls DeepSeek to write a friendly, polite response explaining the outcome. The LLM only writes words. It never decides the action.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 6]`

---

### Slide 6: Kiểm chứng rule Security
- **Tiêu đề slide:** The Security rule, proven on held-out requests
- **Thời gian dự kiến trên slide:** 0 phút 56 giây (56 giây, ~120 từ)

> Now, one rule deserves a closer look: our Security rule. When a request reports that the account or a card was used by someone who is not the customer, every state change stops, and the reply gives the security steps.
>
> `[NGHỈ 1 GIÂY]`
>
> But which signal should the rule read: the generic risk flag, or the Security queue label? This chart is our proof. We built twenty-four new held-out requests, frozen before the rule existed. Without the rule, Level Three made four fraud errors. The risk flag variant would fix three of them, but it also stopped eight completely valid refunds and cancellations. The Security queue variant fixed all four errors with zero false stops, and at Level Two it fixed three of three.
>
> `[NGHỈ 1 GIÂY]`
>
> That is why the rule reads the queue label, and why fixed code, not a prompt, makes the decision.
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

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời

### Question 1:
**"How did you design the Security rule, and why use the Security queue instead of the risk flag?"**
- **Câu trả lời ngắn (3 câu):**
  > "We tested both variants on a frozen held-out set of twenty-four new requests built before writing the rule. The risk flag is active for all state-changing requests, so it caused eight false stops on valid refunds and cancellations. The Security queue label stopped all four fraud cases with zero false stops, providing a precise safety trigger."

### Question 2:
**"Why do you permanently deny workspace data deletion in the chat?"**
- **Câu trả lời ngắn (2 câu):**
  > "Customer video assets and custom-trained AI weights are completely permanent to delete. Allowing a conversational chatbot to delete workspace data creates severe liability from accidental prompts or account hijackers, so our policy mandates secure web dashboard settings."

### Question 3:
**"What does 'fail closed' mean in your state machine?"**
- **Câu trả lời ngắn (2 câu):**
  > "'Fail closed' means that if an API call times out, returns unparseable output, or encounters an internal error, the system defaults to safety. It blocks all database changes immediately and displays an informational message rather than guessing an action."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Classifier** | **KLASS-ih-fy-er** | Có 4 âm tiết; nhấn mạnh vào 'KLASS'; phát âm rõ 'fy-er'. |
| **Deterministic** | **dih-TUR-mih-nis-tik** | Có 5 âm tiết; nhấn mạnh vào 'TUR' và 'nis'. |
| **Irreversible** | **eer-ih-VUR-sih-bul** | Có 5 âm tiết; nhấn mạnh vào 'VUR'; đuôi 'bul' đọc rõ. |
| **Immutable** | **ih-MYOO-tuh-bul** | Có 4 âm tiết; nhấn vào 'MYOO' với nguyên âm 'U' kéo dài. |
| **Ledger** | **LEJ-er** | Có 2 âm tiết; nhấn vào 'LEJ'; âm 'j' mềm mại. |
| **Calibrated** | **KAL-ih-bray-tid** | Có 4 âm tiết; nhấn vào 'KAL'; đuôi 'tid' dứt khoát. |
| **Probability** | **praw-buh-BIL-ih-tee** | Có 5 âm tiết; trọng âm chính rơi vào 'BIL'. |
| **Verdict** | **VUR-dikt** | Có 2 âm tiết; nhấn vào 'VUR'; đuôi 'dikt' đọc sắc. |
| **Teammate** | **TEEM-mayt** | Có 2 âm tiết; nhấn vào 'TEEM'; không đọc lướt thành 'team-it'. |
| **Triage** | **TREE-ahzh** | Có 2 âm tiết; nhấn vào 'TREE'; âm 'ahzh' kiểu Pháp nhẹ nhàng. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - GIAO TIẾP ÁNH MẮT TRÁI VÀ PHẢI]`: Bao quát toàn bộ lớp học trước khi nói.
- `[NGHỈ 1 GIÂY]`: Cho phép người nghe có thời gian xử lý các điều kiện quy tắc phức tạp.
- `[NGHỈ 2 GIÂY]`: Ngắt nhịp chiến lược trước khi giải thích về tính không thể đảo ngược hoặc sổ cái an toàn.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
