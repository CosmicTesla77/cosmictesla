# What Is Local First Software and Why Developers Are Building Apps That Work Without the Internet
2026-05-15

Almost every app you use today stores your data on someone else's server. Your photos live on Apple or Google servers. Your documents live on Microsoft or Google servers. Your messages live on Meta servers. This arrangement is so normal that most people never question it. But a growing movement in software development is questioning it seriously, and the result is a new category of applications called local first software.

Local first means your data lives on your device first, and the cloud is optional. The application works completely without an internet connection. When you are connected, it syncs. When you are not, it keeps working. Your data never disappears because a company shut down their servers or changed their pricing. You own your data in a literal sense because it physically lives on hardware you control.

This sounds obvious when you say it out loud. Why would you design it any other way? The answer is that building local first software is genuinely harder than building cloud first software. Synchronizing data across multiple devices without a central server creates complex technical problems around conflicts, ordering, and consistency. If you edit a document on your laptop while offline and someone else edits the same document on their phone, how does the app decide which version is correct when you reconnect? Solving that problem elegantly is the central engineering challenge of local first design.

A project called Zenith, built by a developer named surprisetalk and currently trending on Hacker News, demonstrates local first principles in a planetarium application. It is a real time interactive star map that runs entirely in your browser with no server calls during use. The developer describes it as local first and fixed viewport, meaning it loads once and then operates entirely from data already on your device. You can take it offline and it keeps working.

The local first movement matters beyond just apps for developers. It represents a philosophical shift about who owns your digital life. In a cloud first world, the company that hosts your data can change their terms, raise their prices, get acquired, or go bankrupt, and your data becomes inaccessible or disappears. In a local first world, your data is yours regardless of what happens to any company.

As internet connectivity becomes assumed and cloud storage becomes commoditized, the designers who figure out how to build software that respects user ownership without sacrificing collaboration will define the next generation of applications.
