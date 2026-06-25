Alibaba Ran the Largest Known Distillation Attack on an AI Company in History
June 25 2026

Anthropic accused Alibaba of conducting the largest known distillation attack ever directed at an AI company, generating more than 28.8 million exchanges with Claude through nearly 25,000 fraudulent accounts between April 22 and June 5, 2026. Anthropic disclosed the attack in a letter dated June 10 to US Senators Tim Scott and Elizabeth Warren and to White House officials, warning that the campaign was designed to help China accelerate its ability to reproduce capabilities found in Anthropic's most advanced models.

## What Is a Distillation Attack and Why Does It Matter?

Distillation is the process of training a less capable AI model on the outputs of a stronger one. The attacking party does not need access to the target model's weights or architecture. They only need access to the model's responses. By generating millions of interactions across a wide range of prompts, an attacker can build a dataset that effectively transfers the stronger model's reasoning patterns, knowledge, and capabilities into a model they control. This is legal when done within a platform's terms of service and with appropriate licensing. It is illegal, and constitutes theft of intellectual property, when it is conducted through fraudulent accounts that bypass geographic restrictions and terms of service agreements.

## How Large Was the Alibaba Operation?

The scale is genuinely without precedent in this category. Anthropic's previous disclosures described a campaign by Chinese AI startup DeepSeek involving over 150,000 exchanges and a campaign by MiniMax involving over 13 million exchanges. The Alibaba campaign, attributed to operators affiliated with Alibaba and its Qwen AI lab, generated 28.8 million exchanges through 25,000 fraudulent accounts. That is roughly twice the scale of anything Anthropic had previously documented. Anthropic said the attack was designed specifically to accelerate China's ability to replicate capabilities in its Mythos Preview model, the company's most advanced and restricted system. Alibaba did not respond to requests for comment.

## What Is the Connection to US Government Restrictions on Anthropic Models?

The timing of these revelations intersects directly with US government policy. On June 12, 2026, two days after Anthropic sent its letter to Congress, the Commerce Department imposed restrictions on Anthropic's Mythos and Fable AI models, prohibiting their global deployment out of concern that military intelligence users in China and other countries of concern could access them. Those restrictions forced Anthropic to disable access to both models globally. The Commerce Department has simultaneously held off on placing DeepSeek on a trade blacklist despite an interagency recommendation that it poses a national security risk. Alibaba was added to the Pentagon's list of Chinese military companies in June 2026, a designation it is actively challenging.

## What Is Anthropic Asking the US Government to Do?

Anthropic's letter called for greater threat intelligence sharing between the government and private sector AI companies, along with tighter enforcement and defensive frameworks to prevent systematic extraction of intellectual property from American AI research firms. The company framed the distillation attacks as growing in intensity and sophistication and argued that addressing them requires coordinated action across industry, policymakers, and the global AI community. The practical challenge is significant: Anthropic cannot verify the identity of every user creating an account, and fraudulent account creation at scale is difficult to detect in real time, particularly when the attacker is distributing query load across tens of thousands of separate accounts.

## What Does This Mean for the AI Industry More Broadly?

The Alibaba disclosure confirms what security researchers have been saying for several years: the most valuable intellectual property in advanced AI is not just the model weights but the model's behavior across a vast range of inputs. That behavioral signature, accumulated over millions of carefully constructed interactions, can be used to train a competitor's model in ways that would otherwise require years of research and hundreds of millions of dollars in compute. Every major AI laboratory with publicly accessible models faces this same exposure. The Alibaba operation, if the scale reported by Anthropic is accurate, represents a systematic industrial espionage effort conducted through the front door of a consumer product. That reality will force the industry to think much more carefully about the line between access and extraction.

Check out what else is trending at [Product Hunt](https://www.cosmictesla.com/#ph-trending)
