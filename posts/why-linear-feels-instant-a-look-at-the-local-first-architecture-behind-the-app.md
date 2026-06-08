Why Linear Feels Instant: A Look at the Local First Architecture Behind the App
June 08 2026

Linear feels instant because it stores your data inside the browser and applies your changes locally first, so the interface never waits on the network to respond. A widely shared technical breakdown this week traces that speed to a local first sync engine, an in browser database, and a service worker that precaches the entire app before you have even finished logging in.

## What makes Linear so fast?

The core trick is that Linear treats the server as a sync target rather than the source of truth. The database lives in the browser using IndexedDB, and your edits apply locally and reconcile in the background. These optimistic updates mean the interface reflects a change immediately, with no loading spinners for local actions.

The rendering layer is just as deliberate. Linear uses MobX observables so that updating 50 issues triggers 50 tiny cell updates rather than redrawing an entire list. The input model is keyboard first, built around a command palette backed by in memory data, and animations run on the GPU at durations under 100 milliseconds so nothing ever feels like it stutters.

## How does the sync engine work?

Linear cofounder Tuomas Artman wrote the sync engine as the first lines of code for the company, which is the reverse of how most startups begin. The app holds a live WebSocket connection to that engine and broadcasts only deltas, the small changes, to other clients. If you go offline, the client can later ask for every update since a given point and replay them against the local database to catch up.

A service worker quietly precaches around 1,200 hashed assets after your first page load, covering route chunks, icons, and fonts. Within seconds of hitting the login screen, the full app is cached, so later navigation skips the network entirely. The underlying stack is notably simple: React, TypeScript, MobX, and PostgreSQL.

## Why does this matter beyond Linear?

Linear is becoming the reference example for local first web apps, and its results challenge a common assumption. A client side rendered app, done this way, can feel faster than a server rendered one while carrying less framework complexity. The same design also makes the app usable offline, since the data already lives on your machine.

The tradeoffs are real. A custom sync engine is hard to build, and conflict resolution across clients is genuinely tricky. But for teams chasing software that feels native in a browser tab, Linear offers a concrete blueprint rather than a vague aspiration.

Check out what else is trending at [Hacker News Trending](https://www.cosmictesla.com/#hn-trending)
