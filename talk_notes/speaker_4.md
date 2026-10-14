# Speaker 4: Vuong Quang Quy

Slide 27 và 28

### Slide 27: Kết quả 2: cùng model viết câu trả lời, khác bước quyết định

> We tested both systems on the same one thousand and twenty-four requests. Both use the same LLM to write the reply. Only the decision step is different.
> 
> The LLM agent decides in one step. It serves seven hundred and ninety-five requests and stops one hundred and ninety-eight. It gets thirty-one requests wrong. Ten of them cause real damage. Twenty-seven are orders that hide inside the message.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The Jev pipeline serves eight hundred and twenty-five requests and stops one hundred and ninety-nine. It gets none wrong.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Jev is also faster. One request takes five point eight nine seconds, not twelve point four five. It is cheaper too. One thousand requests cost thirty cents, not one dollar and twelve cents.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> These numbers come from our own test set. They do not prove that the system is always safe.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 28]`

### Slide 28: Nhãn hành động sai, kết cục đúng

> These are observed results, not three independent safety guards. The injection flag and the rule answers both come from Jev. First, Jev sets the injection flag right on ninety-eight point four percent of the requests, and when it is on, the process sends a reply.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Second, two thousand and fifty of two thousand and fifty rule answers match the written rules on this set. Third, the first-call action label is wrong on two hundred and seventy-eight requests, and none of them end in a wrong outcome.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The Jev pipeline gets none wrong and has no harmful runs on this set. Two refund inputs were changed after earlier failures, so we saw these failures before this last test.
> 
> `[NGHỈ 1 GIÂY]`  
> `[CHUYỂN SANG SLIDE 29 - PHƯƠNG NAM TIẾP TỤC]`
