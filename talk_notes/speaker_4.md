# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ đóng góp trong bài báo:** 17% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Quy nói 120 giây trên tổng 940 giây (12,8%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 26 (60 giây) và Slide 27 (60 giây).
- **Số từ mục tiêu:** ~254 từ tiếng Anh (133 + 121) trong 120 giây, tức khoảng 127 từ mỗi phút, đã gồm câu tự giới thiệu và câu bàn giao. Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 26 (60 giây): Kết quả 2 (hai level trên cùng 1.024 yêu cầu); Slide 27 (60 giây): nhãn hành động sai nhưng kết cục đúng (ba bằng chứng quan sát được). Câu bàn giao cho Phuong Nam nằm ở cuối Slide 27. Quy **không đặt câu hỏi** cho khán giả: Quy chỉ trình bày số liệu.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Son. My name is Vuong Quang Quy. I will compare the two levels."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 26: Kết quả 2: Level 3 nhanh hơn, rẻ hơn và ít lỗi hơn
- **Tiêu đề slide:** On our SaaS test set: lower time, cost, and error count
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~133 từ)
- **Ý chính:** Level 2: 795 phục vụ, 198 chặn, 31 lỗi (10 gây hại: 5 hoàn tiền, 5 hủy gói). Level 3: 825 phục vụ, 199 chặn, 0 lỗi, 0 gây hại. Thời gian máy trung bình 5,89 s so với 12,45 s (2,1 lần); chi phí API 0,30 đô so với 0,64 đô cho 1.000 yêu cầu (2,2 lần).
- **Nếu vượt khung:** bỏ câu "Of the 31 Level Two errors..." và giữ nguyên các số của hai level.

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son. My name is Vuong Quang Quy. I will compare the two levels on the same one thousand and twenty-four requests. Level Two serves seven hundred and ninety-five, stops one hundred and ninety-eight, and makes thirty-one errors, ten of them harmful. Level Three serves eight hundred and twenty-five, stops one hundred and ninety-nine, and makes zero errors and zero harmful runs.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three has two point one times lower mean machine time, five point eight nine seconds against twelve point four five, and two point two times lower API cost, thirty cents against sixty-four cents per one thousand requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Of the thirty-one Level Two errors, twenty-seven are injection requests. The harmful errors run five refunds and five plan cancellations. These are outcomes on this synthetic set, not a guarantee of safety.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 27]`

---

### Slide 27: Nhãn hành động sai, kết cục đúng
- **Tiêu đề slide:** Wrong action labels, correct outcomes on this test set
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~121 từ)
- **Ý chính:** cờ injection đúng 98,4%; 2.050 trên 2.050 câu trả lời luật khớp luật; 278 nhãn hành động sai ở lần gọi đầu và 0 dẫn tới kết cục sai; Level 3: 0 lỗi, 0 gây hại; hai đầu vào hoàn tiền đã đổi sau các lần chạy đầu nên đây không phải đánh giá mù.
- **Nếu vượt khung:** bỏ câu về cờ injection; giữ nguyên câu về nhãn hành động sai và câu "not a blind evaluation".

> These are observed results, not three independent safety guards. The injection flag and the rule answers both come from Jev. First, Jev sets the injection flag right on ninety-eight point four percent of the requests, and when it is on, the process sends a reply.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Second, two thousand and fifty of two thousand and fifty rule answers match the written rules on this set. Third, the first-call action label is wrong on two hundred and seventy-eight requests, and none of them end in a wrong outcome.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Level Three makes zero errors and zero harmful runs on this set. Two refund inputs were changed after earlier failures, so this is not a blind evaluation.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG NGUYEN PHUONG NAM]`  
> 
> Now Nguyen Phuong Nam will explain our idea.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Phuong Nam (Diễn giả 5):

> "Now Nguyen Phuong Nam will explain our idea."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"What is a 'harmful' run in your metrics?"**
- **Câu trả lời ngắn (3 câu):**
  > "A harmful run is an error that runs an action which changes money, data, the plan, or the password against a written rule. At Level Two ten of the one thousand and twenty-four runs are harmful: five refunds and five plan cancellations. At Level Three there are none."

### Câu hỏi 2:
**"Why is Level 3 faster if the LLM still writes the final message?"**
- **Câu trả lời ngắn (3 câu):**
  > "At Level Two the agent call reads the chat and the whole account and reasons about all the written rules, and it takes four point nine seven seconds at the median. At Level Three the Jev calls take zero point four seven seconds at the median for one request. The final message takes about five point five to five point eight seconds in the two levels, so almost all of the difference of about six and a half seconds in the mean machine time comes from the decision."

### Câu hỏi 3:
**"Is zero errors out of 1,024 a real zero, or overfitting?"**
- **Câu trả lời ngắn (4 câu):**
  > "It is a result on this set, not proof of a zero rate: with zero errors in one thousand and twenty-four requests, the upper limit of a ninety-five percent interval is about zero point four percent. The set is a challenge set that we built, the labels come from the code that applies the rules, and two refund inputs were changed after earlier failures. So we claim lower time, cost, and error count on this set. On the thirty-one requests where the levels differ, only Level Two makes an error, and an exact sign test gives p below one in a billion."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ. |
| **Cancellations** | **kan-suh-LAY-shunz** | Có 4 âm tiết; nhấn vào 'LAY'; kết thúc bằng âm 'z'. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Machine** | **muh-SHEEN** | Có 2 âm tiết; nhấn vào 'SHEEN'; 'ch' đọc như 'sh'. |
| **Guarantee** | **gar-un-TEE** | Có 3 âm tiết; nhấn vào 'TEE'; âm đầu như 'gar'. |
| **Synthetic** | **sin-THET-ik** | Có 3 âm tiết; nhấn vào 'THET'; đuôi 'ik' ngắn. |
| **Observed** | **ub-ZURVD** | Có 2 âm tiết; nhấn vào 'ZURVD'; 's' đọc như 'z'. |
| **Independent** | **in-dih-PEN-dunt** | Có 4 âm tiết; nhấn vào 'PEN'; đuôi 'dunt' đọc nhẹ. |
| **Outcome** | **OWT-kum** | Có 2 âm tiết; nhấn vào 'OWT'; đuôi 'kum' đọc nhẹ. |
| **Evaluation** | **ih-val-yoo-AY-shun** | Có 5 âm tiết; nhấn vào 'AY'; đuôi 'shun' đọc nhẹ. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Thể hiện sự tự tin trước khi công bố số liệu thực nghiệm.
- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (2,1 lần nhanh hơn, 2,2 lần rẻ hơn, 0 lỗi so với 31 lỗi).
- `[NHÌN SANG NGUYEN PHUONG NAM]`: Nhìn sang người nói tiếp theo khi đọc câu bàn giao lượt nói.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
