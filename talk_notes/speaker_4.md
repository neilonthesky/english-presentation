# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ đóng góp trong bài báo:** 17% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Quy nói 120 giây trên tổng 835 giây (14,4%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 25 (60 giây) và Slide 26 (60 giây).
- **Số từ mục tiêu:** ~251 từ tiếng Anh (136 + 115) trong 120 giây, tức khoảng 120 từ mỗi phút. Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 25 (60 giây): Kết quả 2 (hai level trên cùng 1.024 yêu cầu); Slide 26 (60 giây): nhãn hành động sai nhưng kết cục đúng (ba bằng chứng quan sát được). Quy nói thẳng từ trên xuống dưới: **không chào, không tự giới thiệu, không đặt câu hỏi** cho khán giả; Quy chỉ trình bày số liệu. Long đã đọc tên Quy ở Slide 1.

---

## 1. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 25: Kết quả 2: cùng model viết câu trả lời, khác bước quyết định
- **Tiêu đề slide:** Same reply model, different decision step
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~136 từ)
- **Ý chính:** Cả hai bên dùng cùng một LLM viết câu trả lời cuối; chỉ bước quyết định khác nhau (LLM agent một lệnh gọi, so với Jev trả lời các câu hỏi có kiểu). LLM agent: 795 phục vụ, 198 chặn, 31 request sai (10 gây hại), trong đó 27 là mệnh lệnh giấu trong tin nhắn. Jev pipeline: 825 phục vụ, 199 chặn, 0 sai, 0 gây hại. Thời gian máy 5,89 s so với 12,45 s (2,1 lần); giá 0,30 đô so với 1,12 đô cho 1.000 yêu cầu (3,8 lần).
- **Ngôn ngữ của lời nói:** từ vựng mức B1, rất ít từ B2; câu ngắn, thể chủ động, mỗi câu một ý, không dấu chấm phẩy (theo ASD-STE100, dạng STE-flavored). "Harmful" được nói là "cause real damage"; "guarantee" được nói là "prove the system is always safe".
- **Nếu bị hỏi "agent của các bạn có yếu không":** LLM agent của nhóm là baseline một lệnh gọi, không có retrieval hay prompt guardrail dài; một agent mạnh hơn có thể sai ít hơn 31. Điều nhóm đo là các request có hậu quả không rút lại được.
- **Giá 1,12 đô:** gồm thêm một lệnh gọi LLM để phân loại; lần chạy ghi lại chỉ có 0,64 đô. Nếu bị hỏi, nói rõ đây là số ước tính cho cấu hình có classifier LLM.
- **Nếu vượt khung:** bỏ câu "It is cheaper too..." và giữ nguyên các số của hai bên.

> We tested both systems on the same one thousand and twenty-four requests. Both use the same LLM to write the reply. Only the decision step is different.
> 
> The LLM agent decides in one step. It serves seven hundred and ninety-five requests and stops one hundred and ninety-eight. It gets thirty-one requests wrong. Ten of them cause real damage. Twenty-seven are orders that hide inside the message.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The Jev pipeline serves eight hundred and twenty-five requests and stops one hundred and ninety-nine. It gets none wrong.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Jev is also faster. One request takes five point eight nine seconds, not twelve point four five. It is cheaper too. One thousand requests cost thirty cents, not one dollar and twelve cents.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> These numbers come from our own test set. They do not prove that the system is always safe.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 26]`

---

### Slide 26: Nhãn hành động sai, kết cục đúng
- **Tiêu đề slide:** Wrong action labels, correct outcomes on this test set
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~115 từ)
- **Ý chính:** cờ injection đúng 98,4%; 2.050 trên 2.050 câu trả lời luật khớp luật; 278 nhãn hành động sai ở lần gọi đầu và 0 dẫn tới kết cục sai; Level 3: 0 lỗi, 0 gây hại; hai đầu vào hoàn tiền đã đổi sau các lần chạy đầu nên nhóm đã biết các lỗi này trước lần thử cuối.
- **Nếu vượt khung:** bỏ câu về cờ injection; giữ nguyên câu về nhãn hành động sai và câu "we saw these failures before this last test".

> These are observed results, not three independent safety guards. The injection flag and the rule answers both come from Jev. First, Jev sets the injection flag right on ninety-eight point four percent of the requests, and when it is on, the process sends a reply.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Second, two thousand and fifty of two thousand and fifty rule answers match the written rules on this set. Third, the first-call action label is wrong on two hundred and seventy-eight requests, and none of them end in a wrong outcome.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The hybrid pipeline makes zero errors and zero harmful runs on this set. Two refund inputs were changed after earlier failures, so we saw these failures before this last test.
> 
> `[NGHỈ 1 GIÂY]`

---

## 2. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ. |
| **Cancellations** | **kan-suh-LAY-shunz** | Có 4 âm tiết; nhấn vào 'LAY'; kết thúc bằng âm 'z'. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Machine** | **muh-SHEEN** | Có 2 âm tiết; nhấn vào 'SHEEN'; 'ch' đọc như 'sh'. |
| **Guarantee** | **gar-un-TEE** | Có 3 âm tiết; nhấn vào 'TEE'; âm đầu như 'gar'. |
| **Average** | **AV-rij** | Có 2 âm tiết; nhấn vào 'AV'; đuôi 'rij' đọc nhẹ, âm 'j' cuối. |
| **Observed** | **ub-ZURVD** | Có 2 âm tiết; nhấn vào 'ZURVD'; 's' đọc như 'z'. |
| **Independent** | **in-dih-PEN-dunt** | Có 4 âm tiết; nhấn vào 'PEN'; đuôi 'dunt' đọc nhẹ. |
| **Outcome** | **OWT-kum** | Có 2 âm tiết; nhấn vào 'OWT'; đuôi 'kum' đọc nhẹ. |
| **Failures** | **FAYL-yerz** | Có 2 âm tiết; nhấn vào 'FAYL'; kết thúc bằng âm 'z'. |

---

## 3. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (2,1 lần nhanh hơn, 3,8 lần rẻ hơn, 0 sai so với 31 sai).
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
