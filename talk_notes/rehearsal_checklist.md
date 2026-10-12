# Kế hoạch luyện tập và Danh mục kiểm tra trước giờ thuyết trình

Tài liệu này liệt kê các bước tập luyện và bảng tự chấm điểm, dùng để soát lại bài nói trước giờ thuyết trình nhóm. Nhóm năm thành viên chuẩn bị luyện tập với bộ slide hiện tại (29 slide trình bày và Slide 30 là slide câu hỏi) và chạy thử toàn bộ bài nói trước khi lên lớp.

---

## 1. Bài tập kiểm soát thời gian và quy tắc bấm giờ

- **Thời gian nói theo kịch bản:** 13 phút 40 giây (820 giây), chia thành các khối nói rõ ràng: Long 5 phút 40 giây, Nam 2 phút 00 giây, Son 2 phút 00 giây, Quy 2 phút 00 giây, Phuong Nam 2 phút 00 giây.
- **Tổng thời gian dự kiến:** 18 phút 40 giây (820 giây nói + 300 giây hỏi đáp tối đa). Con số này thấp hơn mức tối đa 20 phút của đề cương 1 phút 20 giây, và phần nói ngắn hơn mục tiêu 15 phút là 1 phút 20 giây. Khoảng dự trữ này dành cho lúc chuyển slide và những chỗ người nói chậm hơn kịch bản; nếu vẫn thiếu, cắt theo các dòng "Nếu vượt khung" trong tệp của từng người.
- **Phần hỏi đáp (Q&A):** tối đa 5 phút (300 giây) do Long trả lời toàn bộ.

### Bảng phân bổ thời gian theo người nói

| Người nói | Số slide phụ trách | Slide | Thời gian nói | Tỷ lệ thời gian | Tốc độ cần |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **Tran Thanh Long** | 21 slide (9 slide riêng + 12 khung của ba walk-through) | Slide 1 đến 21 | 340 giây (5 phút 40 giây) | 41,5% | 121 từ/phút |
| **Nguyen Thanh Nam** | 2 slide | Slide 22 và 23 | 120 giây (2 phút 00 giây) | 14,6% | 103 từ/phút |
| **Vu Van Son** | 2 slide | Slide 24 và 25 | 120 giây (2 phút 00 giây) | 14,6% | 120 từ/phút |
| **Vuong Quang Quy** | 2 slide | Slide 26 và 27 | 120 giây (2 phút 00 giây) | 14,6% | 120 từ/phút |
| **Nguyen Phuong Nam** | 2 slide | Slide 28 và 29 | 120 giây (2 phút 00 giây) | 14,6% | 112 từ/phút |
| **Tổng cộng** | **29 slide (cộng Slide 30 là slide câu hỏi)** | **Toàn bộ bài trình bày** | **820 giây (13 phút 40 giây)** | **100%** | 117 từ/phút |

(Tỷ lệ làm tròn đến một chữ số thập phân. "Tốc độ cần" là số từ của kịch bản chia cho số giây của khối nói, đã gồm các lần nghỉ.)

### Thời gian chi tiết từng slide

| Slide | Nội dung | Người nói | Thời gian | Cộng dồn |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Human to LLM & Classifier Support Agent | Long | 50 giây | 0 phút 50 giây |
| 2 | Where we start: staff or one LLM agent | Long | 70 giây | 2 phút 00 giây |
| 3 | Three levels; two automated designs compared | Long | 41 giây | 2 phút 41 giây |
| 4 | Real support policies have many rules | Long | 7 giây | 2 phút 48 giây |
| 5 | Every action meets a written rule: allow or deny | Long | 23 giây | 3 phút 11 giây |
| 6 | Level 2: the LLM agent decides and applies the rules | Long | 33 giây | 3 phút 44 giây |
| 7 | Level 3: Jev answers, and the process decides | Long | 26 giây | 4 phút 10 giây |
| 8 | Jev reads the chat first, then one rule at a time | Long | 23 giây | 4 phút 33 giây |
| 9 | Jev returns five fields, then one answer per rule | Long | 21 giây | 4 phút 54 giây |
| 10 | Walk-through 1: a refund that no rule stops (slide mở đầu của chuỗi 5 slide, Slide 10 đến 14) | Long | 22 giây cho cả chuỗi | 5 phút 16 giây |
| 11 đến 14 | Bốn lần bấm phím tiếp của walk-through 1: Jev gọi lần một, các câu hỏi luật, hành động chạy, tin nhắn cuối | Long | nằm trong 22 giây của Slide 10 | 5 phút 16 giây |
| 15 | Walk-through 2: a refund that a rule stops (slide mở đầu của chuỗi 4 slide, Slide 15 đến 18) | Long | 12 giây cho cả chuỗi | 5 phút 28 giây |
| 16 đến 18 | Ba lần bấm phím tiếp của walk-through 2: Jev gọi lần một, luật hạn mức bị phá và không hành động nào chạy, tin nhắn giải thích | Long | nằm trong 12 giây của Slide 15 | 5 phút 28 giây |
| 19 | Walk-through 3: an order hidden in the message (slide mở đầu của chuỗi 3 slide, Slide 19 đến 21) | Long | 12 giây cho cả chuỗi | 5 phút 40 giây |
| 20 đến 21 | Hai lần bấm phím tiếp của walk-through 3: cờ injection bật; tin nhắn cuối | Long | nằm trong 12 giây của Slide 19 | 5 phút 40 giây |
| 22 | Test data: 512 customers, 1,024 requests | Nam | 60 giây | 6 phút 40 giây |
| 23 | Every request ends served, stopped, or in error | Nam | 60 giây | 7 phút 40 giây |
| 24 | Both levels run on the same 1,024 requests | Son | 60 giây | 8 phút 40 giây |
| 25 | Jev on our SaaS test set: speed, cost, and accuracy | Son | 60 giây | 9 phút 40 giây |
| 26 | On our SaaS test set: lower time, cost, and error count | Quy | 60 giây | 10 phút 40 giây |
| 27 | Wrong action labels, correct outcomes on this test set | Quy | 60 giây | 11 phút 40 giây |
| 28 | Our idea: limit what each model can trigger | Phuong Nam | 60 giây | 12 phút 40 giây |
| 29 | Conclusion | Phuong Nam | 60 giây | 13 phút 40 giây |
| 30 | Questions? (Long trả lời; bốn thẻ chỉ slide cần mở) | Long | không tính | 13 phút 40 giây |

**Lưu ý về thời gian:** thời gian trên là thời gian ghi trong ghi chú của bộ slide hiện tại (`slides/build.js`, mảng `SPEAKER`). Cả ba walk-through đều được tính là một khối nói liền: Long bấm phím để đi qua từng khung, và toàn bộ chuỗi khung nằm trong số giây của slide mở đầu chuỗi. Tổng cộng 820 giây nói, tiếp theo là tối đa 300 giây hỏi đáp.

**Cảnh báo về tốc độ nói:** tốc độ rõ ràng thông thường là 120 đến 130 từ mỗi phút. Theo số từ của kịch bản, tốc độ trung bình của từng người nằm trong khoảng 103 đến 121 từ/phút, nên không ai vượt 130 từ/phút. Ba slide có lời nói dày nhất là Slide 29 (137 từ/phút), Slide 7 (136 từ/phút) và Slide 9 (131 từ/phút): người nói phải bấm giờ khi luyện tập và dùng dòng "Nếu vượt khung" của slide đó nếu chậm (Slide 7 và Slide 9 của Long không có dòng này, nên Long bấm giờ riêng hai chỗ này). Nam nói chậm nhất (103 từ/phút) và còn dư khoảng 17 giây trong 120 giây của mình nếu nói 120 từ/phút.

---

## 2. Quy trình luyện tập

- **Lần 1 - Đọc thầm và thuộc số liệu:** Mỗi người tự đọc kịch bản trong file `speaker_X.md` của mình, tập nhớ ba số liệu quan trọng nhất của phần mình nói.
- **Lần 2 - Tập theo nhóm, có bấm giờ:** Cả nhóm ngồi cùng nhau, lần lượt nói và bấm thời gian từng slide. Người bấm giờ ghi lại thời gian thực tế của mỗi người để so với bảng ở mục 1.
- **Lần 3 - Tổng duyệt đầy đủ:** Nói toàn bộ bài trình bày như thật, có máy chiếu, bấm chuyển slide đúng nhịp, và không dừng lại giữa chừng. Ghi âm hoặc quay video để tự xem lại.
- **Lần 4 - Diễn tập phần hỏi đáp:** Một người trong nhóm đóng vai khán giả, đặt 5 câu hỏi bất kỳ trong `qa_prep.md`. Người trả lời là **Long**, bốn thành viên còn lại thực hành việc giữ im lặng và chỉ nói khi Long nhường lời.
- **Kiểm tra chéo thiết bị:** Thử máy chiếu, cổng HDMI, độ tương phản của sơ đồ, và bản PDF dự phòng (`slides/deck.pdf`) trong trường hợp máy tính không mở được file PowerPoint.

### Điều cần chú ý khi luyện tập

- **Không đọc slide:** Mỗi người chỉ liếc nhanh slide để nhớ ý, hướng mắt về phía khán giả (khoảng 80% thời gian).
- **Tốc độ nói:** Giữ khoảng 120 đến 130 từ mỗi phút. Chỗ có số liệu quan trọng cần nói chậm hơn, có khoảng nghỉ trước và sau con số.
- **Cử chỉ:** Chỉ tay về phía sơ đồ hoặc con số trên slide khi đang nói về nó. Không giơ tay ra ngoài màn chiếu gây che chữ.
- **Số liệu:** Trong bài nói chỉ dùng một con số duy nhất cho tập thử nghiệm: **1.024 yêu cầu**. Nếu nhớ nhầm, dừng lại một nhịp rồi nói lại con số đúng.
- **Xử lý khi quên:** Nếu quên kịch bản, nói lại ý trước bằng câu ngắn hoặc chuyển ngay sang câu kế tiếp, không đứng im.

---

## 3. Danh mục kiểm tra chất lượng trước khi thuyết trình

Đánh dấu `[x]` cho mọi mục đã đạt được trước khi lên lớp.

### A. Nội dung và cấu trúc

- [ ] **1.** Bảng kế hoạch thời gian trong phần 1 khớp với thời gian thật đã đo (sai số dưới 15 giây mỗi người).
- [ ] **2.** Long thuộc lời chào và câu giới thiệu nhóm ở Slide 1, nói chính xác từng từ. Nam, Son, Quy và Phuong Nam không chào, không tự giới thiệu, không bàn giao và không đặt câu hỏi cho khán giả.
- [ ] **3.** Bốn người còn lại **không trả lời** câu hỏi trong phần Q&A trừ khi Long nhường lời đúng như mô tả trong `qa_prep.md`.
- [ ] **4.** Tất cả các con số trong bài nói trùng với ghi chú trên slide: 512 khách hàng, 1.024 yêu cầu, 26 loại, 1.556 lượt gọi Jev, 31 lỗi ở Level 2, 0 lỗi ở Level 3, nhanh hơn 2,1 lần, rẻ hơn 2,2 lần.

### B. Slide và thiết bị

- [ ] **5.** Mỗi thành viên biết chính xác số slide mình phụ trách và không bấm chuyển slide ngoài danh sách.
- [ ] **6.** Sơ đồ và biểu đồ trong slide đọc được từ cuối lớp, không có chữ bị chồng hoặc tràn khung.
- [ ] **7.** Bản PDF dự phòng đã được chuẩn bị sẵn và đã thử mở trên máy trình chiếu.
- [ ] **8.** Slide 22 khớp với tập dữ liệu: 512 khách hàng, mỗi khách gửi 2 yêu cầu, 199 trong 1.024 yêu cầu bị một luật từ chối, và 27 yêu cầu giấu lệnh trong tin nhắn.

### C. Phần hỏi đáp

- [ ] **9.** Long đã trả lời thử ít nhất 10 câu trong `qa_prep.md`, mỗi câu trong 2 đến 4 câu tiếng Anh.
- [ ] **10.** Cả nhóm biết phần Q&A dành cho Long, và không ai ngắt lời Long khi đang trả lời.

### D. Thời gian

- [ ] **11.** Buổi tổng duyệt đo được tổng thời gian nói (kịch bản dài 13 phút 40 giây); cộng với tối đa 5 phút hỏi đáp, tổng vẫn dưới 20 phút.

---

## 4. Bảng tự chấm điểm toàn diện

Bảng dưới đây ánh xạ 10 tiêu chí của mẫu đánh giá chéo vào slide tương ứng (cùng trọng số với mục 4 của `README.md`, tổng 10.0), kèm câu hỏi tự kiểm tra mà nhóm phải trả lời được và người phụ trách chính.

| # | Tiêu chí | Trọng số | Slide | Câu hỏi tự kiểm tra | Người phụ trách | Kết quả |
| :---: | :--- | :---: | :---: | :--- | :---: | :---: |
| **1** | Presentation & organization | 1.0 | 1 đến 30 | "Does the talk follow the order: problem, three levels, rules and flow, three real requests, data, results, idea, conclusion?" | Cả nhóm | [ ] ĐẠT |
| **2** | Fluency & pacing | 1.0 | 1 đến 29 | "Does each speaker finish inside the seconds of the slides, with the pauses marked in the file?" | Cả nhóm | [ ] ĐẠT |
| **3** | Naturalness, pronunciation & intonation | 1.0 | 1 đến 29 | "Can each speaker say the ten difficult words of the file, with the stress on the marked syllable?" | Cả nhóm | [ ] ĐẠT |
| **4** | Interaction with audience | 1.0 | 1 đến 3 | "Does Long run the four interaction moments, and do Nam, Son, Quy, and Phuong Nam speak straight through with no greeting, no hand-off, and no question?" | Cả nhóm | [ ] ĐẠT |
| **5** | Q&A & communication | 1.0 | 30 | "Does Long repeat the question first, answer in two to four sentences, and open slide 6, 22, 25, 26 or 27 when it helps?" | Tran Thanh Long | [ ] ĐẠT |
| **6** | English use: grammar, vocabulary & accuracy | 1.0 | 1 đến 29 | "Are the spoken sentences short, with one idea each, no em dash, and no word 'desk'?" | Cả nhóm | [ ] ĐẠT |
| **7** | Project content & technical approach | 1.0 | 3 đến 21 và 28 | "Do we show why the task has many rules, what Jev, the process, and the LLM may and may not do, and how three real requests go through the flow?" | Tran Thanh Long, Nguyen Phuong Nam | [ ] ĐẠT |
| **8** | Experimental results | 1.5 | 22 đến 27 | "Are the speed-up (2.1 times) and the cost reduction (2.2 times) exact, and are the 31 errors of Level 2 against the 0 errors of Level 3 clear, with the 199 denied requests and the 27 injection requests explained?" | Nam, Son, Quy | [ ] ĐẠT |
| **9** | Analysis & discussion | 1.0 | 25 và 27 đến 29 | "Do we say plainly that this is a challenge set, that two refund inputs were changed after earlier failures, and that zero errors is not proof of a zero rate?" | Vuong Quang Quy, Nguyen Phuong Nam | [ ] ĐẠT |
| **10** | Slides & visual support | 0.5 | 1 đến 30 | "Are the diagrams legible from the back of the classroom without text clutter?" | Nguyen Phuong Nam | [ ] ĐẠT |
| **Tổng** | **Mục tiêu điểm số toàn diện** | **10.0** | | **Sẵn sàng thuyết trình trước lớp và nhận đánh giá chéo** | **Cả nhóm** | **[ ] ĐẠT** |
