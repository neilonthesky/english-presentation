# Kịch bản và ghi chú thuyết trình của Diễn giả 3

- **Họ và tên diễn giả:** Vu Van Son
- **Vai trò trong đề tài:** Xây dựng tập dữ liệu tổng hợp (1.024 yêu cầu, 26 loại); Thiết kế thế giới khách hàng FrameForge; Thực thi thực nghiệm và đo lường API trực tiếp
- **Tỷ lệ đóng góp trong bài báo:** 18% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Son nói 120 giây trên tổng 835 giây (14,4%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 23 (60 giây) và Slide 24 (60 giây).
- **Số từ mục tiêu:** ~239 từ tiếng Anh (109 + 130) trong 120 giây, tức khoảng 120 từ mỗi phút. Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 23 (60 giây): cách chạy thí nghiệm, hai mô hình, giá niêm yết và chi phí của hai level; Slide 24 (60 giây): Kết quả 1 (Jev nhanh, rẻ và độ đúng theo từng câu trả lời). Son nói thẳng từ trên xuống dưới: **không chào, không tự giới thiệu, không đặt câu hỏi** cho khán giả. Long đã đọc tên Son ở Slide 1.

---

## 1. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 23: Cách chạy và giá: hai kiến trúc, hai mô hình, một bảng giá
- **Tiêu đề slide:** Experimental setup: 1,024 requests, two architectures
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~109 từ)
- **Nếu vượt khung:** bỏ câu giá của Jev và của LLM, giữ nguyên hai con số chi phí (0.64 đô và 0.30 đô cho 1.000 yêu cầu).

> We call two hosted models for real: Jev, version one point thirteen, and DeepSeek V four point one Flash. Both architectures run on the same one thousand and twenty-four requests, in separate runs.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The autonomous agent makes two LLM calls for each request. The hybrid pipeline makes one point five classifier calls and one LLM call. Jev costs four point two cents per million input tokens, and its output is free. The LLM costs fifteen cents in and sixty cents out per million tokens.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> At list price, one thousand requests cost sixty-four cents for the autonomous agent and thirty cents for the hybrid pipeline. These are API token charges, not total operating cost.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 26]`

---

### Slide 24: Kết quả 1: Jev nhanh, rẻ và phần lớn đúng
- **Tiêu đề slide:** Jev on our SaaS test set: speed, cost, and accuracy
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~130 từ)
- **Ý chính:** một nửa số yêu cầu cần 0.47 s hoặc ít hơn cho phần Jev (gồm lần gọi luật); 0.066 đô cho 1.000 yêu cầu; độ đúng: chủ đề 93,3%, ưu tiên 86,5%, hành động 72,9%, cờ injection 98,4%; 2.050 trên 2.050 câu trả lời luật khớp luật; 278 nhãn hành động sai ở lần gọi đầu, 0 dẫn tới kết cục sai.
- **Nếu vượt khung:** bỏ câu về cờ injection và về luật; giữ nguyên số thời gian, chi phí và số nhãn hành động sai.

> Now the first result, for Jev alone. Half of the requests need zero point four seven seconds or less of Jev time, including rule calls, and all Jev calls cost six point six cents per one thousand requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first call gives the right topic on ninety-three point three percent of the scored requests, the priority on eighty-six point five percent, the action on seventy-two point nine percent, and the injection flag on ninety-eight point four percent. two thousand and fifty of two thousand and fifty rule answers match the written rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first-call action label is wrong on two hundred and seventy-eight requests, and none of these end in a wrong outcome. Two refund inputs were changed after earlier failures, so we saw these failures before the last test.
> 
> `[NGHỈ 1 GIÂY]`

---

## 2. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Hosted** | **HOH-stid** | Có 2 âm tiết; nhấn vào 'HOH'; đuôi 'stid' đọc nhẹ. |
| **Version** | **VUR-zhun** | Có 2 âm tiết; nhấn vào 'VUR'; âm 'zh' như trong 'vision'. |
| **DeepSeek** | **DEEP-seek** | Có 2 âm tiết; nhấn vào 'DEEP'; đọc rõ 'seek'. |
| **Charges** | **CHAR-jiz** | Có 2 âm tiết; nhấn vào 'CHAR'; kết thúc bằng âm 'z'. |
| **Priority** | **pry-OR-ih-tee** | Có 4 âm tiết; nhấn vào 'OR'; đuôi 'tee' đọc nhẹ. |
| **Percent** | **per-SENT** | Có 2 âm tiết; nhấn vào 'SENT'; đuôi 't' dứt khoát. |
| **Tokens** | **TOH-kunz** | Có 2 âm tiết; nhấn vào 'TOH'; kết thúc bằng âm 'z'. |
| **Failures** | **FAYL-yerz** | Có 2 âm tiết; nhấn vào 'FAYL'; kết thúc bằng âm 'z'. |
| **Operating** | **OP-uh-ray-ting** | Có 4 âm tiết; nhấn vào 'OP'; đuôi 'ting' đọc nhẹ. |
| **Thirteen** | **thur-TEEN** | Có 2 âm tiết; nhấn vào 'TEEN' (13), khác 'THUR-tee' (30); 'th' đặt lưỡi giữa hai hàm răng. |

---

## 3. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NGHỈ 1 GIÂY]`: Cho khán giả theo kịp các con số (1.024 yêu cầu, 1.556 lượt gọi Jev, 0.64 đô và 0.30 đô).
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
