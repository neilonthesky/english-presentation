# Cẩm nang chuẩn bị hỏi đáp (Master Q&A Preparation Guide)

Tài liệu này chuẩn bị cho nhóm 5 người trong phiên hỏi đáp 5 phút với khán giả (tiêu chí 5: Q&A and communication, 1.0 điểm). Tài liệu tổng hợp 15 câu hỏi kỹ thuật và phương pháp luận hóc búa nhất mà giảng viên và các bạn sinh viên có thể đặt ra, đi kèm câu trả lời súc tích từ 2 đến 4 câu, phân công diễn giả phụ trách chính và quy tắc phối hợp nhóm.

---

## 1. Quy tắc và quy trình trả lời của nhóm

1. **Trưởng nhóm điều phối chung:** Nếu giảng viên hoặc khán giả không chỉ định đích danh người trả lời, trưởng nhóm **Tran Thanh Long** lập tức bước lên, cảm ơn người hỏi và có thể trả lời trực tiếp hoặc chuyển tiếp cho thành viên chuyên trách (ví dụ: *"Thank you for that question. Vu Van Son built our synthetic dataset, so he will answer this point."*).
2. **Chuyển giao trực tiếp khi ngoài chuyên môn:** Nếu một thành viên nhận được câu hỏi nằm ngoài phần mình phụ trách, hãy trả lời câu mở đầu lịch sự rồi bàn giao cho đồng đội:
   > *"That is an important question. My teammate Nguyen Thanh Nam designed the written rules for that exact flow, so he will explain the logic."*
3. **Quy tắc 2 đến 4 câu:** Tuyệt đối không nói lan man. Giữ mỗi câu trả lời trong khoảng 2 đến 4 câu nói tiếng Anh (khoảng 30 đến 45 giây). Nêu câu trả lời trực diện trước, dẫn chứng kỹ thuật thực nghiệm cụ thể và dừng lại.
4. **Không tranh cãi phòng thủ:** Nếu người chấm nêu đúng một hạn chế của đề tài (ví dụ: cỡ mẫu nhỏ), hãy thừa nhận trung thực:
   > *"You are completely right. That is a documented limitation of our synthetic test set, and we address it in our future work."*

---

## 2. 15 câu hỏi hóc búa nhất của buổi thuyết trình

### Question 1: System Design
**"Why did you use a deterministic state machine instead of letting an autonomous LLM agent make decisions at each step?"**
- **Diễn giả phụ trách chính:** Nguyen Thanh Nam (Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Autonomous LLM agents are unpredictable because they can hallucinate actions and fall victim to prompt injection. Our deterministic state machine separates label classification from action execution completely. In our architecture, the code checks hard written rules before any money moves or data changes, guaranteeing financial safety."

---

### Question 2: Classifier Selection
**"Why did you choose Jev instead of using a standard lightweight model like GPT-4o-mini or Claude Haiku?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Jev is a specialized System One classifier that outputs typed structured labels and calibrated probabilities in a single network pass without generating conversational text. Traditional chat models must parse long JSON strings, which creates formatting failures and token overhead. As our results show, Jev achieves a median latency of 0.24 seconds and costs eleven times less than calling an LLM classifier."

---

### Question 3: Dataset Size and Significance
**"Your dataset only contains 50 requests. Isn't that sample too small to draw conclusions?"**
- **Diễn giả phụ trách chính:** Vu Van Son (Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (5 câu):**
  > "Fifty requests is a focused benchmark, which we chose to run live against hosted commercial APIs without simulated mocks. In total, the study covers seven hundred and ninety-three live and forged requests, including seven hundred and nineteen fault cases in which the written rules never let an unsafe action run. On the fifty main requests, our exact two-sided sign test on three discordant pairs yielded p equals 0.25, which is not statistically significant due to the small sample size. We state this plainly: our strong empirical claims are speed, cost, and that Level 3 is never worse in any measured column."

---

### Question 4: Fairness of the Baseline Comparison
**"Is it fair to compare Jev with DeepSeek when DeepSeek did not have access to a confidence floor?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Standard chat LLMs only return text tokens and do not report true predictive probabilities for their JSON fields. Because DeepSeek reports no calibrated confidence scores, we could not apply an identical numerical confidence floor to it. This is a recognized fairness limitation of comparing generative models against native probabilistic classifiers."

---

### Question 5: Error Analysis and Overfitting
**"Why did Level 3 achieve 0 errors while Level 2 made 3 errors, and is 0 errors overfitting?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Level 3 achieves zero customer errors because Jev names the requested action, the Security rule intercepts fraud reports, and our written rules stop illegal actions cleanly. To verify that this was not overfitting, we tested our Security rule on a frozen held-out set of twenty-four new requests built before writing the rule. On that held-out set, the Security rule eliminated all four fraud errors with zero false stops, proving the rule generalizes beyond the main test set."

---

### Question 6: Economic Cost Analysis
**"Why is Level 3 2.4 times cheaper if the LLM still generates the final message?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In Level 2, the LLM agent call costs 0.468 dollars per thousand requests and the Final message costs 0.244 dollars, totaling 0.71 dollars per thousand requests. In Level 3, Jev replaces the expensive agent call with a fast 0.052 dollar classifier call, reducing total pipeline cost to 0.30 dollars per thousand requests. Eliminating the heavy reasoning tokens of the agent decision stage cuts overall costs by 2.4 times."

---

### Question 7: Synthetic Data Realism
**"Why did you use synthetic data rather than public customer support datasets like Bitext?"**
- **Diễn giả phụ trách chính:** Vu Van Son (Tập dữ liệu và Thực nghiệm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Public datasets like Bitext only contain customer intent labels without the underlying SaaS database state. Our study required full user profiles, including subscription dates, unused credit balances, and teammate permission flags, to evaluate deterministic written rules. We generated 72 complete customer worlds with 24 distinct scenario types to test every single rule branch."

---

### Question 8: Human Support Staff Role
**"In Level 3, what work is left for human support staff if the bot handles every request?"**
- **Diễn giả phụ trách chính:** Tran Thanh Long (Trưởng nhóm)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In our Level 3 automated setup, the bot and the written rules handle all routine requests, plan cancellations, and standard FAQs. When a rule triggers a denial, the final message clearly explains why the action cannot run and gives manual self-service steps. In production, human staff handle escalated edge cases, security disputes, and complex enterprise account reviews that fall outside automated rules."

---

### Question 9: Prompt Injection Defenses
**"How does Level 3 prevent a malicious user from using prompt injection to steal a refund?"**
- **Diễn giả phụ trách chính:** Nguyen Thanh Nam (Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (4 câu):**
  > "Level 3 uses a two-layer defense against prompt injection. First, the Triage classifier detects injection attempts and fixes the internal action to 'Send reply', ignoring any hidden commands in the text. Second, even if an injection bypassed the classifier, the written rules check account ownership, purchase dates, and ledger history. The system will refuse to execute any refund that violates business rules."

---

### Question 10: Calibration and Probability
**"What does Expected Calibration Error prove about Jev, and why does it matter?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "Expected Calibration Error measures whether a model's predicted confidence matches its true historical accuracy. When Jev reports an answer with 90 percent confidence, it is actually correct about 90 percent of the time. This reliability allows our routing rules to trust high-confidence answers and route uncertain requests safely."

---

### Question 11: Safety Under Adversarial Conditions
**"What happens if an attacker corrupts the classifier output to output a high-confidence refund?"**
- **Diễn giả phụ trách chính:** Nguyen Thanh Nam (Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "We tested this exact failure mode in our fault injection experiment using 575 forged classifier requests. In all 575 cases, the deterministic written rules evaluated the user's ledger and blocked the action completely. A corrupted classifier cannot bypass our database checks because the model never possesses direct database execution permissions."

---

### Question 12: Latency Bottleneck
**"Why is Level 3 2.2 times faster in machine time if DeepSeek still generates the final conversational reply?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In Level 2, the LLM agent call takes 3.5 seconds on average to read the chat and account and reason about policies, before the final message call, resulting in 6.85 seconds mean machine time. In Level 3, Jev chooses the action in just 0.24 seconds without reading the account, cutting the total mean machine time to 3.16 seconds. That speedup cuts response latency by 2.2 times."

---

### Question 13: Permanent Data Deletion
**"Why does your system permanently deny all data deletion requests in chat?"**
- **Diễn giả phụ trách chính:** Nguyen Thanh Nam (Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "In a creative SaaS platform like FrameForge, deleting customer assets and trained video models is completely irreversible. Allowing a chatbot to delete production workspaces creates severe risks from accidental clicks or malicious account takeovers. Our written rules require customers to complete data deletion through authenticated account settings with two-factor confirmation."

---

### Question 14: Security Queue vs Risk Flag
**"Why did you choose the Security queue rather than the risk flag for the Security rule?"**
- **Diễn giả phụ trách chính:** Nguyen Thanh Nam (Quy tắc và Kiến trúc)
- **Câu trả lời tiếng Anh (3 câu):**
  > "We evaluated both variants on our frozen held-out test of twenty-four new requests. The risk flag was active on every action request, which caused eight false stops on completely valid customer refunds and cancellations. The Security queue label specifically identifies unauthorized account access, successfully stopping all four fraud attempts with zero false alarms."

---

### Question 15: Customer Outcome Errors vs Label Errors
**"What is the difference between a label error and a customer outcome error?"**
- **Diễn giả phụ trách chính:** Vuong Quang Quy (Kết quả và Mô hình)
- **Câu trả lời tiếng Anh (3 câu):**
  > "A customer outcome error means the customer experienced an incorrect result, such as an unauthorized action or an unhelpful response; Level 3 had zero such errors, while Level 2 had three. A label error means the raw model prediction differed from the gold label, where Level 3 had seven misses and Level 2 had five. Crucially, our deterministic written rules absorbed every single label miss in Level 3, ensuring perfect safety for the customer."
