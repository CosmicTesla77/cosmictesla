OpenAI Unveils the Jalapeno Chip and Moves to Own Its Own Silicon
June 25 2026

OpenAI unveiled its first custom AI chip on June 24, 2026. Named Jalapeno, the processor was built in partnership with Broadcom and designed from scratch for large language model inference. Early testing shows the chip delivers performance per watt substantially better than current state of the art AI accelerators, and OpenAI plans to begin deploying it at gigawatt scale by the end of 2026.

## What Is the Jalapeno Chip and What Does It Do?

Jalapeno is an inference processor, which means it is designed specifically to run AI models in response to user queries rather than to train those models. Training, the computationally intensive process of building a model in the first place, will still rely primarily on Nvidia hardware for the foreseeable future. Inference is where OpenAI spends an enormous and growing fraction of its operational costs, because every ChatGPT response, every Codex completion, and every API call requires it. By designing a chip tailored precisely to that workload, OpenAI is betting that it can serve the same intelligence at meaningfully lower cost. Broadcom contributed silicon manufacturing expertise and networking technologies, including its Tomahawk networking chips. The chip went from initial design to manufacturing readiness in nine months, which OpenAI describes as potentially the fastest ASIC development cycle ever achieved in high performance advanced semiconductors.

## Why Is OpenAI Building Its Own Chips Instead of Buying Nvidia?

The short answer is cost and control. Nvidia's GPUs are extraordinarily capable and flexible, handling both training and inference across a vast range of workloads. That flexibility comes at a price premium, and that price premium compounds at the scale OpenAI operates. Greg Brockman, OpenAI's president, has said the company cannot acquire compute fast enough. Broadcom CEO Hock Tan put it more directly, calling the compute demand from OpenAI and its peers simply insatiable. A chip designed only for inference and only for the specific mathematical structures that modern large language models use is cheaper to build and cheaper to operate than a general purpose GPU, even if it cannot do everything a GPU can. OpenAI is also looking ahead to its anticipated public offering and needs a credible story about how it will eventually become profitable. Controlling the inference layer of its own stack is a concrete step toward that.

## What Role Does Broadcom Play in This?

Broadcom's role is substantial and not incidental. The company has a long track record of custom chip design for large technology companies, most notably Google's TPU line of AI accelerators, which have become a significant competitive advantage for Google Cloud. Broadcom's CEO announced that Microsoft has agreed to purchase 40 percent of the initial Jalapeno production, which signals that this is not just an internal experiment for OpenAI but a commercial infrastructure product from the start. The partnership between OpenAI and Broadcom was announced in October 2025, and the nine month timeline from announcement to physical chip delivery is genuinely remarkable for semiconductor development, where multiyear cycles are standard. OpenAI used its own models to accelerate parts of the chip design process, which is one of the more interesting recursive applications of the technology.

## What Does This Mean for Nvidia?

Nvidia became the most valuable company in the world largely because every major AI lab needed its chips and there was no alternative at scale. Custom silicon programs like Jalapeno are the first credible structural challenge to that position. Google's TPUs have reduced Google Cloud's dependence on Nvidia for certain workloads. Amazon's Trainium chips serve a similar function within AWS. Now OpenAI, the company that kicked off the current AI infrastructure boom, is adding its own silicon to that list. Jalapeno is inference only, which means Nvidia remains essential for training. But inference at the scale OpenAI runs is where the ongoing operational costs actually accumulate, and shaving 50 percent off inference costs, as Broadcom's CEO suggested in interviews, changes OpenAI's unit economics in a meaningful way.

## When Will Jalapeno Actually Be Deployed?

OpenAI received the first physical chip samples on June 24, 2026, and is running ML workloads on them in the lab. Full deployment at scale is targeted for late 2026, with expansion across multiple generations of hardware planned beyond that. The initial deployment will involve gigawatt scale data centers built in partnership with Microsoft and other unnamed partners. Broadcom's CEO said the demand signal extends through 2028 and beyond at elevated levels. For a chip that went from concept to wafer in nine months, the ambition of the production roadmap reflects how seriously OpenAI is treating its own silicon as a long term strategic asset rather than a one time engineering exercise.

Check out what else is trending at [GitHub](https://www.cosmictesla.com/#github-trending)
