# Asita's Game

A rendition of Kim's game: a memory game you can play in the browser on phones, tablets, laptops and desktop computers.

You study a tray of objects, the tray is covered, and then you're tested on what you saw.

## How to play

- **What's missing?** The tray comes back with some objects taken away (1–3 on Easy, Medium and Hard, as many as you choose in Custom). Pick the missing ones.
- **Recall the tray:** Pick every object that was on the tray from a larger mix.
- **Difficulty:** Easy has 8 objects and 20 seconds to study, Medium has 12 and 25 seconds, Hard has 16 and 30 seconds. You can play 3, 5 or 10 rounds.
- **Custom:** choose the number of rounds (1–30), how many objects you have to guess and the study time (5–120 seconds). In "What's missing?" you also choose the size of the tray, up to 30 objects, and the objects to guess are the ones taken away. In "Recall" the objects to guess are the whole tray. If you ask for more rounds than the chosen objects allow without repeats, the setup screen tells you the most you can play.
- **Objects:** pictures (emoji), coloured shapes, numbers, letters and playing cards. You choose which kinds to include. Each round mixes the kinds you chose, and no object appears on the tray twice in the same game.
- **Scoring:** each correct pick earns 1 point and each wrong pick loses 1. A round never goes below zero. After every round a scorecard shows what you answered correctly, what you answered incorrectly and what you missed. At the end of the game you see a round-by-round table, your accuracy and your best score.

## Devices

- The layout adapts to screen size, from small phones (iPhone SE) to large desktop screens, in portrait or landscape.
- Buttons and tiles are large enough to tap easily, and the action buttons stay in view at the bottom of the screen.
- The page respects iPhone notches and safe areas, and supports light and dark mode.
- It can be added to the home screen and opens full screen like an app.
- The study timer pauses if you switch away from the page.

## Running locally

The site is plain HTML, CSS and JavaScript with no build step. Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
```

## Deploying

Import the repository into Vercel. No framework or build settings are needed: Vercel serves the files as a static site. Every push to `main` deploys to production, and every pull request gets a preview link.
