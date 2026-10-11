# Kịch bản và ghi chú thuyết trình của Diễn giả 3

- **Họ và tên diễn giả:** Vu Van Son
- **Vai trò trong đề tài:** Xây dựng tập dữ liệu tổng hợp (1.024 yêu cầu qua 24 loại); Thiết kế thế giới khách hàng FrameForge; Thực thi thực nghiệm và đo lường API trực tiếp
- **Tỷ lệ phân công:** 18% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Son nói 120 giây trên tổng 858 giây.
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho ba slide: Slide 24 (42 giây), Slide 25 (38 giây), Slide 26 (40 giây).
- **Số từ mục tiêu:** ~315 từ trong 120 giây, tức khoảng 158 từ mỗi phút: nhanh hơn tốc độ nói rõ ràng thông thường (120 đến 130 từ/phút), nên phải bấm giờ khi luyện. Nếu vượt khung, giữ các số liệu chính và bỏ bớt các con số token chi tiết ở Slide 25
- **Slide phụ trách:** Slide 24 (42 giây): lần chạy thí nghiệm; Slide 25 (38 giây): số token và giá niêm yết; Slide 26 (40 giây): Kết quả 1 (Jev nhanh, rẻ và phần lớn đúng). Câu bàn giao cho Quy nằm ở cuối Slide 26. Son **không đặt câu hỏi** cho khán giả.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 24: Lần chạy: 1.024 yêu cầu
- **Tiêu đề slide:** Both levels run on the same 1,024 requests
- **Thời gian dự kiến trên slide:** 0 phút 42 giây (42 giây, ~90 từ)

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Nam. My name is Vu Van Son. I will explain how we ran the experiment. We call two hosted models for real: Jev, version one point thirteen, and DeepSeek V four point one Flash. Both levels run on the same one thousand and twenty-four requests. At Level Three, Jev answers the chat of every request once, and answers the rule questions on the four hundred and ten requests whose action changes the state: one thousand four hundred and thirty-four Jev calls.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Every count gets a ninety-five percent interval. We ask two questions: what does each level buy and cost, and when is Jev wrong, and does its confidence warn us?
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 25]`

---

### Slide 25: Số token và giá niêm yết: một lần gọi tốn bao nhiêu
- **Tiêu đề slide:** Level 3 reads less, so it costs about half
- **Thời gian dự kiến trên slide:** 0 phút 38 giây (38 giây, ~110 từ)

> Level Two reads the chat text, the sender role, the channel, the help articles, the whole account, and the written rules. Level Three reads less: the chat first, then only the account lines and the rule questions of one action. Jev costs four point two cents per million input tokens, and its output is free. The LLM costs fifteen cents in and sixty cents out per million tokens, with high reasoning effort. The first Jev call reads one thousand two hundred and thirty-three tokens and writes one hundred and ninety-six. The second call, on four hundred and ten of the requests, reads seven hundred and forty-three tokens and writes one hundred and five. One LLM agent call reads one thousand two hundred and twenty-nine tokens and writes two hundred and sixty-eight, because reasoning counts.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> At list price, for one thousand requests, Level Two costs sixty-one cents, and Level Three costs twenty-nine cents: for each request, one point four calls to Jev, and one to the LLM.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 26]`

---

### Slide 26: Kết quả 1: Jev nhanh, rẻ và phần lớn đúng
- **Tiêu đề slide:** Result 1: Jev is fast and cheap, and mostly right
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~105 từ)

> Now the first result, for Jev alone, over the one thousand and twenty-four requests. One Jev call takes zero point three one seconds at the median, and the Jev calls cost six cents per one thousand requests. Jev gives the right topic on eighty-eight percent of the requests, the priority on eighty-three percent, the action on eighty-three percent, and the injection flag on ninety-six percent. The rule questions are almost always right: one thousand six hundred and ninety of one thousand seven hundred answers match the written rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The action label is wrong on one hundred and seventy-four requests, but none of them ends in a wrong outcome: when a rule would deny a request, Jev often picks Send reply, and the result is still a stop. The intervals are wide.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG VUONG QUANG QUY]`  
> 
> Now my teammate Vuong Quang Quy will show what the confidence of Jev tells us.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Quy (Diễn giả 4):

> "Now my teammate Vuong Quang Quy will show what the confidence of Jev tells us."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"Are these numbers measured live, or replayed from a cache?"**
- **Câu trả lời ngắn (3 câu):**
  > "The Jev calls of Level Three are live calls to the hosted API, including the rule questions, and each answer carries its confidence. The time and the cost of the final message come from our recorded run of the same requests. We kept that part recorded because the final message only writes text; it does not change any decision."

### Câu hỏi 2:
**"Why does DeepSeek use 'high reasoning effort' if it only writes the final message at Level 3?"**
- **Câu trả lời ngắn (3 câu):**
  > "At Level Two the same model does the whole decision, so it needs the reasoning: it reads the account and applies the written rules itself. We keep one model and one setting across the two levels, so the comparison stays fair. At Level Three the reasoning effort changes nothing in the decision, because the decision is already made by Jev and by the code that reads the rule answers."

### Câu hỏi 3:
**"What is the list pricing for Jev and for DeepSeek?"**
- **Câu trả lời ngắn (4 câu):**
  > "Jev costs zero point zero four two dollars for each million input tokens, and its output tokens are free. DeepSeek costs zero point one five dollars for each million input tokens, and zero point six zero dollars for each million output tokens, which includes its reasoning tokens. So at list price, one thousand and twenty-four requests cost thirty cents at Level Three and sixty-two cents at Level Two."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Median** | **MEE-dee-un** | Có 3 âm tiết; nhấn vào 'MEE'; đuôi 'un' đọc nhẹ. |
| **Priority** | **pry-OR-ih-tee** | Có 4 âm tiết; nhấn vào 'OR'; đuôi 'tee' đọc nhẹ. |
| **Interval** | **IN-ter-vul** | Có 3 âm tiết; nhấn vào 'IN'; đuôi 'vul' đọc rõ. |
| **Percent** | **per-SENT** | Có 2 âm tiết; nhấn vào 'SENT'; đuôi 't' dứt khoát. |
| **Reasoning** | **REE-zun-ing** | Có 3 âm tiết; nhấn vào 'REE'; 's' đọc thành 'z'. |
| **Temperature** | **TEM-per-uh-chur** | Có 4 âm tiết; nhấn vào 'TEM'; đuôi 'chur' đọc nhẹ. |
| **Tokens** | **TOH-kunz** | Có 2 âm tiết; nhấn vào 'TOH'; kết thúc bằng âm 'z'. |
| **Result** | **rih-ZULT** | Có 2 âm tiết; nhấn vào 'ZULT'; 's' đọc như 'z'. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Twenty-four** | **TWEN-tee-for** | Có 3 âm tiết; nhấn vào 'TWEN'; không đọc 'twenty-fo'. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI VÀ GIAO TIẾP ÁNH MẮT]`: Tư thế ấm áp, tự tin trước khi bắt đầu phần kỹ thuật.
- `[NGHỈ 1 GIÂY]`: Cho khán giả theo kịp các con số (1.024 yêu cầu, 1.434 lượt gọi Jev, 24 loại).
- `[NHÌN SANG VUONG QUANG QUY]`: Nhìn sang người nói tiếp theo khi đọc câu bàn giao lượt nói.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
