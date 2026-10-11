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
5. **Không tranh cãi phòng thủ:** Nếu người chấm nêu đúng một hạn chế của đề tài (ví dụ: cỡ mẫu nhỏ), hãy thừa nhận trung thực:
   > *"You are completely right. That is a documented limitation of our synthetic test set, and we address it in our future work."*
6. **Câu hỏi hai vế:** Trả lời từng vế một, theo thứ tự người hỏi nói.

---

## 2. 18 câu hỏi hóc búa nhất của buổi thuyết trình

### Câu hỏi 1: System Design
**"Why did you use a deterministic state machine instead of letting an autonomous LLM agent make decisions at each step?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A state machine fixes the order of the steps, and the model decides only inside one step. At Level 3, Jev decides, and the process follows its answer: allow runs the action, and deny runs nothing. We measured a version with a fixed check behind Jev; the version where Jev reads the rules as context we have not run."

---

### Câu hỏi 2: Classifier Selection
**"Why did you choose Jev instead of using a standard lightweight model like GPT-4o-mini or Claude Haiku?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Jev is a specialized System One classifier that outputs typed structured labels and calibrated probabilities in a single network pass without generating conversational text. Traditional chat models must parse long JSON strings, which creates formatting failures and token overhead. As our results show, Jev achieves a median latency of 0.263 seconds and costs ten point nine times less than calling an LLM classifier."

---

### Câu hỏi 3: Dataset Size and Significance
**"Your dataset only contains 100 requests. Isn't that sample too small to draw conclusions?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (4 câu):**
  > "One hundred requests in twenty-four types is a focused benchmark, and we chose to run it live against hosted commercial APIs without simulated mocks. Our exact two-sided sign test has six pairs where only Level 2 makes an error and none where only Level 3 does, so p equals 0.031 and Level 3 makes significantly fewer errors. The counts alone do not separate the two levels: the Wilson 95 percent interval of the errors of Level 2 is 2.8 to 12.5 percent and that of Level 3 is 0.0 to 3.7 percent, and the two intervals overlap. Zero harmful runs at Level 3 in one hundred requests is not proof of zero, for the same reason, so our strong empirical claims are speed, cost, fewer errors, and that Level 3 is never worse in any measured column."

---

### Câu hỏi 4: Fairness of the Baseline Comparison
**"Is it fair to compare Jev with DeepSeek when DeepSeek did not have access to a confidence floor?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Standard chat LLMs only return text tokens and do not report true predictive probabilities for their JSON fields. Because DeepSeek reports no calibrated confidence scores, we could not apply an identical numerical confidence floor to it. This is a recognized fairness limitation of comparing generative models against native probabilistic classifiers."

---

### Câu hỏi 5: Error Analysis and Overfitting
**"Why did Level 3 achieve 0 errors while Level 2 made 6 errors, and is 0 errors overfitting?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In the design that we measured, Jev names the action and a fixed check applies the written rules, and the injection flag makes the action Send reply. The 6 errors of Level 2 are the other side of that coin: on two of them the agent ran a plan change against a written rule, and on four injection texts it read the order as the request. The zero is a result with the fixed check, on a set that we know; without the check, 22 of the errors of Jev run, and the new design has no error count yet."

---

### Câu hỏi 6: Economic Cost Analysis
**"Why is Level 3 2.2 times cheaper if the LLM still generates the final message?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In Level 2, the agent call costs 0.345 dollars per thousand requests, and the whole level costs 0.61 dollars. In the design that we measured, the Jev call replaces the agent call at 0.052 dollars, so the level costs 0.28 dollars, 2.2 times cheaper. In the new design Jev also reads the account and the rules, so its input is longer and its cost will be higher; we have not measured it."

---

### Câu hỏi 7: Synthetic Data Realism
**"Why did you use synthetic data rather than public customer support datasets like Bitext?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vu Van Son: Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Public datasets like Bitext only contain customer intent labels without the underlying SaaS account data. Our study required full customer profiles, including purchase dates, unused credit balances, and teammate permissions, to test the written rules. We generated 72 complete customers and one hundred requests in 24 distinct types to cover every rule branch."

---

### Câu hỏi 8: Human Support Staff Role
**"In Level 3, what work is left for human support staff if the bot handles every request?"**
- **Người trả lời:** Tran Thanh Long (Trưởng nhóm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In our Level 3 automated setup, the bot and the written rules handle all routine requests, plan cancellations, and standard FAQs. When a rule triggers a denial, the final message clearly explains why the action cannot run and gives manual self-service steps. In production, human staff handle escalated edge cases, security disputes, and complex enterprise account reviews that fall outside automated rules."

---

### Câu hỏi 9: Prompt Injection Defenses
**"How does Level 3 prevent a malicious user from using prompt injection to steal a refund?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "At Level 3, the injection flag of Jev makes the action Send reply, so the orders in the text are ignored. In the design that we measured, a fixed check also denied any refund that broke the written rules, even if Jev missed the injection. In the new design the rules are context for Jev, and we have not tested whether Jev alone resists an injection. That is the first thing we would test."

---

### Câu hỏi 10: Calibration and Probability
**"What does Expected Calibration Error prove about Jev, and why does it matter?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Expected Calibration Error measures whether the confidence that Jev reports matches its accuracy on our set. Our ECE runs from 0.052 on the topic to 0.145 on the action, and the wrong answers cluster in the low and middle bands: 24 of the 57 answers below 0.8 confidence are wrong, against 9 of the 190 answers at 0.9 or more. So we trust the high-confidence answers and let the written rules catch the rest, and we claim no outcome benefit from the confidence itself."

---

### Câu hỏi 11: Blind Testing of the Security Rule
**"Did you test the Security rule on data that you had not seen?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "No. We found the Security rule and the account-field selection on an earlier 50-request set of these same 24 types, so the main numbers are not a blind test. We state this as a limit of the study. Future work should test adversarial inputs and real tickets."

---

### Câu hỏi 12: Latency Bottleneck
**"Why is Level 3 1.9 times faster in machine time if DeepSeek still generates the final conversational reply?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In Level 2, the agent call reads the chat and the account and reasons about the rules, and it takes 3.97 seconds per request. The Final message call adds the rest, for 7.85 seconds of mean machine time. In the design that we measured, the Jev call takes 0.334 seconds and the total falls to 4.19 seconds, 1.9 times faster; in the new design Jev reads more input, so its time may be longer, and we have not measured it."

---

### Câu hỏi 13: Permanent Data Deletion
**"Why does your system permanently deny all data deletion requests in chat?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In a creative SaaS platform like FrameForge, deleting customer assets and trained video models is completely irreversible. Allowing a chatbot to delete production workspaces creates severe risks from accidental clicks or malicious account takeovers. Our written rules require customers to complete data deletion through authenticated account settings with two-factor confirmation."

---

### Câu hỏi 14: Security Topic vs Risk Flag
**"Why does the Security rule read the Security topic rather than the risk flag?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Nguyen Thanh Nam: Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In our first design, Jev answered a risk flag: money, stored data, the plan, or the password is at stake. A valid refund has the same flag as a fraud case, so the flag cannot tell them apart, and the Security rule read the topic. In the new design the risk flag is not one of the five questions; the Security rule is plain text in the context of Jev."

---

### Câu hỏi 15: Customer Outcome Errors vs Label Errors
**"What is the difference between a label error and a customer outcome error?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A customer outcome error means the customer got a wrong result, such as a wrong denial or an action against a written rule: Level 3 had zero such errors, while Level 2 had six, and two of the six ran a plan change that a written rule forbids. A label error means the action label of the classifier differed from the correct action: Level 3 had 16 misses and Level 2 had 10, because Jev is behind the LLM on four of the five fields. At Level 3 the written rules and the injection rule catch those misses, so none of them reaches the customer."

---

### Câu hỏi 16: The Confidence of the Classifier and the Cascade
**"If Jev gives a confidence, why not send the low-confidence requests to the LLM? Would a cascade fix the wrong labels?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình; phân tích thêm trong `experiment/results/cascade.json`)
- **Câu trả lời tiếng Anh (3 câu):**
  > "We tested a cascade that sends a request to the LLM when the chance of Jev on the action is below a threshold. It does not buy an outcome: at 0.9 it escalates 19 of the 100 requests and leaves the result at 70 served, 30 stopped, and 0 errors, while the cost rises from 0.28 to 0.42 dollars per 1,000 requests and the mean time from 4.19 to 6.24 seconds; at 0.99 it escalates 52 requests, costs 0.66 dollars, and the result gets worse (69 served, 30 stopped, 1 error). Level 3 already makes no error, so there is nothing left for the cascade to buy, and we report it as a negative result."

---

### Câu hỏi 17: What the Fixed Check Itself Buys
**"Is Jev or the fixed code the reason for zero errors, and what would happen without the check?"**
- **Người trả lời:** Tran Thanh Long (nội dung thuộc phần của Vuong Quang Quy: Kết quả và Mô hình; phân tích thêm trong `experiment/results/ablation.json`)
- **Câu trả lời tiếng Anh (4 câu):**
  > "We ran an ablation of the fixed check. Behind the recorded Level 2 agent the same check changes no run: zero discordant pairs, p = 1. Behind Jev it is worth 22 runs: without the check the recorded Jev labels give 66 served, 12 stopped, and 22 errors, every one of them harmful, against 70, 30, and 0 with it (sign test p = 4.8 times 10 to the minus 7). That is the nearest measurement to our new design, but not the same, because Jev now reads the account and the rules; so we cannot say how many errors would run."

---

### Câu hỏi 18: Removing the Fixed Check
**"Why did you remove the fixed rules check, and what is the evidence for the new design?"**
- **Người trả lời:** Tran Thanh Long (thiết kế mới là quyết định sau khi chạy thí nghiệm; các số liệu trong bài đo thiết kế có bước kiểm tra cố định)
- **Câu trả lời tiếng Anh (4 câu):**
  > "We want one decision step instead of two: Jev reads the chat, the account, and the rules, and the process follows its answer. This is a design change after the experiment, so there is no result for it yet. The nearest evidence is Jev without any check, which gave 22 harmful errors in 100 requests, so the open question is whether the rules and the account in the context of Jev close that gap. Our next test is exactly this run."
