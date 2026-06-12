Homebrew 6.0.0 Locks Down Third Party Taps With a New Trust System
June 12 2026

Homebrew 6.0.0, released on June 11 2026, introduces tap trust, a security mechanism that forces users to explicitly approve any third party tap before its code can run on their machine. It is the headline feature in the largest version jump the macOS and Linux package manager has made since version 5, and it directly targets one of the oldest soft spots in the tool's design.

Homebrew has been a fixture of developer machines since Max Howell first released it in 2009, and it now installs software for millions of users. That reach is exactly why supply chain security matters here. A compromised tap can run code on a huge number of machines at once, and version 6 is built to shrink that risk.

## What is tap trust and why does it matter?

A tap is a third party repository of install recipes, and the problem is that a tap can contain arbitrary Ruby code that runs unsandboxed on your computer. Until now, adding one meant trusting whoever maintained it, often without realizing it. Tap trust changes the default. Homebrew now requires taps, and the formulae and casks inside them, to be explicitly trusted before their code is evaluated or executed. The official Homebrew taps stay trusted out of the box, untrusted taps get flagged before anything runs, and Homebrew stops automatically adding taps you did not approve. For anyone who installs tools from outside the core repositories, this is a meaningful tightening of the threat model.

The change does add friction. Power users who pull from many community taps will see prompts they did not see before, and some scripts and CI setups will need updating to declare trust explicitly. That is the tradeoff. Homebrew is betting that a few extra confirmations are worth closing a path that malware authors have every reason to target.

## What else changed in Homebrew 6.0.0?

Beyond tap trust, version 6 ships a faster and smaller default internal JSON API, real sandboxing on Linux, a batch of brew bundle improvements, and a set of better defaults informed by the project's user survey. There are broad performance gains throughout, and the release adds initial support for macOS 27, code named Golden Gate. Taken together it is less a single feature and more a hardening pass across the whole tool, which is what you want from a major version bump in software this widely deployed.

## What does this mean for Intel Macs?

This is where longtime users need to pay attention. macOS 27 drops Intel support, and Homebrew is following the platform down the same path. Starting in September 2026, Intel x86_64 moves to a lower support tier, which means no continuous integration coverage and no new prebuilt binary packages, known as bottles. By September 2027, Homebrew will not run on Intel Macs at all, and the related code gets deleted. If you are still on an Intel machine, version 6 is a clear signal that your runway is measured in months, not years.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
