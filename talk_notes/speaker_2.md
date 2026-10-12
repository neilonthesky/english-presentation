# Kịch bản và ghi chú thuyết trình của Diễn giả 2

- **Họ và tên diễn giả:** Nguyen Thanh Nam
- **Vai trò trong đề tài:** Quy tắc bằng văn bản (Written rules); Các câu hỏi luật của Level 3; Quy tắc điều hướng khi phát hiện injection; Security rule
- **Tỷ lệ đóng góp trong bài báo:** 22% (đây không phải tỷ lệ thời gian nói). Về thời gian nói, Nam nói 120 giây trên tổng 820 giây (14,6%).
- **Thời gian nói được phân bổ:** 2 phút 00 giây (120 giây) cho hai slide: Slide 22 (60 giây) và Slide 23 (60 giây).
- **Số từ mục tiêu:** ~206 từ tiếng Anh (121 + 85) trong 120 giây, tức khoảng 103 từ mỗi phút (chậm hơn mục tiêu nên còn dư thời gian để nghỉ và nhấn số liệu). Số từ đếm trên lời nói thật, các số viết thành chữ. Nếu chậm hơn, cắt theo dòng "Nếu vượt khung" của từng slide.
- **Các slide phụ trách:** Slide 22 (60 giây): dữ liệu thử nghiệm (512 khách hàng, 1.024 yêu cầu, năm nhóm); Slide 23 (60 giây): cách chấm (ba kết cục và lần chạy gây hại). Nam nói ngay sau ba walk-through của Long, thẳng từ trên xuống dưới: **không chào, không tự giới thiệu, không đặt câu hỏi** và **không tổ chức bình chọn** với khán giả; câu quiz duy nhất do Long đặt ở Slide 2. Long đã đọc tên Nam ở Slide 1.

---

## 1. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 22: Dữ liệu thử nghiệm: 512 khách hàng, 1.024 yêu cầu
- **Tiêu đề slide:** Test data: 512 customers, 1,024 requests
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~121 từ)
- **Nếu vượt khung:** bỏ câu "High-impact actions are the largest group..." và giữ nguyên các số: 512 khách hàng, 1.024 yêu cầu, 199 yêu cầu bị một luật từ chối.

> Public datasets have no SaaS accounts, so we built our own: five hundred and twelve FrameForge customers, each with one purchase, a credit balance, and a log of password reset links.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Each customer sends two requests, so we have one thousand and twenty-four requests of twenty-six types in five groups. High-impact actions are the largest group, with three hundred and fifty-nine requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We made the set hard on purpose: a written rule denies the action on one hundred and ninety-nine requests, and twenty-seven requests hide an order in the message. A program writes the requests from a fixed start number and runs the real code of the system to make the correct answers. This is a challenge set, not production traffic.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 23]`

---

### Slide 23: Cách chấm: ba kết cục và một lần chạy gây hại
- **Tiêu đề slide:** Every request ends served, stopped, or in error
- **Thời gian dự kiến trên slide:** 1 phút 00 giây (60 giây, ~85 từ)
- **Nếu vượt khung:** bỏ câu "We also report the machine time..." và đọc nhanh ba định nghĩa Served, Stopped, Error.

> Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report the machine time of one request, the API cost per one thousand requests, and the error counts on this request set.
> 
> `[NGHỈ 1 GIÂY]`

---

## 2. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Program** | **PROH-gram** | Có 2 âm tiết; nhấn vào 'PROH'; 'gram' đọc rõ, không nuốt âm 'r'. |
| **Customers** | **KUS-tuh-merz** | Có 3 âm tiết; nhấn vào 'KUS'; đuôi 'merz' đọc nhẹ. |
| **Balance** | **BAL-uns** | Có 2 âm tiết; nhấn vào 'BAL'; đuôi 'uns' đọc nhẹ. |
| **Purchase** | **PUR-chus** | Có 2 âm tiết; nhấn vào 'PUR'; đuôi 'chus' đọc nhẹ. |
| **Challenge** | **CHAL-inj** | Có 2 âm tiết; nhấn vào 'CHAL'; đuôi 'inj' đọc nhẹ. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ. |
| **Served** | **SURVD** | Có 1 âm tiết; kết thúc bằng âm 'd' rõ. |
| **Stopped** | **STOPT** | Có 1 âm tiết; kết thúc bằng âm 't', không đọc 'sto-ped'. |
| **Machine** | **muh-SHEEN** | Có 2 âm tiết; nhấn vào 'SHEEN'; 'ch' đọc như 'sh'. |

---

## 3. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NGHỈ 1 GIÂY]`: Cho người nghe thời gian xử lý các con số (512 khách hàng, 1.024 yêu cầu, 199 luật từ chối).
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
