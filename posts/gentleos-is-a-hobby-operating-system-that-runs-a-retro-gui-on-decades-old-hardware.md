GentleOS Is a Hobby Operating System That Runs a Retro GUI on Decades Old Hardware
June 09 2026

GentleOS is an open source hobby operating system that brings a graphical desktop to vintage PCs, and it climbed to the top of Hacker News this week. The 32 bit version, GentleOS/32, runs on an i386 processor with just 4MB of RAM and a basic VGA display, while a 16 bit sibling called GentleOS/16 reaches all the way back to the 80186 chip and needs under 192KB of RAM. Built by a developer who goes by luke8086, it is a deliberate love letter to the computers most people threw away decades ago.

## What is GentleOS and what hardware does it run on?

GentleOS is two related projects rather than one. GentleOS/32 targets i386 and newer machines, asking for 4MB of RAM and a VGA display capable of 640x480 in 16 colors. GentleOS/16 is the leaner sibling, a pure 16 bit system that runs on hardware as old as the 80186 with less than 192KB of RAM and a CGA display. Both are licensed under GPLv2 and ship as open source.

By design the system is stripped to the bone. It is monolithic, meaning a single binary and a single thread, mostly configured when you compile it rather than at runtime. It speaks only to standard PC parts of the era, things like VGA and SVGA graphics, a keyboard, a PS/2 or serial mouse, and the PC speaker. There is no sprawling driver ecosystem here, and that is entirely the point.

## Why are developers excited about a retro OS in 2026?

Because it is a clean, readable, finishable piece of work in a world of bloated software. Modern operating systems are millions of lines of code that no single person can hold in their head. GentleOS is small enough to actually understand, which makes it a tinkering platform and a teaching tool as much as a usable desktop. The comments on Hacker News read like people relieved to see something built for joy rather than scale.

There is also a thriving retro computing and permacomputing scene that treats old hardware as worth preserving and programming for. A graphical operating system that boots on a thirty year old industrial board or a vintage laptop scratches a very specific itch. It proves that capable software does not require modern silicon, just discipline and good taste in scope.

## What can you actually do with it?

You run small graphical apps on bare metal, which is the whole pitch. GentleOS exists so you can boot a real machine, or an emulator, and poke at a working graphical environment without dragging in the weight of a full modern stack. The developer has said the only future plans are bug fixes, optimizations, and adding more apps, which is refreshingly honest about its scope.

For most people this is not a daily driver, and it is not trying to be. It is a reminder that the foundations of computing are knowable, that one person can still build a complete graphical operating system, and that there is real value in software you can read end to end. In an industry obsessed with the next giant model, a tidy little OS for ancient PCs is a quietly radical thing to ship.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
