Epic Games Open Sourced Lore a Version Control System Built for Giant Game Files
June 17 2026

Epic Games released Lore, a brand new open source version control system designed from the ground up for the enormous binary files that modern games and entertainment projects produce, and published the full code on GitHub under an MIT license. The announcement landed at State of Unreal 2026, alongside the vision for Unreal Engine 6 and the release of Unreal Engine 5.8. Lore is not a tweak to an existing tool. It is Epic betting that the version control most teams use today was never built for the way games actually get made.

## Why Did Epic Build a New Version Control System When Git Exists?

Git is excellent for text. It is bad at everything game developers actually wrestle with day to day: textures, 3D models, audio, cinematics, and the other multi gigabyte binary assets that no one can sensibly merge line by line. Git LFS exists to paper over this, but most studios skip it entirely and run Perforce, a proprietary system that is powerful when it works and painful enough that teams keep a dedicated tools engineer on staff to babysit it. Epic itself recommends Perforce to third party Unreal developers. So Lore is Epic competing with its own recommendation.

Epic argues that no existing system was built for the full combination of constraints big projects carry at once: arbitrary content types, scale across many dimensions, multi tenant safety, and a fully open specification. Centralized systems handle large binaries but force a server round trip for ordinary operations and lock you into proprietary wire protocols that nobody else can build on. Lore is Epic trying to take the good parts of both worlds and drop the rest.

## What Makes Lore Different From Perforce and Git LFS?

Lore combines a centralized server of record for durability, access control, and conflict resolution with content addressed storage that deduplicates at the fragment level. That fragment level deduplication is the interesting part, because it works just as well on a multi gigabyte binary as on a kilobyte of text, which is exactly the case Git LFS handles poorly. It uses sparse, lazy working copies that only materialize the files you actually need, free branching, and a fully open publicly versioned specification. Everyday operations like staging, committing, branching, and diffing never touch the network.

It is written in Rust, and the whole thing ships under an MIT license, which is a genuinely different posture than the closed, license seat model that has defined this corner of game development for years. There is a catch worth flagging: the desktop client currently ships as a binary only because it leans on some proprietary Epic components, and the roadmap promises to open that up later. Lore is also still pre 1.0, so on disk formats and APIs can shift between releases.

## What Does Lore Mean for Game Developers and Artists?

The honest near term answer is wait and see. Studios do not rip out Perforce on a whim, and game pipelines are notoriously hard to migrate. The realistic first foothold is UEFN, the Unreal Editor for Fortnite, where Lore is already the built in version control system. Epic is working to converge the open source implementation with the UEFN one, including moving UEFN off the Oodle compression format and onto Zstandard so open source clients can talk to it directly.

The longer term ambition is clearly to make versioning a native part of the Unreal Editor, with status highlighting in the viewport and an eventual graphical client, so that artists who never open a terminal can branch and commit without learning a command line. That is the real play. If Epic pulls it off, the moat around Perforce in game development gets a lot shallower, and the fact that the spec is open means competitors and tool makers can build on it instead of around it.

Check out what else is trending at [GitHub Trending](https://www.cosmictesla.com/#github-trending)
