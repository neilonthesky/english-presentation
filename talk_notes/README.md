# Tài liệu chuẩn bị thuyết trình: Human to LLM & Classifier Support Agent

Chào mừng bạn đến với thư mục tài liệu thuyết trình nhóm cho học phần **English Writing and Presentation Skills** tại Phenikaa School of Computing (tháng 10/2026).

Thư mục này cung cấp toàn bộ kịch bản nói tiếng Anh từng từ một và các hướng dẫn luyện tập cho bài thuyết trình nhóm 5 thành viên.

*Lưu ý về tệp slide:* `slides/deck.pptx` là sản phẩm dựng ra từ `slides/build.js` (chạy `./render.sh` trong thư mục `slides/`). Tài liệu thuyết trình này và bộ slide tuân theo đúng mô hình bậc thang 3 cấp độ trên **100 yêu cầu** đã chạy thật, khớp với `paper.tex` và `experiment/results/results.json`.

---

## 1. Tên đề tài và thời lượng thuyết trình

- **Tên đề tài (Project Title):** Human to LLM & Classifier Support Agent: A Three-Level Ladder for SaaS Request Triage
- **Bối cảnh sản phẩm:** FrameForge, dịch vụ phần mềm đám mây dạng thuê bao (SaaS) tạo video bằng trí tuệ nhân tạo (AI). Khách hàng thanh toán qua gói thuê bao hàng tháng hoặc hàng năm và mua thêm gói tín dụng render.
- **Giới hạn thời gian:** Theo đề cương học phần (15 phút thuyết trình cho mỗi nhóm, tối đa 20 phút bao gồm cả chuẩn bị và hỏi đáp Q&A), bài thuyết trình gồm 34 slide (15 slide trong đó là ba walk-through, mỗi lần bấm phím là một slide) và dài **15 phút 00 giây (900 giây)**, đúng bằng giới hạn 15 phút và không còn thời gian dự phòng, tiếp nối bởi **5 phút hỏi đáp Q&A (300 giây)**. Mọi người nói ít nhất 120 giây. Nếu nhóm muốn có thời gian dự phòng thì Slide 3 của Long (100 giây) là chỗ đầu tiên nên cắt. Toàn bộ tương tác với khán giả do Long thực hiện ở Slide 1 đến 3 và toàn bộ phần Q&A do Long trả lời. Long cũng đọc ba walk-through (Slide 8 đến 30).
- **Tốc độ nói trung bình:** Khoảng 130 từ tiếng Anh mỗi phút (~2.17 từ mỗi giây). Tốc độ này đảm bảo phát âm rõ ràng, ngữ điệu tự nhiên, giúp người nghe và người chấm chéo dễ dàng theo dõi.

---

## 2. Phân công thành viên, vai trò và thời gian nói

Trưởng nhóm (Trần Thành Long) nói nhiều nhất và có phần trăm đóng góp lớn nhất (28%). Cột "Tỷ lệ" là tỷ lệ đóng góp trong phần Task Allocation của bài báo (`paper.tex`). Thời gian nói không còn đúng tỷ lệ với cột "Tỷ lệ" vì Long đọc liền một mạch Slide 1 đến 22 (tương tác với khán giả, luật, luồng xử lý và ba walk-through), còn bốn bạn sau nói đúng 120 giây mỗi người (xem bảng).

| Thứ tự | Tên thành viên | Mã sinh viên | Nhiệm vụ trong bài báo | Tỷ lệ | Thời gian nói | Số từ mục tiêu |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | **Tran Thanh Long** (Leader) | 23010070 | Topic coordination, Abstract, Introduction, Conclusion, Final editing; toàn bộ tương tác với khán giả, phần giải thích luật và luồng xử lý, ba walk-through và toàn bộ Q&A | 28% | 7 phút 00 giây (420 s); Slide 1 đến 22 | ~330 từ + Slide 1–3 |
| 2 | **Nguyen Thanh Nam** | 23010056 | Written rules, Level 3 routing rules, Rules check for refunds and data deletions | 22% | 2 phút 00 giây (120 s); 3 slide | ~235 từ |
| 3 | **Vu Van Son** | 23010060 | Synthetic dataset creation (100 requests, 24 types), Experiment execution | 18% | 2 phút 00 giây (120 s); 3 slide | ~250 từ |
| 4 | **Vuong Quang Quy** | 23010039 | Experimental results, Statistical analysis, Tables and chart generation | 17% | 2 phút 00 giây (120 s); 3 slide | ~235 từ |
| 5 | **Nguyen Phuong Nam** | 23010028 | Related work, Literature context, Slide visual support, Q&A preparation | 15% | 2 phút 00 giây (120 s); 3 slide, ít chữ hơn nhưng nói chậm | ~260 từ |
| **Tổng** | **5 thành viên** | | | **100%** | **15 phút 00 giây (900 s)** | **~1,800 từ** |

*Ghi chú về phần Q&A:* Trong 5 phút hỏi đáp (300 giây), **Long trả lời tất cả câu hỏi** theo `qa_prep.md`. Bốn bạn còn lại đứng bên cạnh, lắng nghe và chỉ nói khi Long nhường lời.

*Ghi chú về tương tác:* Chỉ Long tương tác với khán giả (câu chuyện, giơ tay, bình chọn, câu hỏi dự đoán). Kịch bản của Nam, Son, Quy và Phuong Nam không có câu hỏi cho khán giả và không có yêu cầu giơ tay.

*Ghi chú về số từ thực tế:* Số từ tiếng Anh của lời thoại trong ghi chú slide (`slides/build.js`, `slides/cases.js`), đã bao gồm câu tự giới thiệu: **Nam 235** (Slide 23: 79, Slide 24: 76, Slide 25: 80), **Son 249** (Slide 26: 85, Slide 27: 78, Slide 28: 86), **Quy 233** (Slide 29: 78, Slide 30: 74, Slide 31: 81), **Phuong Nam 261** (Slide 32: 69, Slide 33: 113, Slide 34: 79), **Long** khoảng 307 từ ở Slide 4 đến 22 (Slide 4: 61, 5: 51, 6: 55, 7: 48, ba walk-through 119) cộng phần nói ở Slide 1 đến 3. Bốn bạn sau nói khoảng 120 từ/phút để đủ 120 giây; thời gian từng slide nhỏ (30 đến 55 giây) nên dùng đồng hồ để kiểm tra.

---

## 3. Bảng phân chia slide cho từng diễn giả

31 slide thuyết trình (Slide 4 là bức tường luật minh họa, Slide 5 đến 8 giải thích luật, luồng xử lý, Jev đọc gì và trả lời gì, các slide 9 đến 19 là ba walk-through, do Long nói liền). **Lưu ý:** thiết kế Level 3 trong deck (Jev đọc tài khoản và luật làm ngữ cảnh, không có bước Gather info và Rules check) khác thiết kế mà `paper.tex` và thí nghiệm đã đo (có bước kiểm tra cố định phía sau Jev); các slide kết quả ghi rõ điều này: mở đầu bằng tình huống thực tế, kiến trúc bậc thang 3 cấp độ, thiết lập thực nghiệm tổng hợp, kết quả thực nghiệm trực tiếp, các hạn chế nghiên cứu và kết luận cuối cùng.

| Số slide | Tiêu đề slide | Nội dung trọng tâm | Người trình bày | Thời lượng slide |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Title & Introduction | Câu chuyện mở đầu (khách đợi hoàn tiền), giới thiệu nhóm, tổng quan FrameForge | Tran Thanh Long | 1 phút 10 giây (70 s) |
| **2** | Where We Start: Two Old Ways | Nhân viên hỗ trợ đối chiếu với chatbot LLM tự do; bài toán đánh đổi giữa tốc độ và rủi ro. Tương tác: câu hỏi giơ tay và bình chọn "Which action would you never let a chatbot do alone?" | Tran Thanh Long | 1 phút 40 giây (100 s) |
| **3** | The Three-Level Ladder | Giới thiệu từng bước Level 1 (Staff only), Level 2 (LLM agent), Level 3 (Jev + LLM + rules). Tương tác: câu hỏi dự đoán "Which level do you think is faster and cheaper, Level 2 or Level 3?" (không tiết lộ đáp án) | Tran Thanh Long | 1 phút 40 giây (100 s) |
| **4** | Real support policies have many rules | Bức tường luật minh họa (R-001 đến R-280), ghi rõ "Illustration, not our data"; Long nói "many rules, but today only the essential rules gate" | Long | 12 giây |
| **5** | The Written Rules | Quy tắc cho hành động nhạy cảm: hoàn tiền, xóa dữ liệu, hủy gói, đổi mật khẩu; Security rule (báo cáo gian lận có nhãn chủ đề Security thì mọi thay đổi trạng thái bị từ chối) | Tran Thanh Long | 0 phút 28 giây (28 s) |
| **6** | Level 3: Jev and an LLM | Máy trạng thái sáu trạng thái của Level 3 (New, Jev, Do action, Final message, Chat open, Resolved); Jev quyết định, quy trình đi theo câu trả lời (allow chạy hành động, deny không chạy gì); LLM chỉ viết văn bản | Tran Thanh Long | 0 phút 26 giây (26 s) |
| **7** | Jev reads the chat, the account, and the rules | Jev đọc ba thứ trong một lần gọi: cuộc chat, tài khoản (sáu trường) và các luật bằng văn bản ở dạng văn bản (ngữ cảnh, không phải mã); không có mã cố định chọn trường hay kiểm tra luật | Tran Thanh Long | 0 phút 26 giây (26 s) |
| **8** | Jev answers five questions, and the process follows | Năm câu hỏi của Jev (chủ đề, mức ưu tiên, hành động, được phép theo luật hay không, cờ injection); allow chạy hành động, deny không chạy gì; cờ injection bật thì hành động là Send reply; chuyển sang ba walk-through | Tran Thanh Long | 0 phút 24 giây (24 s) |
| **9 đến 19** | Ba walk-through (9 đến 13, 14 đến 16, 17 đến 19) | Ba yêu cầu thật đi qua luồng Level 3, mỗi lần bấm phím tiếp là một slide. Walk-through 1 đi qua mọi trạng thái (5 slide): hoàn tiền được cho phép (R0037). Walk-through 2 và 3 chỉ 3 slide (Jev, Final message): hoàn tiền bị từ chối (R0041) và lệnh ẩn trong tin nhắn (R0085). Đáp án "Allowed" của Jev là minh họa theo kết quả kiểm tra luật đã ghi lại (thiết kế mới chưa chạy), slide có ghi rõ | Tran Thanh Long | 22 + 12 + 12 = 46 s |
| **20** | Test Data: 72 Customers, 100 Requests | Một khách hàng trong dữ liệu thử nghiệm (một giao dịch, gói, số dư tín dụng, nhật ký liên kết đặt lại, đồng đội không có quyền thanh toán); 72 khách hàng, 100 yêu cầu, 24 loại, 88 chủ tài khoản và 12 đồng đội | Nguyen Thanh Nam | 0 phút 41 giây (41 s) |
| **21** | 100 Requests in Ten Families | Biểu đồ số yêu cầu theo mười nhóm; 30 trong 100 yêu cầu bị quy tắc bằng văn bản từ chối; bộ sinh dữ liệu chạy mã thật của hệ thống | Nguyen Thanh Nam | 0 phút 39 giây (39 s) |
| **22** | What We Count: Three Outcomes and One Harm Flag | Served, Stopped, Error; một lần chạy gây hại là lần làm thay đổi tiền, dữ liệu, gói hoặc mật khẩu trái luật; thêm thời gian máy, chi phí API và kiểm định dấu | Nguyen Thanh Nam | 0 phút 40 giây (40 s) |
| **23** | The Run: Two Hosted Models, 600 Calls | 600 lượt gọi model (200 ở mỗi lần chạy), 2 model, 412 lượt gọi LLM thật, 0 lượt gọi Jev thật; hai câu hỏi nghiên cứu | Vu Van Son | 0 phút 42 giây (42 s) |
| **24** | Same Input, List Prices | Cùng đầu vào cho hai bộ phân loại (nội dung chat, vai trò người gửi, kênh, bài trợ giúp; không đọc tài khoản); giá niêm yết: Jev 0,042 USD mỗi triệu token vào, đầu ra miễn phí; LLM 0,15 USD vào và 0,60 USD ra; 600 lượt gọi tốn khoảng 0,17 USD | Vu Van Son | 0 phút 38 giây (38 s) |
| **25** | Result 1: Classifier Stage | So sánh Jev và LLM: độ trễ trung vị (0.263 s vs 5.223 s), chi phí ($0.052 vs $0.564 trên 1k); độ chính xác theo từng câu trả lời | Vu Van Son | 0 phút 40 giây (40 s) |
| **26** | Jev Reports a Confidence | Jev sai chủ đề hoặc hành động ở 27 trong 100 yêu cầu nhưng không thành lỗi ở Level 3; 24 trong 57 câu trả lời dưới 0.8 bị sai, 9 trong 190 câu từ 0.9 trở lên bị sai (4.7%) | Vuong Quang Quy | 0 phút 40 giây (40 s) |
| **27** | Result 2: Level 3 Is Never Worse | Số yêu cầu phục vụ (70 vs 66), số chặn (30 vs 28), 0 lỗi Level 3 vs 6 lỗi (2 gây hại) ở Level 2, nhanh hơn 1.9x, rẻ hơn 2.2x, sign test p = 0.031 | Vuong Quang Quy | 0 phút 38 giây (38 s) |
| **28** | Without a Fixed Check, Jev's Errors Run | Bỏ bước kiểm tra cố định phía sau Jev: 66 phục vụ, 12 chặn, 22 lỗi gây hại; có kiểm tra: 70, 30, 0 (kiểm định dấu p = 4,8e-7); phía sau agent LLM bước kiểm tra không đổi gì (p = 1). Câu hỏi mở: thiết kế mới đưa luật cho Jev làm ngữ cảnh, chưa được chạy | Vuong Quang Quy | 0 phút 42 giây (42 s) |
| **29** | Related Work | Prompt injection (Greshake 2023), phòng thủ bằng thiết kế (CaMeL, các mẫu thiết kế), nền tảng hỗ trợ định tuyến bằng quy tắc (Zendesk, Intercom Fin) | Nguyen Phuong Nam | 0 phút 30 giây (30 s) |
| **30** | Limits and What We Claim | Cỡ mẫu tập trung (100 yêu cầu trong 24 loại), dữ liệu tổng hợp, giả định 90 s của nhân viên, Security rule được tìm thấy trên tập 50 yêu cầu trước đó nên số liệu chính không phải kiểm tra mù | Nguyen Phuong Nam | 0 phút 55 giây (55 s) |
| **31** | Conclusion | Tóm tắt các phát hiện cốt lõi, cảm ơn và mời khán giả đặt câu hỏi cho Long | Nguyen Phuong Nam | 0 phút 35 giây (35 s) |

---

## 4. Ánh xạ tiêu chí đánh giá chéo (Peer Evaluation) vào bài nói

Mẫu đánh giá chéo phân bổ **6.0 điểm cho Kỹ năng giao tiếp tiếng Anh (English Communication)** và **4.0 điểm cho Nội dung dự án (Project Content)**, tổng điểm **10.0 điểm**. Bảng dưới đây thể hiện chi tiết cách bài thuyết trình đáp ứng từng tiêu chí.

| Tiêu chí | Điểm tối đa | Trọng tâm đánh giá | Cách thức thể hiện trong bài thuyết trình |
| :--- | :---: | :--- | :--- |
| **1. Presentation & organization** | 1.0 | Cấu trúc mạch lạc, mở đầu, chuyển ý, biển chỉ dẫn và kết luận | Cấu trúc 34 slide bám sát mô hình bậc thang. Có câu chuyển ý và câu bàn giao lượt nói chính thức giữa 5 diễn giả. |
| **2. Fluency & pacing** | 1.0 | Nói lưu loát, ít ngập ngừng, kiểm soát tốc độ (~130 từ/phút) | Mỗi kịch bản đều có ký hiệu ngắt nhịp rõ ràng (`[NGHỈ 1 GIÂY]`, `[NGHỈ 2 GIÂY]`). Thời gian chuẩn xác từng giây giúp không bị cháy giờ. |
| **3. Naturalness, pronunciation & intonation** | 1.0 | Phát âm rõ ràng, nhịp điệu tự nhiên, nối âm chuẩn | Từng tệp diễn giả có bảng hướng dẫn phát âm 10 thuật ngữ khó nhất với phiên âm đơn giản và giải thích cách nhấn trọng âm. |
| **4. Interaction with audience** | 1.0 | Giao tiếp ánh mắt, tương tác khán giả, ngôn ngữ cơ thể | 4 thời điểm tương tác trong `interaction.md`, tất cả do Long thực hiện ở Slide 1 đến 3: câu chuyện 30 giây, giơ tay, bình chọn hành động nguy hiểm nhất, câu hỏi dự đoán cấp độ nhanh và rẻ hơn. Có sẵn kịch bản dự phòng khi cả phòng im lặng. Bốn bạn còn lại lắng nghe tích cực, không đặt câu hỏi. |
| **5. Q&A & communication** | 1.0 | Hiểu câu hỏi, trả lời đúng trọng tâm, xử lý tình huống bất ngờ | `qa_prep.md` chuẩn bị sẵn 18 câu trả lời súc tích 2 đến 4 câu cho các câu hỏi kỹ thuật hóc búa nhất. Long trả lời toàn bộ phần Q&A, kèm gợi ý ghi chú, nhắc lại câu hỏi và trung thực khi không chắc. |
| **6. English use: grammar, vocabulary & accuracy** | 1.0 | Ngữ pháp chuẩn xác, từ vựng kỹ thuật đơn giản hóa ASD-STE100 | Toàn bộ lời nói dùng tiếng Anh kỹ thuật đơn giản hóa (Simplified Technical English). Câu ngắn gọn. Không dùng em dash. Tuyệt đối không dùng từ "desk". |
| **7. Project content & technical approach** | 1.0 | Nêu rõ bài toán, kiến trúc state machine, quy tắc văn bản | Định nghĩa rõ rủi ro SaaS (hoàn tiền, xóa dữ liệu). Trình bày chi tiết máy trạng thái trong các Slide 3, 4 và 5. |
| **8. Experimental results** | 1.5 | Dẫn chứng số liệu, bảng biểu, độ trễ, chi phí API, hiệu chuẩn | Dẫn số liệu chuẩn xác từ `experiment/results/results.json`: 100 yêu cầu, Level 3 đạt 0 lỗi cho khách hàng (Level 2: 6 lỗi, trong đó 2 hành động gây hại), nhanh hơn 1.9x, rẻ hơn 2.2x, 0 hành động gây hại ở Level 3. |
| **9. Analysis & discussion** | 1.0 | Phân tích kết quả, kiểm định thống kê, hạn chế | Thảo luận trung thực về giới hạn (100 yêu cầu trong 24 loại; sign test p = 0.031: Level 3 có ít lỗi hơn một cách có ý nghĩa thống kê, dù khoảng tin cậy Wilson của hai tỷ lệ lỗi còn chồng lên nhau; luận điểm mạnh là tốc độ, chi phí, ít lỗi hơn và never-worse; 0 hành động gây hại trong 100 yêu cầu không chứng minh tỷ lệ bằng 0, giới hạn trên 95% là 3.7%), lưu ý Security rule và bảng trường tài khoản được tìm thấy trên tập 50 yêu cầu trước đó nên số liệu chính không phải kiểm tra mù, và lưu ý về label error. |
| **10. Slides & visual support** | 0.5 | Slide trực quan, dễ đọc, tương phản cao, hỗ trợ lời nói | Thiết kế slide thanh lịch, kiểu chữ rõ ràng, sơ đồ state machine trực quan, biểu đồ cột so sánh, không dùng hình trang trí thừa thãi. |
| **Tổng cộng** | **10.0** | **Cân bằng giữa giao tiếp tiếng Anh (6.0) và hàm lượng kỹ thuật (4.0)** | |

---

## 5. Cấu trúc các tệp trong thư mục này

- `README.md`: Tệp tổng quan này, bao gồm thời gian, phân công diễn giả, ánh xạ slide và tiêu chí chấm điểm.
- `speaker_1.md`: Kịch bản và ghi chú cho **Tran Thanh Long** (Trưởng nhóm; Slide 1–19; 7 phút 00 giây; gồm toàn bộ tương tác với khán giả và phần phụ trách Q&A).
- `speaker_2.md`: Kịch bản và ghi chú cho **Nguyen Thanh Nam** (Slide 20–22; 2 phút 00 giây; 3 slide).
- `speaker_3.md`: Kịch bản và ghi chú cho **Vu Van Son** (Slide 23–25; 2 phút 00 giây; 3 slide).
- `speaker_4.md`: Kịch bản và ghi chú cho **Vuong Quang Quy** (Slide 26–28; 2 phút 00 giây; 3 slide).
- `speaker_5.md`: Kịch bản và ghi chú cho **Nguyen Phuong Nam** (Slide 29–31; 2 phút 00 giây; 3 slide; mời khán giả hỏi Long).
- `interaction.md`: Cẩm nang tương tác với khán giả (4 thời điểm, tất cả do Long thực hiện ở Slide 1–3; phương án dự phòng; phần Q&A do Long phụ trách; quy tắc lắng nghe tích cực của bốn bạn còn lại; ngôn ngữ cơ thể).
- `qa_prep.md`: 18 câu hỏi hóc búa nhất của khán giả kèm câu trả lời ngắn gọn; Long trả lời tất cả; có gợi ý cho Long.
- `rehearsal_checklist.md`: Kế hoạch luyện tập, mốc kiểm tra thời gian, danh mục kiểm tra 5 phút trước giờ diễn và bảng tự chấm điểm theo 10 tiêu chí.

---

## 6. Hướng dẫn luyện tập cho nhóm

1. **Đọc to thành tiếng, không học vẹt trong đầu:** Luyện tập từng kịch bản với đồng hồ bấm giờ. Chú ý các ký hiệu ngắt nhịp (`[NGHỈ 1 GIÂY]`) để không nói quá nhanh.
2. **Tuyệt đối không bỏ qua phần tự giới thiệu tên:** Mở đầu lượt nói bằng câu giới thiệu chính thức để giảng viên và bạn học chấm chéo có thể ghi nhận tên bạn ngay trên phiếu đánh giá.
3. **Thực hiện câu bàn giao mạch lạc:** Nói chính xác câu chuyển giao lượt nói ở cuối phần của mình. Nhìn vào người nói tiếp theo và ra cử chỉ đón chào.
4. **Tương tác với slide trình chiếu:** Dùng cử chỉ tay hướng về phía các thẻ thông tin và biểu đồ trên slide khi giải thích. Không nhìn vào màn chiếu quá 2 giây mỗi lần.
