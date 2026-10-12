# Q&A: câu hỏi bất ngờ (Unprepared Questions)

Long trả lời tất cả câu hỏi trong 5 phút. Bốn bạn còn lại đứng bên cạnh, lắng nghe, chỉ nói khi Long nhường lời. Tệp này chỉ dành cho câu hỏi **không nằm trong kịch bản**. Mọi con số lấy từ slide 24 đến 29.

## Cách trả lời mọi câu hỏi (4 bước)

1. **Nhắc lại câu hỏi** bằng lời của mình: *"Your question is about ..., correct?"* Cả lớp nghe rõ và Long có thêm vài giây nghĩ.
2. **Trả lời trực tiếp trong 2 đến 3 câu**, dùng đúng một số liệu hoặc một sự kiện từ bài. Dừng lại ở đó (khoảng 30 giây).
3. **Nếu không biết:** nói thật, rồi nêu điều bài đã đo: *"We did not test that. What we measured is ..."* Không bịa số.
4. **Nếu người hỏi nêu đúng một hạn chế:** thừa nhận, không phòng thủ: *"You are right. That is a limit of our test."*

## Câu mẫu khi cần thêm thời gian hoặc câu hỏi nằm ngoài đề tài

- *"That is a good question. Let me think for a moment."*
- *"We did not test that, so I cannot give you a number."*
- *"That is outside our project. I can tell you what our test shows."*
- *"Let me hand this to Vu Van Son, who built the dataset."* (Chỉ dùng khi thật cần. Theo bảng phân công trong `README.md`: Nam cho luật, Son cho dữ liệu và cách chạy thí nghiệm, Quy cho kết quả và thống kê, Phuong Nam cho bài liên quan và hạn chế.)

## Câu hỏi có thể xuất hiện và câu trả lời ngắn

| Câu hỏi bất ngờ | Trả lời gợi ý (tiếng Anh, đọc được luôn) |
| :--- | :--- |
| Would this work in a real company? | We do not know yet. We tested a made-up SaaS company and a test set that we built. Real traffic is future work. |
| Why not use a bigger LLM? | We did not test that. We compared two designs on the same 1,024 requests. Level 2 already uses an LLM. The gain in Level 3 comes from the deciding step: a fast classifier decides, and the LLM only writes the reply. |
| Is it safe to use now? | Not yet. Level 3 made 0 errors on 1,024 requests, but that does not prove zero. The upper limit of the 95% Wilson interval is about 0.4%. |
| What if Jev answers a rule wrongly? | It can happen. The code does not check the answer again. We list this as a limit. |
| Does this replace support staff? | We did not test that. Staff time (90 s per request) is only an assumed reference. We compared two automated designs. |
| Who wrote the rules? | We wrote them by hand. Each rule needs one question that the team writes. |
| Does it work in other languages? | We did not test that. All requests are in English. |
| How much does it cost? | The API cost for 1,000 requests: $0.297 at Level 3 and $0.640 at Level 2, which is 2.2 times lower. |
| How fast is it? | The mean machine time is 5.89 s at Level 3 and 12.45 s at Level 2, which is 2.1 times lower. |
| What was the hardest part? | (Câu trả lời cá nhân, 1 câu.) For example: writing one clear yes/no question for each rule. |
| What did you learn? | The gain comes from the deciding step, not from a bigger model. A fixed process around a small classifier gave fewer errors, less time, and less cost on this set. |
| Câu hỏi hoàn toàn ngoài đề tài | *"That is outside our project. I would not guess. After the session, we can talk."* |

Khi một câu hỏi đòi số liệu chưa có trong bảng trên, mở slide kết quả (24 đến 27) và đọc đúng số trên slide.
