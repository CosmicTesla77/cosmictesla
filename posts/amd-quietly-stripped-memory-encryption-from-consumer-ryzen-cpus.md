AMD Quietly Stripped Memory Encryption From Consumer Ryzen CPUs
June 18 2026

AMD silently removed Transparent Secure Memory Encryption from consumer Ryzen processors through a firmware update, leaving owners potentially exposed to physical attacks without ever being told the feature was gone. The change rode in with the AGESA 1.2.7.0 firmware, and it reserves the encryption capability for AMD professional grade chips while stripping it from mainstream parts like the Ryzen 7 9700X.

The removal was uncovered by Ben Kilpatrick, a privacy conscious Linux user who was installing a fresh operating system in April 2026 and noticed his Zen 5 chip reported the feature as supported under older firmware and not supported under the newer release. Comparable professional versions of the same silicon kept the feature regardless of firmware or motherboard, which is what turned a quiet firmware note into a story that climbed the technology news charts.

## What does Transparent Secure Memory Encryption actually do?

Transparent Secure Memory Encryption, or TSME, encrypts the entire contents of system memory at the hardware level with no involvement from the operating system. Once the BIOS enables it, it switches on silently and asks nothing of the user, and it defends against a specific class of physical attacks: cold boot exploits, snooping on the memory bus, and pulling a RAM module to read its contents on another machine.

For most desktop users who never let a stranger walk off with their tower, that threat model feels distant, which is part of why the change slipped by unnoticed. For anyone with a laptop, a small business machine, or any device that could be physically stolen, though, full memory encryption is a meaningful last line of defense, and quietly removing it changes the security posture of hardware people already bought.

## Why are users so angry about a silent change?

The anger is less about the feature itself and more about how it vanished. AMD made no announcement, published no advisory, and engineers reportedly went silent when pressed, so customers who specifically chose Ryzen for its security capabilities had a protection taken away without consent or notice. A security feature that disappears in a routine firmware bump is exactly the kind of change people expect to be told about.

There is also a product segmentation angle that rubs people the wrong way. By keeping encryption alive only on professional branded chips, AMD appears to be turning a baseline security feature into a paid upsell, a move that lands badly at a moment when memory level attacks are a real and studied threat. Until AMD explains what happened and why, the most reasonable read is that mainstream buyers quietly lost something they were never told they had.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
