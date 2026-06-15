Apple Foundation Models Now Run Claude and Gemini Through One Swift API
June 15 2026

At WWDC 2026 Apple turned its Foundation Models framework into a hybrid AI platform, adding a LanguageModel protocol that lets a single Swift app route prompts to Apple's on device model, Anthropic's Claude, or Google's Gemini without rewriting session code. Apple also added multimodal image input, shipped a Python SDK, and confirmed it intends to open source the framework later in summer 2026, a notable move for a company that usually keeps its frameworks closed.

## What actually changed in 2026?

Foundation Models launched in 2025 as an on device only framework. It gave developers direct access to Apple's roughly three billion parameter model with no API key, no network round trip, and no per token cost, with privacy and offline capability as the selling points. The 2026 update is broader. Developers can now pass images alongside text so the model can reason about visual content, with Vision framework tools like text recognition and barcode reading available for the model to call directly on the device. A new Dynamic Profiles system lets apps swap models, tools, and instructions inside a single continuous session, which is the foundation for multi agent workflows.

The headline addition is server model support. Through the new LanguageModel protocol, third party providers such as Anthropic and Google expose their cloud models through the same Swift interface as Apple's on device model. Developers install a Swift Package Manager dependency for a given provider, and the session logic, tool calls, and context handling stay unchanged. Apple also made Private Cloud Compute free for developers in the App Store Small Business Program with fewer than two million first time downloads. The framework does not work in the EU on iPhone or iPad, nor in mainland China, at launch.

## Why does provider swapping matter?

Because it removes a real architectural cost that has shaped how AI apps get built. Before this, choosing a model meant committing to its SDK, its session model, and its quirks, and switching later meant a rewrite. With the unified protocol, a developer can run the free on device model for fast offline tasks like summarization, classification, and extraction, then fall back to Claude or Gemini for deep reasoning or long context work, all behind one API surface. That flexibility may end up mattering more than any single model upgrade.

The strategic read is that Apple is positioning itself as the front door for AI on its platforms. It is not trying to win the frontier model race outright. It is trying to own the integration layer where the routing decision happens, so that whether you use Apple's model or a competitor's, you do it through Apple's framework. That is a quietly powerful place to sit.

## What is the catch for developers?

The on device model has a real capability ceiling. For summarization and structured generation it is plenty, but for broad world knowledge or very long context the right call is still routing to a cloud model, which means data leaves Apple's privacy boundary and you start paying for tokens again. You are also tying your app to Apple's protocol and its launch restrictions, which currently exclude two of the largest markets in the world. The upside is genuine, but the free, private, offline pitch only holds for the slice of work the small model can actually handle.

Check out what else is trending at [GitHub Trending](https://www.cosmictesla.com/#github-trending)
