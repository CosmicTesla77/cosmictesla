JetBrains Open Sources Mellum 2 a 12B Coding Model for Private Deployment
June 20 2026

JetBrains released Mellum 2, an open weight coding model with 12 billion total parameters, under the permissive Apache 2.0 license on June 1, 2026. The model uses a Mixture of Experts design that activates only about 2.5 billion parameters for each token it processes, which JetBrains says delivers more than twice the inference speed of comparable dense models of the same size.

## What is Mellum 2 built for?

Mellum 2 is deliberately not a frontier chatbot. JetBrains describes it as a focal model, a fast and tightly scoped component meant for the high frequency jobs that show up everywhere in production AI systems, such as routing, retrieval, summarization, and sub agent tasks. It is also built for private deployment, running entirely on a team's own infrastructure, which is precisely where API locked tools cannot follow.

Under the hood, the model was trained from scratch on roughly 10.6 trillion tokens of code and natural language. Its Mixture of Experts layout uses 64 experts and activates 8 of them per token, it carries a context window of 131,072 tokens, and it ships as a family of six variants spanning base, instruct, and thinking configurations. The thinking variant produces explicit reasoning before its answer, aimed at debugging and multi step planning.

## How does it compare to the first Mellum?

The original Mellum arrived in late 2024 as a proprietary 4 billion parameter model that handled code completion inside JetBrains editors, and the company open sourced it in April 2025. Mellum 2 is open from the first day, roughly triples the parameter count, and widens the mandate from a single autocomplete task to an infrastructure brain for multi agent systems.

The benchmarks place it as a capable specialist rather than a giant killer. The thinking variant scores about 69.9 percent on LiveCodeBench version 6, a strong result for its active size, though it trails some smaller dense models on competition math problems. A technical report published alongside the release on arxiv grounds the launch as a research contribution and not only a product.

## Why does an open coding model matter?

The argument is cost and control. In a dense model every token passes through all of the weights, while a Mixture of Experts model routes each token to a fraction of them, so serving Mellum 2 costs far less per token than a dense 12 billion parameter model would. Teams can run it locally, host it themselves, or fine tune it for their own code, all without licensing restrictions.

That combination matters most to organizations that cannot send their source code to a third party API for legal or security reasons. By shipping a production viable model under Apache 2.0, JetBrains raises the floor for open weight developer tooling and gives smaller inference providers a cheap, specialized engine to offer. The frontier labs own the hardest problems, but a great deal of real engineering work does not need a frontier model, and that is the space Mellum 2 is chasing.

Check out what else is trending at [Product Hunt Trending](https://www.cosmictesla.com/#ph-trending)