<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/mark.svg">
    <img src="docs/images/mark-light.svg" width="76" alt="MaximAnim logo">
  </picture>

  <h1>MaximAnim</h1>

  <p><strong>An anime library for everything between episodes.</strong></p>

  <p>
    <a href="https://maximanim-portfolio.vercel.app"><strong>Live demo</strong></a>
    &nbsp;·&nbsp;
    <a href="#screenshots">Screenshots</a>
    &nbsp;·&nbsp;
    <a href="#under-the-hood">Under the hood</a>
    &nbsp;·&nbsp;
    <a href="#run-it-locally">Run locally</a>
  </p>
</div>

![MaximAnim on three iPhone screens: home, an anime page and playback](docs/images/hero.webp)

## About the project

I built MaximAnim to put the things I kept doing around anime into one interface: discovering shows, exploring a season, remembering what I'd watched, and getting back to the next episode.

It started as a personal project and became a responsive web app designed around the way I use my phone. The interface keeps episode progress close to the artwork and metadata, without turning the library into a spreadsheet.

This repository is the public edition of MaximAnim, a demo of the discovery, library and tracking app. **MaximAnim is not a public service for streaming anime episodes**: the watch screen plays one of my own videos to show how the player and your progress behave. [More below.](#about-this-public-edition)

**[Open the live demo →](https://maximanim-portfolio.vercel.app)**

## Screenshots

<p align="center">
  <img src="docs/images/home.webp" width="250" alt="Home: the Continue card and upcoming releases">
  <img src="docs/images/search.webp" width="250" alt="Search: trending anime and filters">
  <img src="docs/images/anime.webp" width="250" alt="An anime page with its seasons and episodes">
</p>
<p align="center">
  <img src="docs/images/player.webp" width="250" alt="The watch screen: a demo video, episode navigation and credits">
  <img src="docs/images/library.webp" width="250" alt="Lists and the automatic tracking views">
</p>

- **Home.** Pick up where you left off and see what is coming next.
- **Search.** Search by title, browse the catalogue and open related works.
- **Anime.** Move through seasons, episodes, studios and credits.
- **Player.** Preview the watch screen: a demo video, episode navigation and the credits of the episode.
- **Library.** Keep lists and watched episodes in your own browser.

**Desktop, too.** The same catalogue and library adapt to a wider layout with a separate navigation rail.

![MaximAnim desktop layout](docs/images/desktop.webp)

*Every screen is a capture of the running public build, in English, not a redesigned mock screen. They were taken at 393 × 852 CSS pixels and placed unchanged in stylized phone frames; the player is shown before playback.*

## What it does

- **Discover anime.** Search AniList's catalogue, browse seasonal releases and follow related works, people and studios.
- **Follow episodes.** Track watched episodes and resume position. Upcoming releases appear in the calendar.
- **Keep a library.** Organise your titles and progress locally, even without signing in.
- **Use it on different screen sizes.** The responsive interface works in a browser and can be installed as a PWA. Catalogue requests still require a connection.

## About this public edition

Search, anime pages, lists, progress and the calendar all work for real. What this edition leaves out is the one thing MaximAnim is not: **it is not a public service for streaming anime episodes**, and it offers none.

The watch screen is there to show how the player, the episode navigation and progress saving behave. It plays one of three of my own travel videos, through YouTube's official embedded player, in place of the episode, and says so under the video in the language you chose. Each new viewing picks one of them at random. Reloading, coming back with the browser's Back button or resuming from **Continue** keeps the video you were watching and your position. If YouTube refuses an embed, the page tries the other two once, then offers a retry. Embedding restrictions still apply.

The personal edition is developed separately. Private playback providers, extension code, account integrations and relay endpoints are **not present** in this public repository or its build.

## Under the hood

- **App:** Next.js 16, React 19, strict TypeScript
- **UI:** Tailwind CSS 4, Lucide, responsive layouts
- **Catalogue:** AniList GraphQL, validated with Zod, cached with TanStack Query
- **Local data:** Dexie / IndexedDB
- **Demo playback:** YouTube IFrame Player API
- **PWA:** Serwist
- **Validation:** Vitest, targeted Playwright tests, an audit of the public build

Three decisions shaped the project:

**Local-first tracking.** Lists and watched episodes live in IndexedDB. Reading your library doesn't depend on logging in or on a server being available.

**Navigation continuity.** AniList responses are cached by identity, and previously presented artwork is handled differently from images appearing for the first time. Returning to a season or anime page shouldn't feel like starting it over.

**Separate public and personal builds.** This edition is exported with an independent Git history and a restricted set of source files and API routes. Removing the private integrations from the build matters more than hiding their buttons.

## Run it locally

You'll need **Node.js 20.9 or newer** (the Docker image runs Node 24) and npm. No account, environment file or API keys are required.

```bash
git clone https://github.com/LeBoogiepop/maximanim-portfolio.git
cd maximanim-portfolio
npm ci
npm run dev
```

Then open **http://localhost:3000**.

To check and run a production build:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run audit:public -- --build
npm start
```

The repository also includes a standalone Dockerfile. The public build serves health/version API routes only; it doesn't require the personal application's server.

## Notes

This edition stores its lists and progress in your browser; clearing site data will erase that local copy. AniList data and third-party artwork remain subject to their original rights and availability.

iOS standalone viewport behavior is still being checked on physical devices; browser emulation cannot verify it.

Source code and the MaximAnim identity are currently **all rights reserved**. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md) for the applicable terms and credits.

---

<p align="center"><sub>Designed and developed by Maxime.</sub></p>
