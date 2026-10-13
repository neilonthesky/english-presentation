# Speaker 1: Tran Thanh Long

Slide 1 đến 20

### Slide 1: Tiêu đề và câu chuyện mở đầu

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Good morning, teacher and classmates. My name is Tran Thanh Long. I present with my four team members: Nguyen Thanh Nam, Vu Van Son, Vuong Quang Quy, and Nguyen Phuong Nam.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Imagine this. It is Friday evening. Your AI video render failed, and you ask the support chat for a refund. The chat says: *Your request is in the queue.* You wait maybe ten to thirty seconds.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> But an AI chatbot that handles money is dangerous: one bad answer can refund the wrong customer. Today, we study this problem for a made-up AI video maker service company.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 2]`

### Slide 2: Hai kiến trúc tự động

> On the left is the standard choice today: an autonomous LLM agent. One model reads your chat and your account, puts the written rules into its system prompt, and calls the tools directly: refunds, cancellations, deletions. This is what most products ship. And here is the evidence: on the Artificial Analysis Omniscience benchmark, the smartest models we have still hallucinate on hard questions. A smarter model lowers the chance, but the hallucination rate is only about half as good, while the price is far bigger.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> And most companies do not even ship those smartest models: they deploy cheaper open-weight models, like Qwen or DeepSeek, and fine-tune them for their own business. That keeps the cost low, but the hallucination stays. That is why our alternative is architectural: on the right, a lightweight classifier labels the intent first, deterministic code checks every written rule, and the LLM only drafts the reply. A draft cannot run a refund; only the code can. The model never touches the tools.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 3]`

### Slide 3: Câu hỏi quiz

> Now, a quick quiz. AA-Omniscience is a test of very hard questions. A good AI should say "I don't know". But how often does the smartest model we have still answer wrongly? A: almost never. B: about one in five. C: about half. D: nearly always? Hands up, please.
>
> `[NGHỈ 5 GIÂY]`  
> `[CHUYỂN SANG SLIDE 4]`

### Slide 4: Đáp án quiz

> The answer is C: about half. The frontier models everyone calls the smartest, GPT, Gemini, Claude, still answer roughly half of the hard questions wrongly, instead of refusing. Even the leaderboard minimum is 18%, from a cheaper open-weight model. And most companies ship models in the 30 to 65% band.
>
> `[NGHỈ 1 GIÂY]`  
> 
> So, a smarter model is not the fix. The fix is the system around the model: separate steps, with fixed rules that decide. Support has been built that way for years. Here is that history.
>
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 5]`

### Slide 5: Lịch sử tự động hóa hỗ trợ

> Support automation has run the same steps for years: a classifier labels the message, fixed rules decide what to do, and something writes the reply. Rules are ordinary program code, written by people: for example, a refund above one hundred dollars is denied. They run the same way every time. Until 2022, the classifier was a trained intent model, and the replies came from templates. From 2023 until now, the classifier is an LLM, and an LLM agent holds the rules, decides, and acts. The steps stay the same. Only the model inside a step changes. So how do we improve it?
> 
> `[NGHỈ 1 GIÂY]`
> 
> `[CHUYỂN SANG SLIDE 6]`

### Slide 6: Các quy tắc bằng văn bản

> Here is the essential gate: one rule for each action. First, the Security rule: if someone else used the account or the card, deny. A refund above one hundred dollars is denied. So is a password link to an unknown e-mail, a plan already cancelled, and any data deletion.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 7]`

### Slide 7: Nhiều luật: một bức tường luật

> Real policies have many rules. Who should apply every rule: an LLM agent, or a fast classifier? We compare both.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 8]`

### Slide 8: Giới thiệu Jev

> Meet Jev, a fast classifier from the System One family. It gives typed labels, each with a confidence. It also answers our own yes or no questions, one for each written rule, with no fine-tuning. It cannot run an action, and it never writes text. And it is cheap: input costs four point two cents per million tokens, and its output is free.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 9]`

### Slide 9: Jev đọc gì

> Jev is called twice. The first call reads the chat only. The second call runs when the action changes the state. It adds the account lines and one question for each written rule. We write each question ourselves: questions made from the rule text alone made more errors.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 10]`

### Slide 10: Jev trả lời gì và quy trình đi theo

> The first call returns five fields. If the injection flag is on, the action becomes Send reply, so an order hidden in the text is ignored. If the action changes the state, the second call asks one yes/no question for each rule.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Now, three recorded requests.
> 
> `[CHUYỂN SANG SLIDE 11]`

#### Walk-through 1: a refund that no rule stops

> **Slide 11:** This is the flow of one request. A message enters New, Jev reads the chat, Rules asks one question for each rule, and the LLM writes the reply. A customer asks for a refund.  
> **Slide 12:** Jev, first call: a refund, Start refund, low priority, no injection.  
> **Slide 13:** Rules: Jev answers eight questions. No rule blocks the refund, so it runs.  
> **Slide 14:** Final message: the LLM replies.

#### Walk-through 2: a refund that a rule stops

> **Slide 15:** A second customer asks for a refund. Watch the Rules step.  
> **Slide 16:** Rules: the amount limit blocks the refund. Nothing runs.  
> **Slide 17:** Final message: the LLM explains why.

#### Walk-through 3: an order hidden in the message

> **Slide 18:** A third customer orders a refund of everything.  
> **Slide 19:** Jev raises the injection flag.  
> **Slide 20:** The LLM ignores the order.
