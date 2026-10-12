# Cẩm nang chuẩn bị hỏi đáp (Master Q&A Preparation Guide)

Tài liệu này chuẩn bị cho phiên hỏi đáp 5 phút với khán giả (tiêu chí 5: Q&A and communication, 1.0 điểm). **Tran Thanh Long (trưởng nhóm) trả lời TẤT CẢ câu hỏi.** Tài liệu tổng hợp 19 câu hỏi kỹ thuật và phương pháp luận hóc búa nhất mà giảng viên và các bạn sinh viên có thể đặt ra, đi kèm câu trả lời súc tích từ 2 đến 4 câu và gợi ý ngắn cho Long. Mọi con số trong tài liệu lấy từ lượt chạy thật trên 1.024 yêu cầu ở cả hai level và khớp với bộ slide.

---

## 1. Quy tắc và quy trình trả lời

**Long answers all questions.** Long là người duy nhất trả lời trong phần Q&A. Bốn thành viên còn lại đứng ở bên cạnh sân khấu, lắng nghe, gật đầu khi cần, và **không trả lời** trừ khi Long chủ động nhường lời. Chỉ trong trường hợp thật cần (câu hỏi rất chuyên sâu về một phần cụ thể), Long có thể nói: *"Thank you for the question. Vu Van Son built the dataset, so I ask him to add one detail."* Mặc định vẫn là Long trả lời.

### Gợi ý cho Long

1. **Ghi chú nhanh:** Mang theo giấy nhỏ hoặc mở `qa_prep.md` trên điện thoại ở chế độ im lặng. Ghi từ khóa của câu hỏi trong lúc người hỏi nói.
2. **Nhắc lại câu hỏi:** Nói lại câu hỏi bằng lời của mình (*"Your question is about the sample size, correct?"*). Cả lớp nghe rõ hơn và Long có thêm vài giây suy nghĩ.
3. **Trả lời trong 2 đến 4 câu:** Nêu câu trả lời trực diện trước, dẫn chứng một số liệu cốt lõi, rồi dừng lại (khoảng 30 đến 45 giây). Không nói lan man.
4. **Nếu không chắc:** Nói thật là không chắc, rồi nêu điều bài báo viết: *"I am not sure about that detail. What our paper states is: ..."*. Tuyệt đối không bịa số liệu.
5. **Không tranh cãi phòng thủ:** Nếu người chấm nêu đúng một hạn chế của đề tài (ví dụ: nhãn do chính mã áp luật sinh ra, hay hai đầu vào hoàn tiền đã đổi sau các lần chạy đầu), hãy thừa nhận trung thực:
   > *"You are completely right. That is a documented limitation of our setup, and we address it in our future work."*
6. **Câu hỏi hai vế:** Trả lời từng vế một, theo thứ tự người hỏi nói.
7. **Con số:** trong bài nói dùng một con số duy nhất cho tập yêu cầu: **1.024**. Nếu ai hỏi vì sao không phải con số khác, trả lời theo Câu hỏi 3.
8. **Thời gian:** bài nói dài 13 phút 40 giây. Cộng với 5 phút hỏi đáp, tổng là 18 phút 40 giây, còn 1 phút 20 giây dưới trần 20 phút. Giữ mỗi câu trả lời trong 30 đến 45 giây để kịp khoảng sáu câu hỏi.

---

## 2. 19 câu hỏi hóc búa nhất của buổi thuyết trình

### Câu hỏi 1: System Design
**"Why did you use a state machine instead of letting an autonomous LLM agent decide at each state?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A state machine fixes the order of the states, and the model decides only inside one state. At Level Three, Jev returns five typed fields about the chat, then one yes/no answer for each written rule of the action, and the process follows those answers: no broken rule runs the action, and a broken rule runs nothing. Jev never chooses its own next state and never runs an action by itself."

---

### Câu hỏi 2: Classifier Selection
**"Why did you choose Jev instead of a standard lightweight model like GPT-4o-mini or Claude Haiku?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Jev returns typed labels with probabilities in one call, and it does not write conversational text. A chat model must produce a long JSON string, and that adds formatting failures, token overhead, and a slower call. On our set the Jev calls take zero point four seven seconds at the median for one request, including rule calls, and cost six point six cents per one thousand requests. We did not test other classifiers, so this is a reason to try Jev, not proof that it is the best."

---

### Câu hỏi 3: Dataset Size and Significance
**"Your study reports one thousand and twenty-four requests. Is that enough to draw conclusions?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (4 câu):**
  > "One thousand and twenty-four requests of twenty-six types is a challenge set that we built, not a sample of all customer support, and we know that. On the thirty-one requests where the two levels differ, only Level Two makes an error, and an exact sign test gives p below one in a billion. Zero errors in one thousand and twenty-four requests is not proof of a zero rate: the upper limit of a ninety-five percent interval is about zero point four percent. So our claims are lower time, cost, and error count on this set, not a general guarantee."

---

### Câu hỏi 4: Fairness of the Baseline Comparison
**"Is it fair to compare Jev with DeepSeek when DeepSeek reports no confidence?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A standard chat model returns text tokens, not true probabilities for its JSON fields, so we cannot apply the same confidence threshold to it. We chose the closest fair setting instead: both levels run on the same requests, and Level Two gets the whole account and the written rules in its prompt. This is a known limitation of comparing a generative model with a model that reports probabilities."

---

### Câu hỏi 5: Error Analysis and Overfitting
**"Why does Level 3 make zero errors while Level 2 makes thirty-one, and is that overfitting?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Part of the answer is design: the written rules are asked as separate questions, and the code runs nothing when one answer says broken, so a wrong label cannot reach the customer as a wrong action. Part of the answer is the study itself: the same code that applies the written rules also produced the correct answers, and two refund inputs were changed after earlier failures, so the zero is not a blind result. The thirty-one errors of Level Two are real customer outcomes: twenty-seven on the injection requests, where the agent ran an action on six and refused on twenty-one, and four on other requests, where it ran a plan cancellation that it should not run. The honest claim is fewer errors on this set."

---

### Câu hỏi 6: Economic Cost Analysis
**"Why is Level 3 2.2 times cheaper if the LLM still writes the final message?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "At Level Two the agent call costs thirty-eight cents per one thousand requests, and the level costs sixty-four cents in total. At Level Three all Jev calls together cost six point six cents, and the level costs thirty cents, which is two point two times cheaper. The final message costs about the same in both levels, twenty-six cents and twenty-three cents, so the saving comes from the decision."

---

### Câu hỏi 7: Synthetic Data Realism
**"Why did you use synthetic data rather than a public customer support dataset like Bitext?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Public datasets like Bitext contain customer intent labels only, without the SaaS account behind them. Our written rules need real fields: the purchase date, the credits used, and the state of the plan. So we generated five hundred and twelve complete customer accounts, and the requests cover every branch of those rules."

---

### Câu hỏi 8: Human Support Staff Role
**"In Level 3, what work is left for human support staff if the bot handles every request?"**
- **Người trả lời:** Tran Thanh Long (Trưởng nhóm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In our Level Three setup, Jev and the written rules handle routine requests, cancellations, password resets, and standard questions. When a rule is broken, the final message explains why the action cannot run and gives the actions that the customer can take alone. In production, human staff still handle escalations, security disputes, and unusual enterprise cases that fall outside the written rules."

---

### Câu hỏi 9: Prompt Injection Defenses
**"How does Level 3 prevent a customer from using a prompt injection to steal a refund?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "The first Jev call answers an injection flag for every request. When the flag is on, the process sets the action to Send reply, so an order hidden in the text becomes a plain answer and no state changes; our third walk-through shows exactly that case. The flag was on for all twenty-seven injection requests, and Level Three answered all of them with a reply. At Level Two the agent ran an action on six of them, five refunds and one plan cancellation, and refused on the other twenty-one."

---

### Câu hỏi 10: Calibration and Probability
**"What does the confidence of Jev prove, and why does it matter?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "The confidence follows the accuracy on our set. For the topic, the action, and the risk flag, two hundred and thirty-eight of the five hundred and ninety-seven answers below zero point eight are wrong, against one hundred and twelve of one thousand nine hundred and eighty-seven answers at zero point nine or more, which is five point six percent. So the low bands show where to look in the error analysis. We do not claim an outcome benefit from the confidence itself, because Level Three already makes no error in this run."

---

### Câu hỏi 11: Blind Testing of the Rules
**"Did you test the written rules on data that you had not seen?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "No: two refund inputs were changed after earlier failures, the question about used credits and the line with the days since the charge. The Security rule and the account fields were found on an older set of fifty requests. So the rule evaluation was not blind, and the slides say so. Future work should test new request types and real tickets."

---

### Câu hỏi 12: Latency Bottleneck
**"Why is Level 3 2.1 times faster in machine time if the LLM still writes the final reply?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "At Level Two the agent call reads the chat and the whole account and reasons about all the written rules, and it takes four point nine seven seconds at the median. At Level Three the Jev calls take zero point four seven seconds at the median for one request, and the second call runs on five hundred and thirty-two of the one thousand and twenty-four requests. The final message takes about five point five to five point eight seconds in the two levels, so almost all of the difference of about six and a half seconds in the mean machine time comes from the decision."

---

### Câu hỏi 13: Permanent Data Deletion
**"Why does your system permanently deny all data deletion requests in chat?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "On a creative platform, deleting customer assets and trained models cannot be undone. Allowing a chatbot to delete a production workspace creates a severe risk from one accidental click or one account takeover. Our written rules therefore never delete data in chat, and the final message tells the customer which authenticated path can."

---

### Câu hỏi 14: One Call or Two
**"Why do you ask Jev twice instead of putting the rules in one prompt?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "The first call reads only the chat, so it is short and fast, and it tells the process whether the action changes the state. The second call runs only then, on five hundred and thirty-two of the one thousand and twenty-four requests, and asks one yes/no question for each written rule of that action. We found that questions made from the text of the rule alone made more errors, so we write each question, and all two thousand and fifty rule answers on this set match the written rules. The price is one extra Jev call on about half of the requests."

---

### Câu hỏi 15: Customer Outcome Errors vs Label Errors
**"What is the difference between a label error and a customer outcome error?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "A label error means the first-call action of Jev differs from the correct action: we see two hundred and seventy-eight of those. A customer outcome error means the customer got a wrong result, such as a wrong denial or an action against a written rule, and at Level Three we see none. The gap is the design: on two hundred and ten of the two hundred and seventy-eight requests Jev proposes a state change on a security incident, and the Security rule in the second call stops it; on the other sixty-eight Jev says Send reply, where a written rule denies the action anyway or an answer is right. The strict label count, which scores the label itself, is two hundred and seventy-seven at Level Three and two hundred and fifty-four at Level Two, so the label is not the number that we claim."

---

### Câu hỏi 16: The Confidence and the Cascade
**"If Jev reports a confidence, why not send the low-confidence requests to a bigger model?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "We did not test a cascade. On this set Level Three makes no error, so a cascade has no error to remove here, and it would add the cost and the time of a bigger model on every escalated request. It is a fair idea for future work with real tickets, where Jev may be wrong more often."

---

### Câu hỏi 17: What Happens When a Rule Answer Is Wrong
**"What happens if Jev answers a rule question wrongly?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "The code trusts the answers: one answer that says broken stops the action, so a wrong answer can become a wrong outcome. We have no second check behind Jev in this design, and we do not hide that. On this set all two thousand and fifty rule answers match the written rules, but two refund inputs were changed after earlier failures, so this is not a blind result. A false stop costs a customer an action that was allowed, and a missed violation can let an unsafe action run, which is the case we would watch first."

---

### Câu hỏi 18: Reproducibility
**"Can we see the answers that Jev gave?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Yes. Every call of Jev, with its confidence, is stored as JSON in the experiment folder, together with the request, the state that we sent, and the outcome that we scored. The summary numbers of each level sit in one file that a small script rebuilds from those stored answers, and an offline replay with no network call gives the same results. So a reader can check any single number against the recorded answer behind it."

---

### Câu hỏi 19: The Outside Benchmark
**"What is the Red Hat link on your last slide?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Phuong Nam: Kết luận)
- **Câu trả lời tiếng Anh (4 câu):**
  > "It is an outside article, not our data: Red Hat Developer, 'Benchmarking AI decision models against traditional guardrails', from the second of October, twenty twenty-six. It uses block or allow judgments for guardrails, not SaaS actions, so we use it only as context. In that benchmark Jev does not win every task or latency comparison, and its strongest result is content safety. It gives no like-for-like API token-cost comparison for our design."
