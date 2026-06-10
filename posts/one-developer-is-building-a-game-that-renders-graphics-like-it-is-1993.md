One Developer Is Building a Game That Renders Graphics Like It Is 1993
June 10 2026

A solo developer known as staniks is building a game called Catlantean 3D that draws its world using the same raycasting techniques that powered Wolfenstein 3D and Doom in the early 1990s, and a writeup explaining exactly how it works just climbed near the top of Hacker News with hundreds of points. It is not nostalgia for its own sake. It is a working demonstration that the clever tricks born from old hardware limits still produce striking results today.

## What does it mean to make graphics like it is 1993?

Catlantean 3D is a traditional raycaster. The map is a grid of tiles, some solid walls and some open spaces with a floor and ceiling. To draw a frame, the renderer fires a ray for every vertical column of the screen and walks it across the tile grid using an algorithm called DDA until it strikes a wall. It then draws that single column with the correct slice of texture, and once every wall column is placed, the floors and ceilings are filled in afterward as horizontal scanlines. This is the exact approach that let underpowered computers in 1993 run smooth, fast 3D before dedicated graphics cards existed.

## Why is lighting the secret sauce?

The author argues that lighting is the most overlooked part of the whole technique, and the post makes the case convincingly. Rendered with a flat palette and no shading, the world looks dull and lifeless. The fix is a colormap, a precomputed table that maps each color to darker versions of itself based on distance, the same method Doom used. The cost is tiny, just a handful of lookups per column, yet the payoff is the moody, atmospheric depth that made those old games feel like real places. The sprites, meanwhile, are modeled in Blender and then rendered down to flat textures, a modern shortcut that saves the developer from hand drawing every animation frame.

## Why do developers keep returning to raycasting?

Part of it is pure craft. Building a renderer this way forces you to understand what is actually happening pixel by pixel, knowledge that modern engines hide behind layers of abstraction. Part of it is the romance of constraints, the idea that limits breed creativity in a way that infinite power does not.

There is also something honest about a project like this. The developer mentions working a full time job with limited hours, which is exactly why the efficient old methods appeal. They are cheap to run, satisfying to reason about, and they reward cleverness over brute force. In an era of ray traced, photorealistic blockbusters, watching one person rebuild the magic of 1993 from first principles is a useful reminder that good graphics were never really about the hardware.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
