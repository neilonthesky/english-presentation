# Q&A: câu trả lời ngắn

Long trả lời. Bốn bạn còn lại chỉ nói khi Long nhường lời. Nếu không biết, nói: "We did not test that. What we measured is ..." và không bịa số.

| Question | Short answer |
| :--- | :--- |
| Would this work in a real company? | We do not know yet. We tested a made-up company and a test set that we built. |
| Why not use a bigger LLM? | We did not test that. The reply model is the same in both systems. The decision step is different: its model, its input, and its flow. |
| Is it safe to use now? | Not yet. The Jev pipeline got none wrong on 1,024 requests. That does not prove it is always safe. |
| What if Jev answers a rule wrongly? | It can happen. The code does not check the answer again. This is a limit of our test. |
| Does this replace support staff? | We did not test that. We compared two automated systems. |
| Who wrote the rules? | We wrote them by hand. Each rule has one yes/no question. |
| Does it work in other languages? | We did not test that. All requests are in English. |
| How much does it cost? | One thousand requests cost thirty cents with the Jev pipeline and one dollar twelve with the LLM agent. |
| How fast is it? | One request takes 5.89 seconds with the Jev pipeline and 12.45 seconds with the LLM agent. |
| What did you learn? | A fixed process around a fast classifier got fewer requests wrong, and it is faster and cheaper on this set. |
| A question outside the topic | That is outside our project. I would not guess. |
