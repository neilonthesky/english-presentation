# Tài liệu thuyết trình: Human to LLM & Classifier Support Agent

Học phần English Writing and Presentation Skills, Phenikaa School of Computing, tháng 10/2026. Bài nói tiếng Anh nằm trong `speaker_1.md` đến `speaker_5.md`. Slide: `slides/deck.pptx` (dựng từ `slides/build.js`, chạy `./render.sh`).

## Người nói

| Người nói | Slide | Thời gian | Số từ |
| :--- | :---: | :---: | :---: |
| Tran Thanh Long | 1 đến 22 | 380 s | ~898 |
| Nguyen Thanh Nam | 23 và 24 | 120 s | ~237 |
| Vu Van Son | 25 và 26 | 120 s | ~316 |
| Vuong Quang Quy | 27 và 28 | 120 s | ~309 |
| Nguyen Phuong Nam | 29 và 30 | 120 s | ~237 |
| **Tổng** | 1 đến 30 | **860 s** | **~1997** |

Slide 31 là slide câu hỏi, không tính vào thời gian nói. Long trả lời Q&A theo `qa.md`.

## Slide

| Slide | Tiêu đề | Người nói |
| :---: | :--- | :--- |
| 1 | Structured Decision Gates for Customer Support Agents: Intent Detection and Rule Checks | Tran Thanh Long |
| 2 | Consequential actions: why LLM agents fail alone | Tran Thanh Long |
| 3 | Quick quiz: guess the error rate of the smartest model we have | Tran Thanh Long |
| 4 | The answer: about half | Tran Thanh Long |
| 5 | Hallucination rate on AA-Omniscience | Tran Thanh Long |
| 6 | A higher score does not remove hallucination | Tran Thanh Long |
| 7 | A short history of support systems | Tran Thanh Long |
| 8 | Every action meets a written rule: allow or deny | Tran Thanh Long |
| 9 | Real support policies have many rules | Tran Thanh Long |
| 10 | Meet Jev, a fast classifier | Tran Thanh Long |
| 11 | Jev reads the chat first, then one rule at a time | Tran Thanh Long |
| 12 | Jev returns five fields, then one answer per rule | Tran Thanh Long |
| 13 đến 22 | Ba walk-through (13 đến 16, 17 đến 19, 20 đến 22) | Tran Thanh Long |
| 23 | Test data: 512 customers, 1,024 requests | Nguyen Thanh Nam |
| 24 | Every request ends served, stopped, or in error | Nguyen Thanh Nam |
| 25 | Experimental setup: 1,024 requests, two architectures | Vu Van Son |
| 26 | Jev on our test set: speed, cost, and accuracy | Vu Van Son |
| 27 | Same reply model, different decision step | Vuong Quang Quy |
| 28 | Wrong action labels, correct outcomes on this test set | Vuong Quang Quy |
| 29 | Our idea: limit what each model can trigger | Nguyen Phuong Nam |
| 30 | Conclusion | Nguyen Phuong Nam |
| 31 | Questions? | Long trả lời |

## Tệp

- `speaker_1.md` đến `speaker_5.md`: lời nói của từng người.
- `qa.md`: câu trả lời ngắn cho câu hỏi bất ngờ.
