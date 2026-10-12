# Asita's Games

A small games platform with memory, word and puzzle games you can play in the browser on phones, tablets, laptops and desktop computers.

| Page | URL | What it is |
|---|---|---|
| Home | `/` | Choose a game. Shows your best score and times saved on this device. |
| Asita's Game | `/game` | A rendition of Kim's game. Study a tray of objects, then spot what was taken away or pick out everything you saw. Easy, Medium, Hard or a Custom game. |
| Asita's Match | `/match` | A card matching game against the clock. Boards from 4 × 4 to 8 × 8, or any custom size. |
| Asita's Word | `/word` | Guess the hidden five-letter word in six tries. Coloured tiles show which letters are in the word and which are in the right place. A daily word that's the same for everyone, unlimited practice, hard mode, statistics and a shareable result. |
| Asita's Blocks | `/blocks` | A falling block puzzle. Slide and turn the falling pieces to fill whole rows, which then clear. The pieces fall faster at each level. Hold a piece for later, see the next three, and score extra for clearing four rows, combos and T-spins. Plays with the keyboard, on-screen buttons or by touching the board. |

Each game has a bar at the top that links back to the home page and across to the other games. The whole site installs as one app ("Asita's Games") when added to a home screen.

## How it's built

- The project is a Next.js app, so Vercel builds and deploys it as before.
- The home page and the games are plain HTML, CSS and JavaScript in `public/`:
  - `public/hub/`: the home page
  - `public/game/`: Asita's Game
  - `public/match/`: Asita's Match
  - `public/blocks/`: Asita's Blocks
  - `public/word/`: Asita's Word. Its word lists (`words.js`) come from [SCOWL](https://github.com/en-wl/wordlist) via the MIT-licensed `wordlist-english` package.
  - `public/shared/`: shared by all the pages: the 3D icons and scenes (`lobby3d.js`, `lobby3d.css`), the navigation bar (`platform.css`) and the app icon
- `next.config.ts` rewrites `/`, `/game`, `/match`, `/word` and `/blocks` to those pages. Each page sets `<base href>` to its folder, so its own files load with relative links.
- Next.js itself renders only `src/app/manifest.ts` (the manifest for the whole site) and the 404 page.
- The games save settings and best scores in the browser's local storage (`kims-*`, `match-*`, `word-*` and `blocks-*` keys). Nothing is sent to a server.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```
