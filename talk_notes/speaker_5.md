# Speaker 5: Nguyen Phuong Nam

Slide 29 và 30

### Slide 29: Ý tưởng của chúng tôi: giới hạn điều mỗi mô hình có thể kích hoạt

> Our idea is to limit what each model can trigger. Jev has no action tool. It answers typed questions about the chat and the rules.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Fixed code runs the action only when no rule blocks it. The LLM drafts the final message after the action or the refusal, and it cannot change that decision. A draft cannot touch money or data. Only the code can.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> This is fixed execution, not independent policy verification: the code does not recheck the policy facts against the account, so a wrong rule answer can still allow an unsafe action.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 30]`

### Slide 30: Kết luận

> Last, we tested both systems on the same one thousand and twenty-four requests. The LLM agent serves seven hundred and ninety-five and stops one hundred and ninety-eight. It gets thirty-one wrong. The Jev pipeline serves eight hundred and twenty-five and stops one hundred and ninety-nine. It gets none wrong.
> 
> `[NGHỈ 1 GIÂY]`
> 
> The Jev pipeline is two point one times faster and three point eight times cheaper. Each rule needs a question that we write. We changed two refund inputs after earlier failures, so we saw these failures before the last test. We did not test other models.
> 
> `[NGHỈ 1 GIÂY]`
> 
> Thank you for listening.
>
> `[CHUYỂN SANG SLIDE 31 - HỎI ĐÁP]`
