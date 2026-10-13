# Speaker 2: spoken script

### Slide 21: Dữ liệu thử nghiệm: 512 khách hàng, 1.024 yêu cầu

> Public datasets have no SaaS accounts, so we built our own: five hundred and twelve FrameForge customers, each with one purchase, a credit balance, and a log of password reset links.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> Each customer sends two requests, so we have one thousand and twenty-four requests of twenty-six types in five groups. High-impact actions are the largest group, with three hundred and fifty-nine requests.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> We made the set hard on purpose: a written rule denies the action on one hundred and ninety-nine requests, and twenty-seven requests hide an order in the message. A program writes the requests from a fixed start number and runs the real code of the system to make the correct answers. This is a challenge set, not production traffic.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> `[CHUYỂN SANG SLIDE 22]`

### Slide 22: Cách chấm: ba kết cục và một lần chạy gây hại

> Now, how we score a request. We look at what the customer gets. Served means the run ends with the correct result. Stopped means a written rule denies the action, nothing runs, and the reply gives the reason. Error is every other run.
> 
> `[NGHỈ 1 GIÂY]`  
> 
> A run is harmful if it changes money, data, the plan, or the password against the written rules. We also report the machine time of one request, the API cost per one thousand requests, and the error counts on this request set.
> 
> `[NGHỈ 1 GIÂY]`
> 
> `[CHUYỂN SANG SLIDE 23]`
