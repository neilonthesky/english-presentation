# Kịch bản và ghi chú thuyết trình của Diễn giả 4

- **Họ và tên diễn giả:** Vuong Quang Quy
- **Vai trò trong đề tài:** Phân tích kết quả thực nghiệm; Kiểm định thống kê; Tạo các bảng biểu LaTeX và đồ thị trực quan
- **Tỷ lệ phân công:** 17% tổng thời lượng thuyết trình trong bài báo; về thời gian nói, Quy nói 78 giây trên tổng 858 giây.
- **Thời gian nói được phân bổ:** 1 phút 18 giây (78 giây) cho hai slide: Slide 27 (40 giây) và Slide 28 (38 giây).
- **Số từ mục tiêu:** ~200 từ trong 78 giây, tức khoảng 152 từ mỗi phút: nhanh hơn tốc độ nói rõ ràng thông thường, nên phải bấm giờ khi luyện. Nếu vượt khung, bỏ bớt các câu phân tích ở Slide 28 và giữ nguyên các số liệu chính
- **Các slide phụ trách:** Slide 27 (40 giây): độ tin cậy của Jev; Slide 28 (38 giây): Kết quả 2 (hai cấp độ trên cùng 1.024 yêu cầu). Câu bàn giao cho Phuong Nam nằm ở cuối Slide 28. Quy **không đặt câu hỏi** cho khán giả: Quy chỉ trình bày số liệu.

---

## 1. Tự giới thiệu bản thân trước lớp

Đọc to và rõ ràng câu giới thiệu này khi nhận lượt nói:

> "Thank you, Son. My name is Vuong Quang Quy. I will show what the confidence of Jev means."

---

## 2. Kịch bản nói chi tiết từng từ (Word-for-Word Spoken Script)

### Slide 27: Độ tin cậy của Jev là một tín hiệu cảnh báo
- **Tiêu đề slide:** Jev reports a confidence, and it is a warning
- **Thời gian dự kiến trên slide:** 0 phút 40 giây (40 giây, ~92 từ)
- **Ý chính:** 5.755 câu trả lời mà quy trình dùng, 522 câu sai; 338 trong 737 câu dưới 0,8 sai; 92 trong 4.455 câu từ 0,9 trở lên sai (2,1%).

> `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`  
> Thank you, Son. My name is Vuong Quang Quy. I will show what the confidence of Jev means. Jev reports a confidence with every answer. We count the five thousand seven hundred and fifty-five answers that the process uses: four thousand and fifty-five labels, and one thousand seven hundred rule answers. Five hundred and twenty-two of them are wrong. Three hundred and thirty-eight of the seven hundred and thirty-seven answers below zero point eight are wrong. At zero point nine or more, only ninety-two of four thousand four hundred and fifty-five are wrong, which is two point one percent. So the confidence works as a warning.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 28]`

---

### Slide 28: Kết quả 2: Level 3 nhanh hơn, rẻ hơn và ít lỗi hơn
- **Tiêu đề slide:** Result 2: Level 3 is faster, cheaper, and makes fewer errors
- **Thời gian dự kiến trên slide:** 0 phút 38 giây (38 giây, ~120 từ)
- **Ý chính:** Level 2: 676 phục vụ, 287 chặn, 61 lỗi (khoảng 20 gây hại). Level 3: 717 phục vụ, 307 chặn, 0 lỗi. Nhanh hơn 1,8 lần, rẻ hơn 2,1 lần. Kiểm định dấu p = 0,031.

> Now the two levels on the same one thousand and twenty-four requests. Level Two serves six hundred and seventy-six, stops two hundred and eighty-seven, and makes sixty-one errors, about twenty of them harmful. Level Three serves seven hundred and seventeen, stops three hundred and seven, and makes no error, and none is harmful. The ninety-five percent interval of the Level Three errors is zero to thirty-eight, and that of Level Two is twenty-eight to one hundred and twenty-eight. Level Three is one point eight times faster, four point two eight seconds against seven point eight five, and two point one times cheaper, twenty-nine cents against sixty-one cents per one thousand requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The two levels fail on different requests. Level Two fails on forty-one injection requests and on twenty refund requests, where it cancelled the plan. Level Two was wrong and Level Three right on sixty-one of the one thousand and twenty-four requests, and the reverse on none. The sign test gives p equal to zero point zero three one, so Level Three makes significantly fewer errors on these requests. Level Three uses two Jev calls on four requests in ten, and that adds little time and cost.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[NHÌN SANG NGUYEN PHUONG NAM]`  
> 
> Now Nguyen Phuong Nam will explain how our work fits the field.

---

## 3. Câu nói bàn giao lượt thuyết trình (Hand-off)

Nói chính xác câu tiếng Anh này để chuyển tiếp cho Phuong Nam (Diễn giả 5):

> "Now Nguyen Phuong Nam will explain how our work fits the field."

---

## 4. Ba câu hỏi khán giả thường gặp và gợi ý trả lời (chỉ để hiểu sâu phần của mình; Long là người trả lời trong Q&A)

### Câu hỏi 1:
**"What is a 'harmful' run in your metrics?"**
- **Câu trả lời ngắn (2 câu):**
  > "A harmful run is a wrong action that changes money, data, the plan, or the password against a written rule. At Level Two about twenty runs of one thousand and twenty-four are harmful, and at Level Three there are none."

### Câu hỏi 2:
**"Why is Level 3 faster if the LLM still writes the final message?"**
- **Câu trả lời ngắn (3 câu):**
  > "At Level Two the agent call reads the chat and the whole account and reasons about all the rules, and it takes about four seconds of the seven point eight. At Level Three that work is gone: Jev answers in about zero point three seconds per call, and the second call only runs on four requests in ten. The final message call is the same in both levels, so the difference comes from the decision step."

### Câu hỏi 3:
**"Is zero errors out of 1,024 a real zero, or overfitting?"**
- **Câu trả lời ngắn (3 câu):**
  > "It is a result on this set, not proof of a rate of zero: the ninety-five percent interval runs from zero to thirty-eight errors in one thousand and twenty-four. The design is also tuned on the same twenty-four request types that we know, and the labels come from the code that applies the rules. So we claim fewer errors than Level Two on this set, which the sign test supports with p equal to zero point zero three one."

---

## 5. Hướng dẫn phát âm (10 từ kỹ thuật khó)

Luyện phát âm 10 từ vựng này theo phiên âm đơn giản dưới đây:

| Từ tiếng Anh | Phiên âm đơn giản | Hướng dẫn phát âm và trọng âm |
| :--- | :--- | :--- |
| **Interval** | **IN-ter-vul** | Có 3 âm tiết; nhấn vào 'IN'; đuôi 'vul' đọc rõ. |
| **Significantly** | **sig-NIF-ih-kunt-lee** | Có 5 âm tiết; nhấn vào 'NIF'; các âm còn lại đọc lướt. |
| **Harmful** | **HARM-ful** | Có 2 âm tiết; nhấn vào 'HARM'; đuôi 'ful' đọc nhẹ. |
| **Confidence** | **KON-fih-dens** | Có 3 âm tiết; nhấn vào 'KON'; đuôi 'dens' đọc nhẹ. |
| **Label** | **LAY-bul** | Có 2 âm tiết; nhấn vào 'LAY'; đuôi 'bul' đọc nhẹ. |
| **Accuracy** | **AK-yuh-ruh-see** | Có 4 âm tiết; nhấn vào 'AK'; đuôi 'see' rõ ràng. |
| **Errors** | **ER-erz** | Có 2 âm tiết; nhấn vào 'ER'; đuôi 'erz' đọc nhẹ. |
| **Level** | **LEV-ul** | Có 2 âm tiết; nhấn vào 'LEV'; không đọc 'le-vel' thành 'lơ-ven'. |
| **Cheaper** | **CHEE-per** | Có 2 âm tiết; nhấn vào 'CHEE'; đuôi 'per' đọc nhẹ. |
| **Injection** | **in-JEK-shun** | Có 3 âm tiết; nhấn vào 'JEK'; đuôi 'shun' đọc nhẹ. |

---

## 6. Ký hiệu tốc độ và cử chỉ biểu diễn

- `[NHÌN KHÁN GIẢ - MỈM CƯỜI]`: Thể hiện sự tự tin trước khi công bố số liệu thực nghiệm.
- `[NGHỈ 1 GIÂY]`: Giúp người nghe tiếp thu các số liệu so sánh (nhanh hơn 1,8 lần, rẻ hơn 2,1 lần, 0 lỗi so với 61 lỗi).
- `[NHÌN SANG NGUYEN PHUONG NAM]`: Nhìn sang người nói tiếp theo khi đọc câu bàn giao lượt nói.
- `[CHUYỂN SANG SLIDE X]`: Bấm chuyển slide trình chiếu chuẩn xác theo kịch bản.
