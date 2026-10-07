# Tài liệu chuẩn bị thuyết trình: Human to LLM & Classifier Support Agent

Chào mừng bạn đến với thư mục tài liệu thuyết trình nhóm cho học phần **English Writing and Presentation Skills** tại Phenikaa School of Computing (tháng 10/2026).

Thư mục này cung cấp toàn bộ kịch bản nói tiếng Anh từng từ một và các hướng dẫn luyện tập cho bài thuyết trình nhóm 5 thành viên.

*Lưu ý về tệp slide:* Tệp cũ `slides/deck.pptx` trong thư mục gốc sử dụng cách gọi 4 bước và 84 yêu cầu từ phiên bản trước; tài liệu thuyết trình này tuân theo đúng mô hình bậc thang 3 cấp độ và 50 yêu cầu hoàn thiện trong `paper.tex` (v35).

---

## 1. Tên đề tài và thời lượng thuyết trình

- **Tên đề tài (Project Title):** Human to LLM & Classifier Support Agent: A Three-Level Ladder for SaaS Request Triage
- **Bối cảnh sản phẩm:** FrameForge, dịch vụ phần mềm đám mây dạng thuê bao (SaaS) tạo video bằng trí tuệ nhân tạo (AI). Khách hàng thanh toán qua gói thuê bao hàng tháng hoặc hàng năm và mua thêm gói tín dụng render.
- **Giới hạn thời gian:** Theo đề cương học phần (15 phút thuyết trình cho mỗi nhóm, tối đa 20 phút bao gồm cả chuẩn bị và hỏi đáp Q&A), bài thuyết trình nay gồm 10 slide và dài **13 phút 26 giây (806 giây)**, dưới giới hạn 15 phút, tiếp nối bởi **5 phút hỏi đáp Q&A (300 giây)**. Bản trước dài 15 phút với 12 slide; hai slide bị bỏ khỏi bộ slide (slide kiểm chứng riêng cho Security rule và slide thử nghiệm an toàn bằng dữ liệu giả mạo) làm tổng thời gian nói giảm 94 giây (56 s của Nguyen Thanh Nam và 38 s của Vuong Quang Quy). Phần thời gian dư là dự phòng an toàn, không dồn vào slide khác.
- **Tốc độ nói trung bình:** Khoảng 130 từ tiếng Anh mỗi phút (~2.17 từ mỗi giây). Tốc độ này đảm bảo phát âm rõ ràng, ngữ điệu tự nhiên, giúp người nghe và người chấm chéo dễ dàng theo dõi.

---

## 2. Phân công thành viên, vai trò và thời gian nói

Trưởng nhóm (Trần Thành Long) vẫn nói nhiều nhất và có phần trăm đóng góp lớn nhất (28%). Cột "Tỷ lệ" là tỷ lệ đóng góp trong phần Task Allocation của bài báo (`paper.tex`). Sau khi bỏ hai slide, thời gian nói của Nguyen Thanh Nam và Vuong Quang Quy **bị giảm** (xem bảng), nên thời gian nói không còn đúng tỷ lệ với cột "Tỷ lệ" nữa.

| Thứ tự | Tên thành viên | Mã sinh viên | Nhiệm vụ trong bài báo | Tỷ lệ | Thời gian nói | Số từ mục tiêu |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | **Tran Thanh Long** (Leader) | 23010070 | Topic coordination, Abstract, Introduction, Conclusion, Final editing | 28% | 4 phút 12 giây (252 s) | ~545 từ |
| 2 | **Nguyen Thanh Nam** | 23010056 | Written rules, Level 3 routing rules, Rules check for refunds and data deletions | 22% | 2 phút 22 giây (142 s), giảm 56 s | ~308 từ |
| 3 | **Vu Van Son** | 23010060 | Synthetic dataset creation (50 requests, 24 types), Experiment execution | 18% | 2 phút 42 giây (162 s) | ~350 từ |
| 4 | **Vuong Quang Quy** | 23010039 | Experimental results, Statistical analysis, Tables and chart generation | 17% | 1 phút 55 giây (115 s), giảm 38 s | ~249 từ |
| 5 | **Nguyen Phuong Nam** | 23010028 | Related work, Literature context, Slide visual support, Q&A preparation | 15% | 2 phút 15 giây (135 s) | ~290 từ |
| **Tổng** | **5 thành viên** | | | **100%** | **13 phút 26 giây (806 s)** | **~1,740 từ** |

*Ghi chú về phần Q&A:* Trong 5 phút hỏi đáp (300 giây), cả 5 thành viên đều tham gia chủ động trả lời theo quy tắc phối hợp nêu trong `qa_prep.md`.

*Ghi chú về số từ thực tế:* Đếm từ tiếng Anh trong các kịch bản hiện tại (không tính ký hiệu ngắt nhịp): Long ~617, Nam N.T. ~365, Son ~318, Quy ~330, Nam N.P. ~328 từ. Các kịch bản đã dài hơn số từ mục tiêu ở bảng trên (điều này có từ bản trước, khi tổng số từ thực tế còn cao hơn). Khi luyện tập hãy bấm giờ thật; nếu một diễn giả vượt giới hạn tối đa trong `rehearsal_checklist.md`, cắt bớt các câu ví dụ phụ chứ không cắt số liệu cốt lõi.

---

## 3. Bảng phân chia slide cho từng diễn giả

10 slide thuyết trình bám sát mạch diễn ngôn của bài báo: mở đầu bằng tình huống thực tế, kiến trúc bậc thang 3 cấp độ, thiết lập thực nghiệm tổng hợp, kết quả thực nghiệm trực tiếp, các hạn chế nghiên cứu và kết luận cuối cùng.

| Số slide | Tiêu đề slide | Nội dung trọng tâm | Người trình bày | Thời lượng slide |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Title & Introduction | Câu chuyện mở đầu (khách đợi hoàn tiền), giới thiệu nhóm, tổng quan FrameForge | Tran Thanh Long | 1 phút 15 giây (75 s) |
| **2** | Where We Start: Two Old Ways | Nhân viên hỗ trợ đối chiếu với chatbot LLM tự do; bài toán đánh đổi giữa tốc độ và rủi ro | Tran Thanh Long | 1 phút 25 giây (85 s) |
| **3** | The Three-Level Ladder | Giới thiệu từng bước Level 1 (Staff only), Level 2 (LLM agent), Level 3 (Jev + LLM + rules) | Tran Thanh Long | 1 phút 32 giây (92 s) |
| **4** | Level 2 & The Written Rules | Quy tắc cho hành động nhạy cảm: hoàn tiền, xóa dữ liệu, hủy gói, đổi mật khẩu; Security rule (báo cáo gian lận vào queue Security thì mọi thay đổi trạng thái bị từ chối) | Nguyen Thanh Nam | 1 phút 10 giây (70 s) |
| **5** | Level 3 Architecture & Flow | Bộ phân loại Jev System One (5 nhãn kèm độ tin cậy), quy tắc điều hướng cố định, Rules check, LLM chỉ viết văn bản | Nguyen Thanh Nam | 1 phút 12 giây (72 s) |
| **6** | Experimental Setup | 72 hồ sơ khách hàng tổng hợp, 50 yêu cầu qua 24 loại, gọi API thật, 2 câu hỏi nghiên cứu | Vu Van Son | 2 phút 42 giây (162 s) |
| **7** | Result 1: Classifier Stage | So sánh Jev và LLM: độ trễ trung vị (0.24 s vs 4.41 s), chi phí ($0.052 vs $0.587 trên 1k), hiệu chuẩn ECE | Vuong Quang Quy | 0 phút 55 giây (55 s) |
| **8** | Result 2: The Ladder Comparison | Số yêu cầu phục vụ (35 vs 32), số chặn (15 vs 15), 0 lỗi Level 3 vs 3, nhanh hơn 2.2x, rẻ hơn 2.4x | Vuong Quang Quy | 1 phút 00 giây (60 s) |
| **9** | Discussion & Study Limitations | Cỡ mẫu tập trung (50 yêu cầu), dữ liệu tổng hợp, giả định 90 s của nhân viên, Security rule được thêm sau khi thấy lỗi nên số liệu chính không phải kiểm tra mù | Nguyen Phuong Nam | 1 phút 15 giây (75 s) |
| **10** | Conclusion & Audience Q&A | Tóm tắt các phát hiện cốt lõi, câu hỏi suy ngẫm cho khán giả, chuyển sang phần hỏi đáp | Nguyen Phuong Nam | 1 phút 00 giây (60 s) |

---

## 4. Ánh xạ tiêu chí đánh giá chéo (Peer Evaluation) vào bài nói

Mẫu đánh giá chéo phân bổ **6.0 điểm cho Kỹ năng giao tiếp tiếng Anh (English Communication)** và **4.0 điểm cho Nội dung dự án (Project Content)**, tổng điểm **10.0 điểm**. Bảng dưới đây thể hiện chi tiết cách bài thuyết trình đáp ứng từng tiêu chí.

| Tiêu chí | Điểm tối đa | Trọng tâm đánh giá | Cách thức thể hiện trong bài thuyết trình |
| :--- | :---: | :--- | :--- |
| **1. Presentation & organization** | 1.0 | Cấu trúc mạch lạc, mở đầu, chuyển ý, biển chỉ dẫn và kết luận | Cấu trúc 10 slide bám sát mô hình bậc thang. Có câu chuyển ý và câu bàn giao lượt nói chính thức giữa 5 diễn giả. |
| **2. Fluency & pacing** | 1.0 | Nói lưu loát, ít ngập ngừng, kiểm soát tốc độ (~130 từ/phút) | Mỗi kịch bản đều có ký hiệu ngắt nhịp rõ ràng (`[NGHỈ 1 GIÂY]`, `[NGHỈ 2 GIÂY]`). Thời gian chuẩn xác từng giây giúp không bị cháy giờ. |
| **3. Naturalness, pronunciation & intonation** | 1.0 | Phát âm rõ ràng, nhịp điệu tự nhiên, nối âm chuẩn | Từng tệp diễn giả có bảng hướng dẫn phát âm 10 thuật ngữ khó nhất với phiên âm đơn giản và giải thích cách nhấn trọng âm. |
| **4. Interaction with audience** | 1.0 | Giao tiếp ánh mắt, tương tác khán giả, ngôn ngữ cơ thể | 5 thời điểm tương tác trong `interaction.md`: câu chuyện 30 giây, giơ tay, bình chọn hành động nguy hiểm nhất, dự đoán kết quả, câu hỏi suy ngẫm. Có sẵn kịch bản dự phòng khi cả phòng im lặng. |
| **5. Q&A & communication** | 1.0 | Hiểu câu hỏi, trả lời đúng trọng tâm, xử lý tình huống bất ngờ | `qa_prep.md` chuẩn bị sẵn 15 câu trả lời súc tích 2 đến 4 câu cho các câu hỏi kỹ thuật hóc búa nhất kèm quy tắc điều phối nhóm. |
| **6. English use: grammar, vocabulary & accuracy** | 1.0 | Ngữ pháp chuẩn xác, từ vựng kỹ thuật đơn giản hóa ASD-STE100 | Toàn bộ lời nói dùng tiếng Anh kỹ thuật đơn giản hóa (Simplified Technical English). Câu ngắn gọn. Không dùng em dash. Tuyệt đối không dùng từ "desk". |
| **7. Project content & technical approach** | 1.0 | Nêu rõ bài toán, kiến trúc state machine, quy tắc văn bản | Định nghĩa rõ rủi ro SaaS (hoàn tiền, xóa dữ liệu). Trình bày chi tiết máy trạng thái trong các Slide 3, 4 và 5. |
| **8. Experimental results** | 1.5 | Dẫn chứng số liệu, bảng biểu, độ trễ, chi phí API, hiệu chuẩn | Dẫn số liệu chuẩn xác từ v35: 50 yêu cầu, Level 3 đạt 0 lỗi cho khách hàng, nhanh hơn 2.2x, rẻ hơn 2.4x, 0 hành động gây hại. |
| **9. Analysis & discussion** | 1.0 | Phân tích kết quả, kiểm định thống kê, hạn chế | Thảo luận trung thực về cỡ mẫu nhỏ (50 yêu cầu, sign test p = 0.25 không có ý nghĩa thống kê; luận điểm mạnh là tốc độ, chi phí và never-worse), lưu ý Security rule được thêm sau khi thấy lỗi gian lận trên 50 yêu cầu nên số liệu chính không phải kiểm tra mù, và lưu ý về label error. |
| **10. Slides & visual support** | 0.5 | Slide trực quan, dễ đọc, tương phản cao, hỗ trợ lời nói | Thiết kế slide thanh lịch, kiểu chữ rõ ràng, sơ đồ state machine trực quan, biểu đồ cột so sánh, không dùng hình trang trí thừa thãi. |
| **Tổng cộng** | **10.0** | **Cân bằng giữa giao tiếp tiếng Anh (6.0) và hàm lượng kỹ thuật (4.0)** | |

---

## 5. Cấu trúc các tệp trong thư mục này

- `README.md`: Tệp tổng quan này, bao gồm thời gian, phân công diễn giả, ánh xạ slide và tiêu chí chấm điểm.
- `speaker_1.md`: Kịch bản và ghi chú cho **Tran Thanh Long** (Trưởng nhóm; Slide 1–3; 4 phút 12 giây).
- `speaker_2.md`: Kịch bản và ghi chú cho **Nguyen Thanh Nam** (Slide 4–5; 2 phút 22 giây; giảm 56 s so với bản trước).
- `speaker_3.md`: Kịch bản và ghi chú cho **Vu Van Son** (Slide 6; 2 phút 42 giây).
- `speaker_4.md`: Kịch bản và ghi chú cho **Vuong Quang Quy** (Slide 7–8; 1 phút 55 giây; giảm 38 s so với bản trước).
- `speaker_5.md`: Kịch bản và ghi chú cho **Nguyen Phuong Nam** (Slide 9–10; 2 phút 15 giây).
- `interaction.md`: Cẩm nang tương tác với khán giả (câu chuyện mở đầu, bình chọn, câu hỏi dự đoán, câu hỏi kết thúc, bản đồ ánh mắt, phương án dự phòng).
- `qa_prep.md`: 15 câu hỏi hóc búa nhất của khán giả kèm câu trả lời ngắn gọn và quy tắc điều hướng diễn giả.
- `rehearsal_checklist.md`: Kế hoạch luyện tập, mốc kiểm tra thời gian, danh mục kiểm tra 5 phút trước giờ diễn và bảng tự chấm điểm theo 10 tiêu chí.

---

## 6. Hướng dẫn luyện tập cho nhóm

1. **Đọc to thành tiếng, không học vẹt trong đầu:** Luyện tập từng kịch bản với đồng hồ bấm giờ. Chú ý các ký hiệu ngắt nhịp (`[NGHỈ 1 GIÂY]`) để không nói quá nhanh.
2. **Tuyệt đối không bỏ qua phần tự giới thiệu tên:** Mở đầu lượt nói bằng câu giới thiệu chính thức để giảng viên và bạn học chấm chéo có thể ghi nhận tên bạn ngay trên phiếu đánh giá.
3. **Thực hiện câu bàn giao mạch lạc:** Nói chính xác câu chuyển giao lượt nói ở cuối phần của mình. Nhìn vào người nói tiếp theo và ra cử chỉ đón chào.
4. **Tương tác với slide trình chiếu:** Dùng cử chỉ tay hướng về phía các thẻ thông tin và biểu đồ trên slide khi giải thích. Không nhìn vào màn chiếu quá 2 giây mỗi lần.
