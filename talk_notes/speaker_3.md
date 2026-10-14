# Speaker 3: Vu Van Son

Slide 25 và 26

### Slide 25: Cách chạy và giá: hai kiến trúc, hai mô hình, một bảng giá

> We call two hosted models for real: Jev, version one point thirteen, and DeepSeek V four point one Flash. Both systems run on the same one thousand and twenty-four requests. Each system runs on its own.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The LLM agent makes two LLM calls for each request. One call classifies the request. One call writes the answer. The Jev pipeline makes one point five Jev calls and one LLM call. Jev costs four point two cents per million input tokens. Its output is free. The LLM costs fifteen cents in and sixty cents out per million tokens.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> At list price, one thousand requests cost one dollar and twelve cents for the LLM agent and thirty cents for the Jev pipeline. These are API token charges. They are not the total operating cost.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 26]`

### Slide 26: Kết quả 1: Jev nhanh, rẻ và phần lớn đúng

> Now the first result, for Jev alone. Half of the requests need zero point four seven seconds or less of Jev time. This includes the rule calls. All Jev calls cost six point six cents per one thousand requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first call gives the right topic on ninety-three point three percent of the scored requests. It gives the right priority on eighty-six point five percent. It gives the right action on seventy-two point nine percent. It gives the right injection flag on ninety-eight point four percent. Two thousand and fifty of two thousand and fifty rule answers match the written rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> The first-call action label is wrong on two hundred and seventy-eight requests. None of these end in a wrong outcome. We changed two refund inputs after earlier failures. So we saw these failures before the last test.
> 
> `[NGHỈ 1 GIÂY]`
> 
> `[CHUYỂN SANG SLIDE 27]`
