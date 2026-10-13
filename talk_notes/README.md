# Tài liệu thuyết trình: Human to LLM & Classifier Support Agent

Học phần English Writing and Presentation Skills, Phenikaa School of Computing, tháng 10/2026. Bài nói tiếng Anh nằm trong `speaker_1.md` đến `speaker_5.md`. Slide: `slides/deck.pptx` (dựng từ `slides/build.js`, chạy `./render.sh`).

## Người nói

| Người nói | Slide | Thời gian | Số từ |
| :--- | :---: | :---: | :---: |
| Tran Thanh Long | 1 đến 20 | 345 s | ~833 |
| Nguyen Thanh Nam | 21 và 22 | 120 s | ~206 |
| Vu Van Son | 23 và 24 | 120 s | ~256 |
| Vuong Quang Quy | 25 và 26 | 120 s | ~253 |
| Nguyen Phuong Nam | 27 và 28 | 120 s | ~219 |
| **Tổng** | 1 đến 28 | **825 s** | **~1767** |

Slide 29 là slide câu hỏi, không tính vào thời gian nói. Long trả lời Q&A theo `qa.md`.

## Slide

| Slide | Tiêu đề | Người nói |
| :---: | :--- | :--- |
| 1 | Customer Support Automation: Intent Classification and Deterministic Rules versus Autonomous LLM Agents | Tran Thanh Long |
| 2 | Consequential actions: why autonomous agents fail alone | Tran Thanh Long |
| 3 | Quick quiz: guess the error rate of the smartest model we have | Tran Thanh Long |
| 4 | The answer: the smartest model still misses about half | Tran Thanh Long |
| 5 | A short history of support automation | Tran Thanh Long |
| 6 | Every action meets a written rule: allow or deny | Tran Thanh Long |
| 7 | Real support policies have many rules | Tran Thanh Long |
| 8 | Meet Jev, a fast classifier | Tran Thanh Long |
| 9 | Jev reads the chat first, then one rule at a time | Tran Thanh Long |
| 10 | Jev returns five fields, then one answer per rule | Tran Thanh Long |
| 11 đến 20 | Ba walk-through (11 đến 14, 15 đến 17, 18 đến 20) | Tran Thanh Long |
| 21 | Test data: 512 customers, 1,024 requests | Nguyen Thanh Nam |
| 22 | Every request ends served, stopped, or in error | Nguyen Thanh Nam |
| 23 | Experimental setup: 1,024 requests, two architectures | Vu Van Son |
| 24 | Jev on our test set: speed, cost, and accuracy | Vu Van Son |
| 25 | Same reply model, different decision step | Vuong Quang Quy |
| 26 | Wrong action labels, correct outcomes on this test set | Vuong Quang Quy |
| 27 | Our idea: limit what each model can trigger | Nguyen Phuong Nam |
| 28 | Conclusion | Nguyen Phuong Nam |
| 29 | Questions? | Long trả lời |

## Tệp

- `speaker_1.md` đến `speaker_5.md`: lời nói của từng người.
- `qa.md`: câu trả lời ngắn cho câu hỏi bất ngờ.
