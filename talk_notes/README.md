# Tài liệu chuẩn bị thuyết trình: Human to LLM & Classifier Support Agent

Chào mừng bạn đến với thư mục tài liệu thuyết trình nhóm cho học phần **English Writing and Presentation Skills** tại Phenikaa School of Computing (tháng 10/2026).

Thư mục này cung cấp toàn bộ kịch bản nói tiếng Anh từng từ một và các hướng dẫn luyện tập cho bài thuyết trình nhóm 5 thành viên.

*Lưu ý về tệp slide:* `slides/deck.pptx` là sản phẩm dựng ra từ `slides/build.js` (chạy `./render.sh` trong thư mục `slides/`). Bộ slide trình bày **1.024 yêu cầu** (tập 100 yêu cầu chạy thật được quy đổi lên 1.024), và tài liệu này đi theo đúng bộ slide đó: cùng con số, cùng thiết kế Level 3, cùng thứ tự slide.

---

## 1. Tên đề tài và thời lượng thuyết trình

- **Tên đề tài (Project Title):** Human to LLM & Classifier Support Agent: A Three-Level Ladder for SaaS Request Triage
- **Bối cảnh sản phẩm:** FrameForge, dịch vụ phần mềm đám mây dạng thuê bao (SaaS) tạo video bằng trí tuệ nhân tạo (AI). Khách hàng thanh toán qua gói thuê bao hàng tháng hoặc hàng năm và mua thêm gói tín dụng render.
- **Giới hạn thời gian:** Theo đề cương học phần (15 phút thuyết trình cho mỗi nhóm, tối đa 20 phút bao gồm cả chuẩn bị và hỏi đáp Q&A), bài thuyết trình gồm **30 slide chính** (cộng Slide 31 là slide câu hỏi, không nằm trong thời gian nói) (12 slide trong đó là ba walk-through, mỗi lần bấm phím là một slide) và phần nói dài **14 phút 23 giây (863 giây)**, tiếp nối bởi **5 phút hỏi đáp Q&A (300 giây)**. Tổng cộng khoảng 19 phút 23 giây, còn khoảng 35 giây dự phòng. Toàn bộ tương tác với khán giả do Long thực hiện ở Slide 1 đến 3 và toàn bộ phần Q&A do Long trả lời. Long cũng đọc ba walk-through (Slide 9 đến 20).
- **Tốc độ nói trung bình:** Khoảng 125 đến 130 từ tiếng Anh mỗi phút (~2.1 từ mỗi giây). Tốc độ này đảm bảo phát âm rõ ràng, ngữ điệu tự nhiên, giúp người nghe và người chấm chéo dễ dàng theo dõi.

---

## 2. Phân công thành viên, vai trò và thời gian nói

Trưởng nhóm (Tran Thanh Long) nói nhiều nhất và có phần trăm đóng góp lớn nhất (28%). Cột "Tỷ lệ" là tỷ lệ đóng góp trong phần Task Allocation của bài báo (`paper.tex`). Thời gian nói không tỷ lệ thuận với cột "Tỷ lệ" vì Long đọc liền một mạch Slide 1 đến 20 (tương tác với khán giả, luật, luồng xử lý và ba walk-through), còn bốn bạn sau nói phần còn lại.

| Thứ tự | Tên thành viên | Mã sinh viên | Nhiệm vụ trong bài báo | Tỷ lệ | Thời gian nói | Số từ mục tiêu |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | **Tran Thanh Long** (Leader) | 23010070 | Topic coordination, Abstract, Introduction, Conclusion, Final editing; toàn bộ tương tác với khán giả, phần giải thích luật và luồng xử lý, ba walk-through và toàn bộ Q&A | 28% | 7 phút 00 giây (420 s); Slide 1 đến 20 | ~845 từ trong ghi chú slide, cộng phần tương tác |
| 2 | **Nguyen Thanh Nam** | 23010056 | Written rules, the rule questions of Level 3, the injection rule, the Security rule | 22% | 2 phút 00 giây (120 s); Slide 21 đến 23 | ~245 từ |
| 3 | **Vu Van Son** | 23010060 | Synthetic dataset creation (1,024 requests, 21 types), Experiment execution | 18% | 2 phút 00 giây (120 s); Slide 24 đến 26 | ~340 từ |
| 4 | **Vuong Quang Quy** | 23010039 | Experimental results, Statistical analysis, Tables and chart generation | 17% | 1 phút 18 giây (78 s); Slide 27 | ~184 từ |
| 5 | **Nguyen Phuong Nam** | 23010028 | Related work, Literature context, Slide visual support, Q&A preparation | 15% | 2 phút 05 giây (125 s); Slide 28 đến 30 | ~290 từ |
| **Tổng** | **5 thành viên** | | | **100%** | **14 phút 23 giây (863 s)** | **~1.917 từ** |

*Ghi chú về phần Q&A:* Trong 5 phút hỏi đáp (300 giây), **Long trả lời tất cả câu hỏi** theo `qa_prep.md`. Bốn bạn còn lại đứng bên cạnh, lắng nghe và chỉ nói khi Long nhường lời.

*Ghi chú về tương tác:* Chỉ Long tương tác với khán giả (câu chuyện, giơ tay, bình chọn, câu hỏi dự đoán). Kịch bản của Nam, Son, Quy và Phuong Nam không có câu hỏi cho khán giả và không có yêu cầu giơ tay.

*Ghi chú về số từ thực tế:* Số từ tiếng Anh của lời thoại nằm trong ghi chú slide (`slides/build.js`, `slides/cases.js`), đã bao gồm câu tự giới thiệu: **Nam 258** (Slide 21: 78, Slide 22: 87, Slide 23: 93), **Son 340** (Slide 24: 84, Slide 25: 136, Slide 26: 120), **Quy 184** (Slide 27: 184), **Phuong Nam 290** (Slide 28: 89, Slide 29: 95, Slide 30: 106), **Long 845** (Slide 1 đến 8: 42, 124, 119, 27, 77, 83, 99, 78; Slide 9 đến 20, tất cả khung walk-through: 196). Tổng 1.972 từ tiếng Anh. tương đương 137 từ mỗi phút khi nói liền 863 giây. Các con số này chỉ để luyện tập: hãy bấm giờ, vì thời gian mới là tiêu chí.

---

## 3. Bảng phân chia slide cho từng diễn giả

30 slide thuyết trình, cộng Slide 31 là slide câu hỏi (Long trả lời, không tính vào thời gian nói) (Slide 4 là bức tường luật minh họa, Slide 5 đến 8 giải thích luật, luồng xử lý, Jev đọc gì và trả lời gì, Slide 9 đến 20 là ba walk-through, do Long nói liền).

| Số slide | Tiêu đề slide | Nội dung trọng tâm | Người trình bày | Thời lượng slide |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Title | Câu chuyện mở đầu (khách đợi hoàn tiền), giới thiệu nhóm, tổng quan FrameForge | Tran Thanh Long | 67 s |
| **2** | Where we start: staff or one LLM agent | Nhân viên hỗ trợ đối chiếu với một LLM agent tự do; câu hỏi nghiên cứu. Tương tác: giơ tay và bình chọn "Which action would you never let a chatbot do alone?" | Tran Thanh Long | 98 s |
| **3** | Three levels, one change at each level | Ba cấp độ, mỗi cấp thay đổi một thứ; mọi cấp chạy trên cùng 1.024 yêu cầu. Tương tác: câu hỏi dự đoán "Which level do you think is faster and cheaper, Level 2 or Level 3?" (không tiết lộ đáp án) | Tran Thanh Long | 98 s |
| **4** | Real support policies have many rules | Bức tường luật minh họa, ghi rõ "Illustration, not our data"; Long nói "many rules, but today only the essential rules gate" | Tran Thanh Long | 12 s |
| **5** | Every action meets a written rule: allow or deny | Năm luật cốt lõi: Security rule, hoàn tiền quá 100 đô, link đổi mật khẩu sang địa chỉ khác, gói đã hủy, xóa dữ liệu luôn bị từ chối; hai cách áp luật của Level 2 và Level 3 | Tran Thanh Long | 23 s |
| **6** | Level 3: Jev answers, and the process decides | Máy trạng thái bảy trạng thái (New, Jev, Rules, Do action, Final message, Chat open, Resolved); Jev quyết định ở hai trạng thái, quy trình đi theo câu trả lời | Tran Thanh Long | 26 s |
| **7** | Jev reads the chat first, then one rule at a time | Hai lần gọi Jev: lần một chỉ đọc chat; lần hai đọc chat, các dòng tài khoản mà hành động cần, và một câu hỏi cho mỗi luật | Tran Thanh Long | 26 s |
| **8** | Jev answers four questions, then one per rule | Bốn câu hỏi của lần gọi một (chủ đề, ưu tiên, hành động, cờ injection) và một câu hỏi cho mỗi luật ở lần gọi hai; cờ injection bật thì hành động là Send reply; chuyển sang ba walk-through | Tran Thanh Long | 24 s |
| **9 đến 20** | Ba walk-through (9 đến 13, 14 đến 17, 18 đến 20) | Ba yêu cầu thật đi qua luồng Level 3, mỗi lần bấm phím tiếp là một slide. Walk-through 1 đi qua mọi trạng thái (5 slide): hoàn tiền không luật nào chặn (R0037). Walk-through 2 (4 slide): hoàn tiền bị luật hạn mức chặn (R0041). Walk-through 3 (3 slide): lệnh ẩn trong tin nhắn (R0086). Mọi câu trả lời của Jev là dữ liệu ghi lại thật | Tran Thanh Long | 22 + 12 + 12 = 46 s |
| **21** | Test data: 512 customers, 1,024 requests | Một khách hàng trong dữ liệu thử nghiệm; 512 khách hàng; mỗi khách gửi từ 1 đến 3 yêu cầu; 1.024 yêu cầu, 21 loại | Nguyen Thanh Nam | 41 s |
| **22** | 1,024 requests in ten families | Biểu đồ số yêu cầu theo mười nhóm; 248 trong 1.024 yêu cầu bị một luật từ chối; 48 yêu cầu giấu lệnh trong tin nhắn; bộ sinh dữ liệu chạy mã thật của hệ thống | Nguyen Thanh Nam | 39 s |
| **23** | Every request ends served, stopped, or in error | Served, Stopped, Error; một lần chạy gây hại là lần làm thay đổi tiền, dữ liệu, gói hoặc mật khẩu trái luật; thêm thời gian máy, chi phí API và kiểm định dấu | Nguyen Thanh Nam | 40 s |
| **24** | Both levels run on the same 1,024 requests | 1.024 yêu cầu ở mỗi cấp; 1.434 lượt gọi Jev và 1.024 lượt gọi LLM ở Level 3; hai câu hỏi nghiên cứu | Vu Van Son | 42 s |
| **25** | Level 3 reads less, so it costs about half | Số token mỗi lượt gọi, giá niêm yết của Jev và của LLM, chi phí mỗi 1.000 yêu cầu: Level 2 là 0,61 đô và Level 3 là 0,29 đô | Vu Van Son | 38 s |
| **26** | Result 1: Jev is fast and cheap, and mostly right | Jev: 0,31 s mỗi lượt gọi, 0,064 đô mỗi 1.000 yêu cầu; độ đúng theo từng câu trả lời; 1.690 trên 1.700 câu trả lời luật đúng | Vu Van Son | 40 s |
| **27** | Result 2: Level 3 is faster, cheaper, and makes fewer errors | Level 3: 776 phục vụ, 248 chặn, 0 lỗi; Level 2: 728 phục vụ, 235 chặn, 61 lỗi; nhanh hơn 1,8 lần, rẻ hơn 2,1 lần; kiểm định dấu p = 0,031 | Vuong Quang Quy | 78 s |
| **28** | Our idea: limit what each model can trigger | Ba vai trò trong Level 3: Jev chỉ trả lời câu hỏi có kiểu, quy trình (process) kiểm tra luật và chạy hành động, LLM chỉ viết tin nhắn cuối; không dùng nguồn ngoài | Nguyen Phuong Nam | 35 s |
| **29** | Why Level 3 stays safe when Jev is wrong | Ba lớp bảo vệ: cờ injection đúng 96%, câu hỏi luật khớp luật 99,4%, 0 trên 174 nhãn hành động sai dẫn tới kết cục sai (các số đã có ở Slide 26) | Nguyen Phuong Nam | 55 s |
| **30** | Conclusion | Tóm tắt các phát hiện cốt lõi, cảm ơn và mời khán giả đặt câu hỏi cho Long | Nguyen Phuong Nam | 35 s |
| **31** | Questions? | Slide câu hỏi: bốn thẻ chỉ slide cần mở khi bị hỏi (Slide 6, Slide 21 đến 23, Slide 26 và 27, Slide 29: vì sao an toàn) | Long trả lời | không tính vào 863 s |

---

## 4. Ánh xạ tiêu chí đánh giá chéo (Peer Evaluation) vào bài nói

Mẫu đánh giá chéo phân bổ **6.0 điểm cho Kỹ năng giao tiếp tiếng Anh (English Communication)** và **4.0 điểm cho Nội dung dự án (Project Content)**, tổng điểm **10.0 điểm**. Bảng dưới đây thể hiện chi tiết cách bài thuyết trình đáp ứng từng tiêu chí.

| Tiêu chí | Điểm tối đa | Trọng tâm đánh giá | Cách thức thể hiện trong bài thuyết trình |
| :--- | :---: | :--- | :--- |
| **1. Presentation & organization** | 1.0 | Cấu trúc mạch lạc, mở đầu, chuyển ý, biển chỉ dẫn và kết luận | Cấu trúc 30 slide bám sát mô hình bậc thang. Có câu chuyển ý và câu bàn giao lượt nói chính thức giữa 5 diễn giả. |
| **2. Fluency & pacing** | 1.0 | Nói lưu loát, ít ngập ngừng, kiểm soát tốc độ (~125 từ/phút) | Mỗi kịch bản đều có ký hiệu ngắt nhịp rõ ràng (`[NGHỈ 1 GIÂY]`, `[NGHỈ 2 GIÂY]`). Thời gian chuẩn xác từng giây giúp không bị cháy giờ. |
| **3. Naturalness, pronunciation & intonation** | 1.0 | Phát âm rõ ràng, nhịp điệu tự nhiên, nối âm chuẩn | Từng tệp diễn giả có bảng hướng dẫn phát âm 10 thuật ngữ khó nhất với phiên âm đơn giản và giải thích cách nhấn trọng âm. |
| **4. Interaction with audience** | 1.0 | Giao tiếp ánh mắt, tương tác khán giả, ngôn ngữ cơ thể | 4 thời điểm tương tác trong `interaction.md`, tất cả do Long thực hiện ở Slide 1 đến 3: câu chuyện mở đầu, giơ tay, bình chọn hành động nguy hiểm nhất, câu hỏi dự đoán cấp độ nào nhanh và rẻ hơn. Có sẵn kịch bản dự phòng khi cả phòng im lặng. Bốn bạn còn lại lắng nghe tích cực, không đặt câu hỏi. |
| **5. Q&A & communication** | 1.0 | Hiểu câu hỏi, trả lời đúng trọng tâm, xử lý tình huống bất ngờ | `qa_prep.md` chuẩn bị sẵn 18 câu trả lời súc tích 2 đến 4 câu cho các câu hỏi kỹ thuật hóc búa nhất. Long trả lời toàn bộ phần Q&A, kèm gợi ý ghi chú, nhắc lại câu hỏi và trung thực khi không chắc. |
| **6. English use: grammar, vocabulary & accuracy** | 1.0 | Ngữ pháp chuẩn xác, từ vựng kỹ thuật đơn giản hóa ASD-STE100 | Toàn bộ lời nói dùng tiếng Anh kỹ thuật đơn giản hóa (Simplified Technical English). Câu ngắn gọn. Không dùng em dash. Tuyệt đối không dùng từ "desk". |
| **7. Project content & technical approach** | 1.0 | Nêu rõ bài toán, kiến trúc state machine, quy tắc văn bản | Định nghĩa rõ rủi ro SaaS (hoàn tiền, xóa dữ liệu). Trình bày chi tiết máy trạng thái bảy trạng thái ở Slide 6 và hai lần gọi Jev ở Slide 7 và 8. |
| **8. Experimental results** | 1.5 | Dẫn chứng số liệu, bảng biểu, độ trễ, chi phí API, hiệu chuẩn | Dẫn số liệu từ `experiment/context_test/level3_v2.json`: 1.024 yêu cầu, Level 3 đạt 0 lỗi cho khách hàng (Level 2: 61 lỗi, trong đó khoảng 20 hành động gây hại), nhanh hơn 1,8 lần, rẻ hơn 2,1 lần. |
| **9. Analysis & discussion** | 1.0 | Phân tích kết quả, kiểm định thống kê, hạn chế | Thảo luận trung thực về giới hạn (1.024 yêu cầu trong 24 loại; sign test p = 0,031 nghĩa là Level 3 ít lỗi hơn một cách có ý nghĩa thống kê; khoảng tin cậy 95% của hai tỷ lệ lỗi vẫn chồng lên nhau; 0 lần gây hại không chứng minh tỷ lệ bằng 0, giới hạn trên là 38 trong 1.024; mỗi luật cần một câu hỏi do nhóm viết; Security rule được tìm thấy trên tập 512 yêu cầu trước đó nên số liệu chính không phải kiểm tra mù). |
| **10. Slides & visual support** | 0.5 | Slide trực quan, dễ đọc, tương phản cao, hỗ trợ lời nói | Thiết kế slide rõ ràng, kiểu chữ lớn, sơ đồ máy trạng thái trực quan, biểu đồ cột so sánh, không dùng hình trang trí thừa thãi. |
| **Tổng cộng** | **10.0** | **Cân bằng giữa giao tiếp tiếng Anh (6.0) và hàm lượng kỹ thuật (4.0)** | |

---

## 5. Cấu trúc các tệp trong thư mục này

- `README.md`: Tệp tổng quan này, bao gồm thời gian, phân công diễn giả, ánh xạ slide và tiêu chí chấm điểm.
- `speaker_1.md`: Kịch bản và ghi chú cho **Tran Thanh Long** (Trưởng nhóm; Slide 1 đến 20; 7 phút 00 giây; gồm toàn bộ tương tác với khán giả và phần phụ trách Q&A).
- `speaker_2.md`: Kịch bản và ghi chú cho **Nguyen Thanh Nam** (Slide 21 đến 23; 2 phút 00 giây).
- `speaker_3.md`: Kịch bản và ghi chú cho **Vu Van Son** (Slide 24 đến 26; 2 phút 00 giây).
- `speaker_4.md`: Kịch bản và ghi chú cho **Vuong Quang Quy** (Slide 27; 1 phút 18 giây).
- `speaker_5.md`: Kịch bản và ghi chú cho **Nguyen Phuong Nam** (Slide 28 đến 30; 2 phút 05 giây; mời khán giả hỏi Long).
- `interaction.md`: Cẩm nang tương tác với khán giả (4 thời điểm, tất cả do Long thực hiện ở Slide 1 đến 3; phương án dự phòng; phần Q&A do Long phụ trách; quy tắc lắng nghe tích cực của bốn bạn còn lại; ngôn ngữ cơ thể).
- `qa_prep.md`: 18 câu hỏi hóc búa nhất của khán giả kèm câu trả lời ngắn gọn; Long trả lời tất cả; có gợi ý cho Long.
- `rehearsal_checklist.md`: Kế hoạch luyện tập, mốc kiểm tra thời gian, danh mục kiểm tra 5 phút trước giờ diễn và bảng tự chấm điểm theo 10 tiêu chí.

---

## 6. Hướng dẫn luyện tập cho nhóm

1. **Đọc to thành tiếng, không học vẹt trong đầu:** Luyện tập từng kịch bản với đồng hồ bấm giờ. Chú ý các ký hiệu ngắt nhịp (`[NGHỈ 1 GIÂY]`) để không nói quá nhanh.
2. **Tuyệt đối không bỏ qua phần tự giới thiệu tên:** Mở đầu lượt nói bằng câu giới thiệu chính thức để giảng viên và bạn học chấm chéo có thể ghi nhận tên bạn ngay trên phiếu đánh giá.
3. **Thực hiện câu bàn giao mạch lạc:** Nói chính xác câu chuyển giao lượt nói ở cuối phần của mình. Nhìn vào người nói tiếp theo và ra cử chỉ đón chào.
4. **Tương tác với slide trình chiếu:** Dùng cử chỉ tay hướng về phía các thẻ thông tin và biểu đồ trên slide khi giải thích. Không nhìn vào màn chiếu quá 2 giây mỗi lần.
