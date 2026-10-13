# Tài liệu chuẩn bị thuyết trình: Human to LLM & Classifier Support Agent

Chào mừng bạn đến với thư mục tài liệu thuyết trình nhóm cho học phần **English Writing and Presentation Skills** tại Phenikaa School of Computing (tháng 10/2026).

Thư mục này cung cấp toàn bộ kịch bản nói tiếng Anh từng từ một và các hướng dẫn luyện tập cho bài thuyết trình nhóm 5 thành viên.

*Lưu ý về tệp slide:* `slides/deck.pptx` là sản phẩm dựng ra từ `slides/build.js` (chạy `./render.sh` trong thư mục `slides/`). Bộ slide trình bày **1.024 yêu cầu chạy thật ở cả hai level** (512 khách hàng, mỗi khách gửi 2 yêu cầu, 26 loại), và tài liệu này đi theo đúng bộ slide đó: cùng con số, cùng thiết kế Level 3, cùng thứ tự slide. Lời nói của Slide 7 và của Slide 11 đến 28 trùng từng từ với ghi chú slide trong `slides/deck.pptx` (trừ câu hướng dẫn "press the next key" ở slide đầu mỗi walk-through, dành cho người bấm phím và không đọc to); tập lệnh tạo tài liệu đã kiểm tra điều đó. Ở Slide 1 đến 10, ghi chú slide là bản tóm tắt hoặc bản chi tiết kèm các điều kiện và giới hạn, nên lời nói thật là kịch bản trong `speaker_1.md`.

---

## 1. Tên đề tài và thời lượng thuyết trình

- **Tên đề tài (Project Title):** Human to LLM & Classifier Support Agent: A Three-Level Ladder for SaaS Request Triage
- **Bối cảnh sản phẩm:** FrameForge, dịch vụ phần mềm đám mây dạng thuê bao (SaaS) tạo video bằng trí tuệ nhân tạo (AI). Khách hàng thanh toán qua gói thuê bao hàng tháng hoặc hàng năm.
- **Giới hạn thời gian:** Theo đề cương học phần (15 phút thuyết trình cho mỗi nhóm, tối đa 20 phút bao gồm cả chuẩn bị và hỏi đáp Q&A), bài thuyết trình gồm **28 slide trình bày** (cộng Slide 29 là slide câu hỏi, không nằm trong thời gian nói; 10 slide trong số đó là ba walk-through, mỗi lần bấm phím là một slide) và phần nói dài **13 phút 45 giây (825 giây)**, tiếp nối bởi **tối đa 5 phút hỏi đáp Q&A (300 giây)**.
- **Dự trữ thời gian:** phần nói ngắn hơn mục tiêu 15 phút là 1 phút 15 giây. Cộng với tối đa 5 phút hỏi đáp, tổng là 18 phút 45 giây, thấp hơn trần 20 phút là 1 phút 15 giây, đủ chỗ cho lúc chuyển slide. Nếu ai nói chậm hơn, các dòng "Nếu vượt khung" trong tệp của Nam, Son, Quy và Phuong Nam chỉ ra câu nào cắt trước.
- **Tương tác và Q&A:** Cả nhóm chỉ có một câu quiz với khán giả, do Long đặt ở Slide 3 và 4, và toàn bộ phần Q&A do Long mở và trả lời. Long cũng đọc ba walk-through (Slide 11 đến 20). Nam, Son, Quy và Phuong Nam nói thẳng từ trên xuống dưới, không chào, không tự giới thiệu, không bàn giao, không hỏi khán giả.
- **Tốc độ nói trung bình:** Mục tiêu là 120 đến 130 từ tiếng Anh mỗi phút (~2 từ mỗi giây) để phát âm rõ ràng, ngữ điệu tự nhiên, giúp người nghe và người chấm chéo dễ theo dõi. Số từ của toàn bộ kịch bản chia cho 820 giây là khoảng 118 từ mỗi phút, đã gồm các lần nghỉ và chờ khán giả.

---

## 2. Phân công thành viên, vai trò và thời gian nói

Trưởng nhóm (Tran Thanh Long) nói nhiều nhất và có phần trăm đóng góp lớn nhất (28%). Cột "Tỷ lệ" là tỷ lệ đóng góp trong phần Task Allocation của bài báo (`paper.tex`). Thời gian nói không tỷ lệ thuận với cột "Tỷ lệ" vì Long đọc liền một mạch Slide 1 đến 20 (câu chuyện mở đầu, câu quiz, luật, luồng xử lý và ba walk-through), còn bốn bạn sau nói phần còn lại.

| Thứ tự | Tên thành viên | Mã sinh viên | Nhiệm vụ trong bài báo | Tỷ lệ | Thời gian nói | Số từ của kịch bản |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | **Tran Thanh Long** (Leader) | 23010070 | Topic coordination, Abstract, Introduction, Conclusion, Final editing; câu quiz duy nhất với khán giả, phần giải thích luật và luồng xử lý, ba walk-through và toàn bộ Q&A | 28% | 5 phút 45 giây (345 s); Slide 1 đến 20 | ~697 từ |
| 2 | **Nguyen Thanh Nam** | 23010056 | Written rules, the rule questions of Level 3, the injection rule, the Security rule | 22% | 2 phút 00 giây (120 s); Slide 21 và 22 | ~206 từ |
| 3 | **Vu Van Son** | 23010060 | Synthetic dataset creation, Experiment execution | 18% | 2 phút 00 giây (120 s); Slide 23 và 24 | ~239 từ |
| 4 | **Vuong Quang Quy** | 23010039 | Experimental results, Statistical analysis, Tables and chart generation | 17% | 2 phút 00 giây (120 s); Slide 25 và 26 | ~241 từ |
| 5 | **Nguyen Phuong Nam** | 23010028 | Related work, Literature context, Slide visual support, Q&A preparation | 15% | 2 phút 00 giây (120 s); Slide 27 và 28 | ~223 từ |
| **Tổng** | **5 thành viên** | | | **100%** | **13 phút 45 giây (825 s)** | **~1606 từ** |

*Ghi chú về phần Q&A:* Trong 5 phút hỏi đáp (300 giây), **Long mở phần hỏi đáp và trả lời tất cả câu hỏi** theo `qa.md`. Bốn bạn còn lại đứng bên cạnh, lắng nghe và chỉ nói khi Long nhường lời.

*Ghi chú về tương tác:* Cả nhóm chỉ có một câu quiz với khán giả (Slide 3 và 4, do Long đặt); câu chuyện mở đầu ở Slide 1 chỉ là lời kể. Kịch bản của Nam, Son, Quy và Phuong Nam không có lời chào, không có câu tự giới thiệu, không có câu bàn giao, không có câu hỏi và không có yêu cầu giơ tay. Tên của bốn bạn chỉ đến từ lời giới thiệu của Long ở Slide 1.

*Ghi chú về số từ thực tế:* Số từ tiếng Anh của lời nói, đếm trên các khối trích dẫn của từng tệp diễn giả (bỏ ký hiệu trong ngoặc vuông), các số viết thành chữ, đã gồm lời chào của Long: **Long 697** (Slide 1 đến 10: 96, 93, 31, 40, 102, 49, 21, 58, 48, 46; ba walk-through: 113), **Nam 206** (Slide 21: 121, Slide 22: 85), **Son 239** (Slide 23: 109, Slide 24: 130), **Quy 241** (Slide 25: 126, Slide 26: 115), **Phuong Nam 223** (Slide 27: 86, Slide 28: 137). Tổng 1606 từ. Tốc độ cần để kịp khung thời gian của từng người: Long 120, Nam 103, Son 120, Quy 120, Phuong Nam 112 từ mỗi phút. Các con số này chỉ để luyện tập: hãy bấm giờ, vì thời gian mới là tiêu chí.

---

## 3. Bảng phân chia slide cho từng diễn giả

28 slide thuyết trình, cộng Slide 29 là slide câu hỏi (Long trả lời, không tính vào thời gian nói). Slide 3 và 4 là cặp quiz (câu hỏi, rồi đáp án); Slide 6 và 7 là các luật viết sẵn và bức tường luật minh họa, Slide 8 đến 10 giới thiệu Jev, giải thích Jev đọc gì và trả lời gì, Slide 11 đến 20 là ba walk-through; Long nói liền từ Slide 1 đến 20.

| Số slide | Tiêu đề slide | Nội dung trọng tâm | Người trình bày | Thời lượng slide |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Customer Support Automation: Intent Classification and Deterministic Rules versus Autonomous LLM Agents | Câu chuyện mở đầu (chatbot trả lời "yêu cầu trong hàng chờ", khách chờ khoảng 10 đến 30 giây), giới thiệu nhóm và bối cảnh FrameForge. Tương tác: câu chuyện mở đầu | Tran Thanh Long | 50 s |
| **2** | Consequential actions: why autonomous agents fail alone | Hai kiến trúc tự động: Autonomous LLM Agent (một mô hình đọc chat, tài khoản, gọi công cụ trực tiếp qua prompt) đối chiếu với Classifier + Rules + LLM (bộ phân loại gắn nhãn ý định trước, mã deterministic kiểm luật, LLM chỉ viết trả lời); câu hỏi dẫn vào quiz ở Slide 3 | Tran Thanh Long | 55 s |
| **3** | Quick quiz: guess the error rate of the smartest model we have | Câu hỏi quiz dựa trên benchmark AA-Omniscience: "How often does the smartest model we have still answer wrongly?" với bốn lựa chọn A-D (Almost never, About one in five, About half, Nearly always); Long đọc bốn lựa chọn, mời giơ tay, nghỉ 5 giây, không tiết lộ đáp án | Tran Thanh Long | 15 s |
| **4** | The answer: the smartest model still misses about half | Đáp án: C (About half) được tô sáng, ba lựa chọn còn lại làm mờ; dòng chữ giải thích "the smartest models still answer about half of the hard questions wrongly instead of refusing; the leaderboard minimum is 18%" | Tran Thanh Long | 10 s |
| **5** | A short history of support automation | Lịch sử hai thời kỳ, cả hai cùng các bước (classifier, luật cố định, câu trả lời), chỉ model bên trong bước thay đổi; "rules" nghĩa là code chương trình thường do người viết (ví dụ hoàn tiền trên 100 đô thì từ chối), chạy y hệt mỗi lần, không phải model: đến 2022 (classifier huấn luyện sẵn + rules, trả lời theo mẫu), 2023-nay (LLM Classifier + Agent: một LLM gán nhãn tin nhắn, rồi một LLM agent giữ luật, quyết định và hành động; nguồn: Bocklisch et al. 2024, Rasa CALM, arXiv 2402.12234). Ba pin: until 2022, 2023-now, và pin cuối là câu hỏi "How do we improve it?" dẫn sang phần sau; không dùng số liệu thí nghiệm, không nhắc Jev. | Tran Thanh Long | 50 s |
| **6** | Every action meets a written rule: allow or deny | Năm luật thiết yếu: Security rule (người khác dùng tài khoản hoặc thẻ), hoàn tiền trên 100 đô, link đổi mật khẩu tới địa chỉ không có trong hồ sơ, gói đã hủy, xóa dữ liệu luôn bị từ chối; hai cách áp luật (autonomous agent đọc luật như prompt, hybrid pipeline hỏi Jev một câu cho mỗi luật) | Tran Thanh Long | 23 s |
| **7** | Real support policies have many rules | Bức tường luật minh họa, ghi rõ "Illustration, not our data"; câu hỏi dẫn vào Slide 8: "Who should apply every rule: an LLM agent, or a fast classifier?"; không nhắc Jev (Jev được giới thiệu ở Slide 8) | Tran Thanh Long | 10 s |
| **8** | Meet Jev, a fast classifier | Giới thiệu Jev (họ System One của TypeSafe AI, phiên bản 1.13.0): nhãn có kiểu kèm độ tin cậy; trả lời các câu có/không do nhóm viết, mỗi luật một câu, không cần tinh chỉnh; không có công cụ hành động và không viết văn bản; giá đầu vào 0,042 đô cho một triệu token, đầu ra miễn phí; bên phải là câu trả lời ghi lại của một yêu cầu (R0353) | Tran Thanh Long | 28 s |
| **9** | Jev reads the chat first, then one rule at a time | Hai lần gọi Jev: lần một chỉ đọc chat; lần hai thêm các dòng tài khoản của hành động và một câu hỏi cho mỗi luật; câu hỏi do nhóm viết | Tran Thanh Long | 23 s |
| **10** | Jev returns five fields, then one answer per rule | Năm trường của lần gọi một (chủ đề, ưu tiên, hành động, cờ rủi ro, cờ injection; bốn trường hiện trên slide); cờ injection bật thì hành động là Send reply; lần gọi hai trả lời một câu có/không cho mỗi luật; chuyển sang ba walk-through | Tran Thanh Long | 21 s |
| **11 đến 20** | Ba walk-through (11 đến 14, 15 đến 17, 18 đến 20) | Ba yêu cầu thật đi qua luồng Level 3, mỗi lần bấm phím tiếp là một slide; walk-through 1 cũng là chỗ giải thích sơ đồ luồng (xanh là mô hình, xám là phần cố định). Walk-through 1 (4 slide): hoàn tiền không luật nào chặn (R0353). Walk-through 2 (3 slide): hoàn tiền bị luật hạn mức chặn (R0441). Walk-through 3 (3 slide): lệnh ẩn trong tin nhắn (R0722). Mọi câu trả lời của Jev trên slide là dữ liệu ghi lại từ lượt chạy thật | Tran Thanh Long | 33 + 12 + 10 = 55 s |
| **21** | Test data: 512 customers, 1,024 requests | Dữ liệu thử nghiệm: 512 khách hàng, mỗi khách gửi 2 yêu cầu, 1.024 yêu cầu thuộc 26 loại trong năm nhóm (biểu đồ: 359, 307, 205, 102, 51); 199 trong 1.024 yêu cầu bị một luật từ chối; 27 yêu cầu giấu lệnh trong tin nhắn; bộ sinh dữ liệu chạy mã thật của hệ thống để tạo đáp án đúng; đây là tập thử thách, không phải lưu lượng thật | Nguyen Thanh Nam | 60 s |
| **22** | Every request ends served, stopped, or in error | Ba kết cục của một yêu cầu (Served, Stopped, Error); một lần chạy gây hại là lần làm thay đổi tiền, dữ liệu, gói hoặc mật khẩu trái luật; ba số đo: thời gian máy của một yêu cầu, chi phí API cho 1.000 yêu cầu, số lỗi trên cùng tập yêu cầu | Nguyen Thanh Nam | 60 s |
| **23** | Experimental setup: 1,024 requests, two architectures | Hai kiến trúc chạy riêng trên cùng 1.024 yêu cầu; hai mô hình thật (Jev jev-1.13.0 và DeepSeek V4.1 Flash); autonomous agent gọi LLM hai lần cho mỗi yêu cầu (0,64 đô cho 1.000 yêu cầu), hybrid pipeline gọi Jev 1,5 lần và LLM một lần (0,30 đô); giá niêm yết của Jev và của LLM; chỉ là phí token API, không phải tổng chi phí vận hành | Vu Van Son | 60 s |
| **24** | Jev on our SaaS test set: speed, cost, and accuracy | Jev: một nửa số yêu cầu cần 0,47 s hoặc ít hơn cho phần Jev (gồm lần gọi luật), 0,066 đô cho 1.000 yêu cầu; độ đúng của lần gọi một: chủ đề 93,3%, ưu tiên 86,5%, hành động 72,9%, cờ injection 98,4%; 2.050 trên 2.050 câu trả lời luật khớp luật; 278 nhãn hành động sai ở lần gọi đầu, 0 dẫn tới kết cục sai | Vu Van Son | 60 s |
| **25** | On our SaaS test set: lower time, cost, and error count | Autonomous agent: 795 phục vụ, 198 chặn, 31 lỗi (10 lần chạy gây hại); hybrid pipeline: 825 phục vụ, 199 chặn, 0 lỗi, 0 gây hại; thời gian máy trung bình 5,89 s so với 12,45 s (2,1 lần); chi phí API 0,30 đô so với 0,64 đô cho 1.000 yêu cầu (2,2 lần) | Vuong Quang Quy | 60 s |
| **26** | Wrong action labels, correct outcomes on this test set | Ba kết quả quan sát được, không phải ba lớp bảo vệ độc lập: cờ injection đúng 98,4% (bật thì hành động là Send reply); 2.050 trên 2.050 câu trả lời luật khớp luật; 0 trên 278 nhãn hành động sai dẫn tới kết cục sai; hai đầu vào hoàn tiền đã đổi sau các lần chạy đầu nên nhóm đã biết các lỗi này trước lần thử cuối | Vuong Quang Quy | 60 s |
| **27** | Our idea: limit what each model can trigger | Giới hạn điều mỗi mô hình có thể kích hoạt: Jev chỉ trả lời câu hỏi có kiểu (không có công cụ hành động, nhưng câu trả lời điều khiển nhánh mã nào chạy); quy trình chỉ chạy hành động khi Jev không báo luật nào bị phá và không tự kiểm lại sự kiện chính sách; LLM chỉ viết tin nhắn cuối. Chạy cố định không phải là kiểm chứng chính sách độc lập | Nguyen Phuong Nam | 60 s |
| **28** | Conclusion | Tóm tắt hai kiến trúc trên cùng 1.024 yêu cầu (795 / 198 / 31 so với 825 / 199 / 0), nhanh hơn 2,1 lần và rẻ hơn 2,2 lần; hạn chế: mỗi luật cần một câu hỏi do nhóm viết, nhóm đã biết các lỗi này trước lần thử cuối, chưa thử mô hình học từ ví dụ hay mô hình quyết định khác; bước tiếp: ticket thật, một tập yêu cầu riêng, hệ thống mạnh hơn để so sánh; liên kết Red Hat là bối cảnh bên ngoài; lời cảm ơn | Nguyen Phuong Nam | 60 s |
| **29** | Questions? | Slide câu hỏi: bốn thẻ chỉ slide cần mở khi bị hỏi (Slide 11 đến 20: ba walk-through, một yêu cầu đi qua luồng; Slide 21 và 22: dữ liệu và cách chấm; Slide 24 và 25: kết quả về tốc độ, chi phí, độ chính xác; Slide 26: nhãn hành động sai và kết cục quan sát được) | Long trả lời | không tính vào 825 s |

---

## 4. Ánh xạ tiêu chí đánh giá chéo (Peer Evaluation) vào bài nói

Mẫu đánh giá chéo phân bổ **6.0 điểm cho Kỹ năng giao tiếp tiếng Anh (English Communication)** và **4.0 điểm cho Nội dung dự án (Project Content)**, tổng điểm **10.0 điểm**. Bảng dưới đây thể hiện cách bài thuyết trình đáp ứng từng tiêu chí.

| Tiêu chí | Điểm tối đa | Trọng tâm đánh giá | Cách thức thể hiện trong bài thuyết trình |
| :--- | :---: | :--- | :--- |
| **1. Presentation & organization** | 1.0 | Cấu trúc mạch lạc, mở đầu, chuyển ý, biển chỉ dẫn và kết luận | 28 slide bám sát mô hình bậc thang: ba level, luật, giới thiệu Jev, luồng xử lý, ba yêu cầu thật, dữ liệu, kết quả, ý tưởng, kết luận. Có câu chuyển ý giữa các phần, và Long đọc tên cả nhóm theo thứ tự nói ở Slide 1. |
| **2. Fluency & pacing** | 1.0 | Nói lưu loát, ít ngập ngừng, kiểm soát tốc độ (120 đến 130 từ/phút) | Mỗi kịch bản đều có ký hiệu ngắt nhịp rõ ràng (`[NGHỈ 1 GIÂY]`, `[NGHỈ 2 GIÂY]`). Số giây của từng slide được ghi rõ (tổng 835 giây), và tốc độ của kịch bản từng người nằm trong khoảng 103 đến 120 từ mỗi phút. |
| **3. Naturalness, pronunciation & intonation** | 1.0 | Phát âm rõ ràng, nhịp điệu tự nhiên, nối âm chuẩn | Từng tệp diễn giả có bảng hướng dẫn phát âm 10 thuật ngữ khó nhất với phiên âm đơn giản và giải thích cách nhấn trọng âm. |
| **4. Interaction with audience** | 1.0 | Giao tiếp ánh mắt, tương tác khán giả, ngôn ngữ cơ thể | Một câu quiz duy nhất ở Slide 3 và 4 do Long đặt (hành động nguy hiểm nhất), cộng câu chuyện mở đầu ở Slide 1; kịch bản và câu dự phòng khi cả phòng im lặng nằm trong `speaker_1.md`. Nam, Son, Quy và Phuong Nam nói thẳng và lắng nghe tích cực; Long mở phần hỏi đáp sau Slide 28. |
| **5. Q&A & communication** | 1.0 | Hiểu câu hỏi, trả lời đúng trọng tâm, xử lý tình huống bất ngờ | `qa.md` có quy trình 4 bước, câu mẫu và câu trả lời ngắn cho các câu hỏi bất ngờ. Long trả lời toàn bộ phần Q&A, kèm gợi ý ghi chú, nhắc lại câu hỏi và trung thực khi không chắc. |
| **6. English use: grammar, vocabulary & accuracy** | 1.0 | Ngữ pháp chuẩn xác, từ vựng kỹ thuật đơn giản hóa ASD-STE100 | Toàn bộ lời nói dùng tiếng Anh kỹ thuật đơn giản hóa (Simplified Technical English). Phần lớn câu ngắn, mỗi câu một ý. Không dùng em dash. Tuyệt đối không dùng từ "desk". |
| **7. Project content & technical approach** | 1.0 | Nêu rõ bài toán, kiến trúc state machine, quy tắc văn bản | Định nghĩa rõ rủi ro SaaS (hoàn tiền, xóa dữ liệu, tài khoản bị người khác dùng). Trình bày máy trạng thái bảy trạng thái ở Slide 8, hai lần gọi Jev ở Slide 9 và 10, và ba yêu cầu thật đi qua luồng ở Slide 11 đến 20. |
| **8. Experimental results** | 1.5 | Dẫn chứng số liệu, bảng biểu, độ trễ, chi phí API, hiệu chuẩn | Dẫn số liệu từ lượt chạy thật trên 1.024 yêu cầu ở cả hai level (Slide 23 đến 26): Level 3 đạt 0 lỗi và 0 lần chạy gây hại (Level 2: 31 lỗi, trong đó 10 lần chạy gây hại), thời gian máy trung bình thấp hơn 2,1 lần (5,89 s so với 12,45 s), chi phí API thấp hơn 2,2 lần (0,30 đô so với 0,64 đô cho 1.000 yêu cầu). Phần hiệu chuẩn nằm trong câu trả lời Q&A. |
| **9. Analysis & discussion** | 1.0 | Phân tích kết quả, kiểm định thống kê, hạn chế | Thảo luận trung thực về giới hạn (Slide 24, 27, 28 và 29): đây là tập thử thách do nhóm tự dựng, không phải lưu lượng thật; nhãn đúng do chính mã áp luật tạo ra; hai đầu vào hoàn tiền đã đổi sau các lần chạy đầu nên nhóm đã biết các lỗi này trước lần thử cuối; 0 lỗi trên 1.024 yêu cầu không chứng minh tỷ lệ bằng 0 (giới hạn trên của khoảng Wilson 95% khoảng 0,4%); mỗi luật cần một câu hỏi do nhóm viết; Jev có thể trả lời sai và mã không kiểm lại; chưa thử mô hình học từ ví dụ hay mô hình quyết định khác. Kiểm định dấu (trên 31 yêu cầu hai level khác nhau, chỉ Level 2 sai) có trong Q&A. |
| **10. Slides & visual support** | 0.5 | Slide trực quan, dễ đọc, tương phản cao, hỗ trợ lời nói | Thiết kế slide rõ ràng, kiểu chữ lớn, sơ đồ máy trạng thái trực quan, ba walk-through đi từng lần bấm, biểu đồ cột và thẻ số liệu lớn ở phần dữ liệu và kết quả. |
| **Tổng cộng** | **10.0** | **Cân bằng giữa giao tiếp tiếng Anh (6.0) và hàm lượng kỹ thuật (4.0)** | |

---

## 5. Cấu trúc các tệp trong thư mục này

- `README.md`: Tệp tổng quan này, bao gồm thời gian, phân công diễn giả, ánh xạ slide và tiêu chí chấm điểm.
- `speaker_1.md`: Kịch bản và ghi chú cho **Tran Thanh Long** (Trưởng nhóm; Slide 1 đến 20; 5 phút 45 giây; gồm cặp quiz ở Slide 3 và 4 và phần phụ trách Q&A).
- `speaker_2.md`: Kịch bản và ghi chú cho **Nguyen Thanh Nam** (Slide 21 và 22; 2 phút 00 giây).
- `speaker_3.md`: Kịch bản và ghi chú cho **Vu Van Son** (Slide 23 và 24; 2 phút 00 giây).
- `speaker_4.md`: Kịch bản và ghi chú cho **Vuong Quang Quy** (Slide 25 và 26; 2 phút 00 giây).
- `speaker_5.md`: Kịch bản và ghi chú cho **Nguyen Phuong Nam** (Slide 27 và 28; 2 phút 00 giây).
- `qa.md`: Quy trình trả lời, câu mẫu và câu trả lời ngắn cho các câu hỏi bất ngờ; Long trả lời tất cả.

---

## 6. Hướng dẫn luyện tập cho nhóm

1. **Đọc to thành tiếng, không học vẹt trong đầu:** Luyện tập từng kịch bản với đồng hồ bấm giờ. Chú ý các ký hiệu ngắt nhịp (`[NGHỈ 1 GIÂY]`) để không nói quá nhanh.
2. **Chỉ Long chào và giới thiệu cả nhóm:** Long đọc tên cả bốn bạn ở Slide 1, nên giảng viên và bạn học chấm chéo ghi nhận được tên từng người. Nam, Son, Quy và Phuong Nam không chào, không tự giới thiệu và không bàn giao: mỗi người nói thẳng vào nội dung của mình.
3. **Tương tác với slide trình chiếu:** Dùng cử chỉ tay hướng về phía các thẻ thông tin và biểu đồ trên slide khi giải thích. Không nhìn vào màn chiếu quá 2 giây mỗi lần.
4. **Ánh mắt và tư thế:** Quét mắt Trái, Giữa, Phải, không nhìn một người hay giấy ghi chú quá 3 giây. Không nhìn xuống sàn. Không cho tay vào túi quần. Khi bạn khác đang nói, đứng nghiêm túc ở một bên sân khấu, nhìn về phía người nói, không bấm điện thoại.
5. **Bấm giờ:** Tổng bài nói 835 giây (13 phút 55 giây), cộng tối đa 300 giây hỏi đáp. Luyện cả bài ít nhất hai lần với đồng hồ; mỗi người tự kiểm tra thời gian của mình trong bảng ở mục 2.
