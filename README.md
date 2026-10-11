# Asita's Games

A small games platform with memory games you can play in the browser on phones, tablets, laptops and desktop computers.

| Page | URL | What it is |
|---|---|---|
| Home | `/` | Choose a game. Shows your best score and times saved on this device. |
| Asita's Game | `/game` | A rendition of Kim's game. Study a tray of objects, then spot what was taken away or pick out everything you saw. Easy, Medium, Hard or a Custom game. |
| Asita's Match | `/match` | A card matching game against the clock. Boards from 4 × 4 to 8 × 8, or any custom size. |
| Kim's Game (original) | `/classic` | The first version of Kim's Game: study a tray, then tap every object that's new. |

Each game has a bar at the top that links back to the home page and across to the other game. The whole site installs as one app ("Asita's Games") when added to a home screen.

## How it's built

- The project is a Next.js app, so Vercel builds and deploys it as before.
- The home page and the two games are plain HTML, CSS and JavaScript in `public/`:
  - `public/hub/`: the home page
  - `public/game/`: Asita's Game
  - `public/match/`: Asita's Match
  - `public/shared/`: shared by all three: the 3D icons and scenes (`lobby3d.js`, `lobby3d.css`), the navigation bar (`platform.css`) and the app icon
- `next.config.ts` rewrites `/`, `/game` and `/match` to those pages. Each page sets `<base href>` to its folder, so its own files load with relative links.
- The original game is the Next.js page in `src/app/classic/`, built with TypeScript and Tailwind CSS. `src/app/manifest.ts` is the manifest for the whole site.
- The games save settings and best scores in the browser's local storage (`kims-*` and `match-*` keys). Nothing is sent to a server.

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
