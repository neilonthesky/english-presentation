# Speaker 3: Vu Van Son

Slide 25 và 26

### Slide 25: Cách chạy và giá: hai kiến trúc, hai mô hình, một bảng giá

> We call two hosted models for real: Jev, version one point thirteen, and DeepSeek V four point one Flash. Both systems run on the same one thousand and twenty-four requests, in separate runs.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The LLM agent makes two LLM calls for each request. One call classifies the request. One call writes the answer. The Jev pipeline makes one point five Jev calls and one LLM call. Jev costs four point two cents per million input tokens, and its output is free. The LLM costs fifteen cents in and sixty cents out per million tokens.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> At list price, one thousand requests cost one dollar and twelve cents for the LLM agent and thirty cents for the Jev pipeline. These are API token charges, not total operating cost.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 26]`

### Slide 26: Kết quả 1: Jev nhanh, rẻ và phần lớn đúng

> Now the first result, for Jev alone. Half of the requests need zero point four seven seconds or less of Jev time, including rule calls, and all Jev calls cost six point six cents per one thousand requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first call gives the right topic on ninety-three point three percent of the scored requests, the priority on eighty-six point five percent, the action on seventy-two point nine percent, and the injection flag on ninety-eight point four percent. Two thousand and fifty of two thousand and fifty rule answers match the written rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first-call action label is wrong on two hundred and seventy-eight requests, and none of these end in a wrong outcome. Two refund inputs were changed after earlier failures, so we saw these failures before the last test.
> 
> `[NGHỈ 1 GIÂY]`
> 
> `[CHUYỂN SANG SLIDE 27]`
