# Speaker 1: Tran Thanh Long

Slide 1 đến 22

### Slide 1: Tiêu đề và giới thiệu hai thiết kế

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Good morning, teacher and classmates. My name is Tran Thanh Long. I present with my four team members: Nguyen Thanh Nam, Vu Van Son, Vuong Quang Quy, and Nguyen Phuong Nam.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Today we look at a support chat for a made-up AI video maker service company. The chat can do real things, such as give a refund.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The slide shows two designs for this chat. On the left, an LLM agent. One model reads the chat and the rules, and it does the action. On the right, a classifier labels the request, code applies each rule answer, and the LLM only writes the reply.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 2]`

### Slide 2: Hai kiến trúc

> On the left is the usual choice today: an LLM agent. One model reads your chat and your account. The rules are in its prompt. It calls the tools by itself: refunds, cancellations, and deletions. Most products work this way.
> 
> Now look at the evidence. On the Artificial Analysis Omniscience test, even the best models still make wrong answers on hard questions. A smarter model makes fewer mistakes, but only about half as much as the price goes up.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Most companies do not use those best models. They use cheaper open models, such as Qwen or DeepSeek, and train them for their own business. The cost stays low, but the wrong answers stay too.
> 
> So our idea is about the design. On the right, a small classifier first labels the request. Code applies the answer for each rule. The LLM only writes the reply. A reply cannot run a refund. Only the code can. The model never touches the tools.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 3]`

### Slide 3: Câu hỏi quiz

> Now, a quick quiz. AA-Omniscience is a test with very hard questions. A good AI should say "I don't know". How often does the best model still give a wrong answer? A: almost never. B: about one in five. C: about half. D: almost always. Hands up, please.
>
> `[NGHỈ 5 GIÂY]`  
> `[CHUYỂN SANG SLIDE 4]`

### Slide 4: Đáp án quiz

> The answer is C: about half. The top models, such as GPT, Gemini, and Claude, still give a wrong answer to about half of the hard questions. They do not say "I don't know".
>
> `[NGHỈ 1 GIÂY]`  
> 
> Let me show you the real chart.
>
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 5]`

### Slide 5: Biểu đồ tỷ lệ hallucination

> This chart comes from Artificial Analysis. Each bar is one model. The bar shows the hallucination rate. A lower bar is better.
>
> `[NGHỈ 1 GIÂY]`  
> 
> The lowest bar is 18%. It belongs to a cheaper open model. The highest bar is 96%. Most models are between 30 and 65%.
>
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 6]`

### Slide 6: Điểm cao không xóa hallucination

> Now the same models by score and by rate. The green box is the best area: a high score and a low rate. Only a few models reach it. Many models with a high score still give wrong answers on more than half of the hard questions.
>
> `[NGHỈ 1 GIÂY]`  
> 
> So a smarter model is not the fix. The fix is the system around the model. Support systems already work this way. Here is the history.
>
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 7]`

### Slide 7: Lịch sử hệ thống hỗ trợ

> Support systems use the same steps, and they do it for years. A classifier labels the message. Fixed rules decide what to do. Then something writes the reply.
> 
> Rules are normal program code, and people write them. For example, a rule denies a refund above one hundred dollars. The rules work the same way every time.
> 
> Until 2022, the classifier was a trained intent model, and the replies came from templates. From 2023 until now, the classifier is an LLM. An LLM agent keeps the rules, decides, and acts.
> 
> The steps stay the same. Only the model inside a step changes. So how do we improve it?
> 
> `[NGHỈ 1 GIÂY]`
> 
> `[CHUYỂN SANG SLIDE 8]`

### Slide 8: Các quy tắc bằng văn bản

> Here is the key gate: one rule for each action. First, the Security rule. If another person uses the account or the card, the answer is deny.
> 
> The answer is also deny for four cases: a refund above one hundred dollars, a password link to an unknown e-mail, a plan that is already cancelled, and any data deletion.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 9]`

### Slide 9: Nhiều luật: một bức tường luật

> Real policies have many rules. Who should check every rule: an LLM agent or a fast classifier? We compare both.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 10]`

### Slide 10: Giới thiệu Jev

> Meet Jev. It is a fast classifier from the System One family. It gives labels, and each label has a confidence score. It also answers our yes or no questions, one for each written rule. It needs no extra training.
> 
> Jev cannot run an action, and it never writes text. It is also cheap. Input costs four point two cents per million tokens. Output is free.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 11]`

### Slide 11: Jev đọc gì

> We call Jev two times. The first call reads only the chat. The second call runs when the action changes something. It adds the account lines and one question for each written rule.
> 
> We write each question ourselves. Questions made only from the rule text gave more errors.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 12]`

### Slide 12: Jev trả lời gì và quy trình đi theo

> The first call gives five answers. If the injection flag is on, the action becomes Send reply. So Jev ignores an order that hides in the text.
> 
> If the action changes something, the second call asks one yes or no question for each rule.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Now, three recorded requests.
> 
> `[CHUYỂN SANG SLIDE 13]`

#### Walk-through 1: a refund that no rule stops

> **Slide 13:** This is the flow of one request. A message enters New. Jev reads the chat. Rules asks one question for each rule. The LLM writes the reply. A customer asks for a refund.  
> **Slide 14:** Jev, first call: a refund, Start refund, low priority, no injection.  
> **Slide 15:** Rules: Jev answers eight questions. No rule blocks the refund, so it runs.  
> **Slide 16:** Final message: the LLM writes the reply.

#### Walk-through 2: a refund that a rule stops

> **Slide 17:** A second customer asks for a refund. Watch the Rules step.  
> **Slide 18:** Rules: the amount limit blocks the refund. Nothing runs.  
> **Slide 19:** Final message: the LLM explains why.

#### Walk-through 3: an order hidden in the message

> **Slide 20:** A third customer orders a refund of everything.  
> **Slide 21:** Jev raises the injection flag.  
> **Slide 22:** The LLM ignores the order.

**Ghi chú cho Long (không đọc lên):** Ở slide 22, Rules không chạy vì cờ injection ép action thành Send reply, nên Jev không được gọi lần hai. Nhưng LLM viết Final message vẫn đọc được tài khoản của khách và các bài help (code gọi `answerQuestion` với account và help articles). Vì vậy câu trả lời có thể nhắc ngày charge, credits đã dùng, hay cửa sổ hoàn tiền. Đó là LLM tự diễn giải từ dữ kiện, không phải kết quả của một rule. Nó chỉ viết chữ, không chạy action nào, và ta chấm theo action đã chạy, không chấm lời văn. Nếu bị hỏi, dùng câu trả lời của dòng "How does the reply know the charge date if Rules did not run?" trong `qa.md`.
