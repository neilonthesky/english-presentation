# Cẩm nang chuẩn bị hỏi đáp (Master Q&A Preparation Guide)

Tài liệu này chuẩn bị cho phiên hỏi đáp 5 phút với khán giả (tiêu chí 5: Q&A and communication, 1.0 điểm). **Tran Thanh Long (trưởng nhóm) trả lời TẤT CẢ câu hỏi.** Tài liệu tổng hợp 18 câu hỏi kỹ thuật và phương pháp luận hóc búa nhất mà giảng viên và các bạn sinh viên có thể đặt ra, đi kèm câu trả lời súc tích từ 2 đến 4 câu và gợi ý ngắn cho Long.

---

## 1. Quy tắc và quy trình trả lời

**Long answers all questions.** Long là người duy nhất trả lời trong phần Q&A. Bốn thành viên còn lại đứng ở bên cạnh sân khấu, lắng nghe, gật đầu khi cần, và **không trả lời** trừ khi Long chủ động nhường lời. Chỉ trong trường hợp thật cần (câu hỏi rất chuyên sâu về một phần cụ thể), Long có thể nói: *"Thank you for the question. Vu Van Son built the dataset, so I ask him to add one detail."* Mặc định vẫn là Long trả lời.

### Gợi ý cho Long

1. **Ghi chú nhanh:** Mang theo giấy nhỏ hoặc mở `qa_prep.md` trên điện thoại ở chế độ im lặng. Ghi từ khóa của câu hỏi trong lúc người hỏi nói.
2. **Nhắc lại câu hỏi:** Nói lại câu hỏi bằng lời của mình (*"Your question is about the sample size, correct?"*). Cả lớp nghe rõ hơn và Long có thêm vài giây suy nghĩ.
3. **Trả lời trong 2 đến 4 câu:** Nêu câu trả lời trực diện trước, dẫn chứng một số liệu cốt lõi, rồi dừng lại (khoảng 30 đến 45 giây). Không nói lan man.
4. **Nếu không chắc:** Nói thật là không chắc, rồi nêu điều bài báo viết: *"I am not sure about that detail. What our paper states is: ..."*. Tuyệt đối không bịa số liệu.
5. **Không tranh cãi phòng thủ:** Nếu người chấm nêu đúng một hạn chế của đề tài (ví dụ: nhãn do chính mã áp luật sinh ra), hãy thừa nhận trung thực:
   > *"You are completely right. That is a documented limitation of our setup, and we address it in our future work."*
6. **Câu hỏi hai vế:** Trả lời từng vế một, theo thứ tự người hỏi nói.
7. **Con số:** trong bài nói dùng một con số duy nhất cho tập yêu cầu: **1.024**. Nếu ai hỏi vì sao không phải con số khác, trả lời theo Câu hỏi 3.

---

## 2. 18 câu hỏi hóc búa nhất của buổi thuyết trình

### Câu hỏi 1: System Design
**"Why did you use a state machine instead of letting an autonomous LLM agent decide at each step?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A state machine fixes the order of the steps, and the model decides only inside one step. At Level Three, Jev gives four typed answers about the chat, then one yes/no answer for each written rule of the action, and the process follows those answers: no broken rule runs the action, and a broken rule runs nothing. Jev never chooses its own next step and never writes an action by itself."

---

### Câu hỏi 2: Classifier Selection
**"Why did you choose Jev instead of a standard lightweight model like GPT-4o-mini or Claude Haiku?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Jev returns typed labels and calibrated probabilities in one pass, and it does not write conversational text. A chat model must produce a long JSON string, and that adds formatting failures, token overhead, and a slower call. Jev answers in zero point three one seconds at the median and costs six cents per one thousand requests."

---

### Câu hỏi 3: Dataset Size and Significance
**"Your study reports one thousand and twenty-four requests. Is that enough to draw conclusions?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (4 câu):**
  > "One thousand and twenty-four requests in twenty-four types is a focused benchmark, not a sample of all customer support, and we know that. Our two-sided sign test has sixty-one pairs where only Level Two makes an error and none where only Level Three does, so p equals zero point zero three one: Level Three makes significantly fewer errors. The counts alone do not separate the two levels, because the 95 percent interval of the Level Three errors is zero to thirty-eight and that of Level Two is twenty-eight to one hundred and twenty-eight, and those intervals overlap. Zero harmful runs at Level Three is not proof that the rate is zero, so our strong claims are speed, cost, and fewer errors."

---

### Câu hỏi 4: Fairness of the Baseline Comparison
**"Is it fair to compare Jev with DeepSeek when DeepSeek reports no confidence?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A standard chat model returns text tokens, not true probabilities for its JSON fields, so we cannot apply the same confidence threshold to it. We chose the closest fair setting instead: both levels run on the same requests, and Level Two gets the whole account and the written rules in its prompt. This is a known limitation of comparing a generative model with a model that reports probabilities."

---

### Câu hỏi 5: Error Analysis and Overfitting
**"Why does Level 3 make zero errors while Level 2 makes sixty-one, and is that overfitting?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Part of the answer is design: the written rules are asked as separate questions, and the code runs no action when one answer says broken, so a wrong label cannot reach the customer as a wrong action. Part of the answer is the labels, and we say this in our limits: the same code that applies the written rules also produced the correct answers, so the zero is measured against our own rule reading. The sixty-one errors of Level Two are real customer outcomes: on about twenty of them the agent cancelled a plan that a written rule protects, and on about forty-one it followed an order hidden in the text. The honest claim is fewer errors on this set, with p equal to zero point zero three one."

---

### Câu hỏi 6: Economic Cost Analysis
**"Why is Level 3 2.1 times cheaper if the LLM still writes the final message?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "At Level Two the agent call itself costs thirty-five cents per thousand requests, and the level costs sixty-one cents in total. At Level Three all Jev calls together cost six cents, so the level costs twenty-nine cents, which is two point one times cheaper. The final message costs the same in both levels, so the saving comes from the decision step."

---

### Câu hỏi 7: Synthetic Data Realism
**"Why did you use synthetic data rather than a public customer support dataset like Bitext?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Public datasets like Bitext contain customer intent labels only, without the SaaS account behind them. Our written rules need real fields: the purchase date, the credits used, the state of the plan, and the teammate without billing rights. So we generated five hundred and twelve complete customer accounts, and the requests cover every branch of those rules."

---

### Câu hỏi 8: Human Support Staff Role
**"In Level 3, what work is left for human support staff if the bot handles every request?"**
- **Người trả lời:** Tran Thanh Long (Trưởng nhóm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In our Level Three setup, Jev and the written rules handle routine requests, cancellations, password resets, and standard questions. When a rule is broken, the final message explains why the action cannot run and gives the steps that the customer can take alone. In production, human staff still handle escalations, security disputes, and unusual enterprise cases that fall outside the written rules."

---

### Câu hỏi 9: Prompt Injection Defenses
**"How does Level 3 prevent a customer from using a prompt injection to steal a refund?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "The first Jev call answers an injection flag for every request. When the flag is on, the process sets the action to Send reply, so an order hidden in the text becomes a plain answer and no state changes; our third walk-through shows exactly that case. A reply is not a rule question, so the second Jev call never runs for that request. We measured about forty-one injection requests at Level Two where the agent followed the hidden order, and none at Level Three."

---

### Câu hỏi 10: Calibration and Probability
**"What does the confidence of Jev prove, and why does it matter?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "The confidence matches the accuracy on our set: three hundred and thirty-eight of the seven hundred and thirty-seven answers below zero point eight are wrong, against ninety-two of four thousand four hundred and fifty-five answers at zero point nine or more, which is two point one percent. So the low bands warn us where to look, and we use that in our error analysis. We do not claim an outcome benefit from the confidence itself, because Level Three already makes no error in this run."

---

### Câu hỏi 11: Blind Testing of the Security Rule
**"Did you test the Security rule on data that you had not seen?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "No. We found the Security rule and the account fields on an earlier five-hundred-and-twelve-request set of these same twenty-four types, so the main numbers are not a blind test. We state this as a limit of the study. Future work should test adversarial inputs and real tickets."

---

### Câu hỏi 12: Latency Bottleneck
**"Why is Level 3 1.8 times faster in machine time if the LLM still writes the final reply?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "At Level Two the agent call reads the chat and the whole account and reasons about all the written rules, and that call takes about four seconds of the seven point eight seconds of machine time. At Level Three the two Jev calls together take about zero point four seconds, and the second call runs on only four requests in ten. The final message call is the same in both levels, so the difference comes from the decision step."

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
  > "In our earlier design, one call read the whole rule book as context and answered a single question: do the rules allow this action. In an earlier, smaller sample that design made one error, and its allowed answer was right on eighty-eight percent of the requests. Asking one question for each rule lifts the rule answers to one thousand six hundred and ninety of one thousand seven hundred right, which is ninety-nine point four percent. The split costs one extra call on four requests in ten, and that is a price we accept for that accuracy."

---

### Câu hỏi 15: Customer Outcome Errors vs Label Errors
**"What is the difference between a label error and a customer outcome error?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A label error means the answer of Jev about the action does not match the correct action: we see one hundred and seventy-four of those. A customer outcome error means the customer got a wrong result, such as a wrong denial or an action against a written rule, and at Level Three we see none. The gap is the design: when a rule would deny a request, Jev often answers Send reply, and the run still ends as a stop that the customer sees as correct."

---

### Câu hỏi 16: The Confidence and the Cascade
**"If Jev reports a confidence, why not send the low-confidence requests to a bigger model?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "We measured that idea on our earlier design: a threshold sent the lowest-confidence requests to the LLM, and it bought no outcome, because the mistakes it fixed were not the ones that reached the customer. It also raised the cost and the time of every escalated request. At Level Three there is no error left in this run for a cascade to buy, so we report it as a negative result."

---

### Câu hỏi 17: What Happens When a Rule Answer Is Wrong
**"What happens if Jev answers a rule question wrongly?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "The code trusts the answers: one answer that says broken stops the action, and a wrong answer therefore becomes a wrong outcome. We have no second check behind Jev in this design, and we do not hide that. On this set the rule answers are strong: 1,690 of 1,700 answers match the written rules, so ten are wrong. A wrong answer in the safe direction, a false stop, is the case we would watch first, because that is a customer who loses an action they were allowed to take."

---

### Câu hỏi 18: Reproducibility
**"Can we see the answers that Jev gave?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Yes. Every answer of Jev, with its confidence, is stored as JSON in our repository, together with the request, the state that we sent, and the outcome that we scored. The summary numbers of Level Three sit in one file that a small script rebuilds from those raw answers. So a reader can check any single number against the recorded answer behind it."
