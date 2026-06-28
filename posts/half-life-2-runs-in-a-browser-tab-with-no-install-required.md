Half Life 2 Runs In A Browser Tab With No Install Required
June 28 2026

Half Life 2 became fully playable inside a standard web browser on June 24 2026, with no download, no Steam copy, and no install of any kind. The project came from a developer who goes by slqnt, a high school student, working with a collaborator known as 98006. You open the page at hl2.slqnt.dev and you are dropped straight into City 17. Built in roughly three months, it is the most ambitious port of Valve's Source Engine to the open web that anyone has shipped.

## How did a high schooler get Half Life 2 into a browser?

The trick is a chain of open web technologies stacked on top of community work. The port runs on Emscripten, a compiler that converts C and C++ code into WebAssembly so it can execute in a browser. slqnt started from a modified Source Engine maintained by a developer named nillerusr, which includes a rendering path called ToGLES. That path lets the engine speak OpenGL ES, the graphics interface normally used for Android, and Emscripten translates those calls into WebGL2 inside the browser. A friend had shown slqnt an earlier Portal web port by a developer called weliveinhell, and that project gave the whole effort a working base to build from.

None of this would have been possible from scratch in a few months. The foundation traces back to a 2020 leak of the Team Fortress 2 Source Engine code, patiently patched up by the modding community over years. slqnt layered the Half Life 2 assets and map data on top of that base, which is the part that turns a tech demo into the actual game.

## What works and what is broken in the browser port?

The full campaign is playable from start to credits, and on a desktop it runs well above 60 frames per second in Chrome. slqnt confirmed reaching the end of the game inside the browser. It is not flawless, though. The famous facial animation system, one of Half Life 2's showpiece features in 2004, caused so much instability that it had to be disabled entirely, so the enigmatic figure known as the G Man delivers his opening monologue with a frozen face. Crouch was rebound from Ctrl to the C key, because Ctrl fires browser shortcuts that wreck the experience.

The dev log reads like a tour of every gremlin you would expect. Saving and loading had to be wired into the browser file system, batteries and medkits did not work at first, the gravity gun that Alyx hands you failed to register in the inventory, and some maps loaded with random color glitches. On mobile the experience falls apart without a physical keyboard, since touch controls are essentially absent. slqnt has signaled that Episode One and Episode Two are next on the list after a break.

## Why does this land in a legal grey area?

Because it leans on leaked engine code and serves Valve's copyrighted assets directly. The 2020 Source Engine leak it builds on carries a strict non commercial caveat, and the browser build bundles the game data itself rather than asking players to supply their own files. That second part is the real exposure, since it gives the rights holder an easy reason to file a takedown. A comparable GTA Vice City browser demo was hit with a DMCA request from Take Two and had to be reworked so that users provide the game data themselves before playing.

Valve has historically been generous with its modding community, so this could survive quietly or vanish overnight depending entirely on how the company feels about a free copy of one of its games running in any browser tab on Earth. Either way, the achievement is a marker for where browser gaming has arrived, in the same lineage as the Doom and Quake ports that came before it.

Half Life 2 remains one of the most influential shooters ever made, and dropping back into City 17 is worth it whether you do it in a browser tab or the full release on Steam.
https://www.amazon.com/s?k=Half+Life+2&tag=cosmictesla-20
