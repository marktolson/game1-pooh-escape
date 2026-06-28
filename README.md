# 💩 POO ESCAPE

A 2D browser game built with [Three.js](https://threejs.org/). You are a poo that just got
pooped into the sewer. Navigate the dark maze of pipes and escape to the **ocean** — while
dodging traps along the way.

## How to play

1. Start a local web server in this folder (a server is required because the game uses ES modules):

   ```bash
   python3 -m http.server 8123
   ```

2. Open <http://localhost:8123> in your browser.
3. Click **Get Pooped Out** to watch the intro, then you're dropped into the sewer maze.

### Controls

- **WASD** or **Arrow keys** to move.
- You can only see what's near you (fog of war), so explore carefully.

### The world

| Thing | Effect |
| --- | --- |
| 💩 Poo (you) | The hero. Reach the ocean to win. |
| 🧻 Toilet paper | Tangles you — you slow to a crawl and take damage until you struggle free. |
| 🟢 Green pump | Speed boost for a few seconds. |
| 🔴 Red pump | Slows you down for a few seconds. |
| ⚙️ Fan blades | Spinning blades that chop you up — stay away. |
| 🟣 Sewer critters | Wander the pipes and chase you on sight. |
| 🌊 Ocean | The exit. Touch it and you're free! |

Lose all your health and you get flushed — game over.

## Deploy to Vercel

This is a static site with **no build step**, so Vercel deploys it as-is.

**Option A — Vercel CLI**

```bash
npm i -g vercel   # if you don't have it
vercel            # first run links/creates the project
vercel --prod     # deploy to production
```

**Option B — GitHub + Vercel dashboard**

1. Create a repo on GitHub and push:

   ```bash
   git remote add origin https://github.com/<you>/poo-escape.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework Preset: **Other** · Build Command: *(leave empty)* · Output Directory: *(leave empty / root)*.
4. Click **Deploy**.

## Project structure

```
index.html        Page shell, HUD, overlays, Three.js import map
css/style.css     UI styling + fog-of-war vignette
js/main.js        Boot, input, scene/mode management, game loop
js/intro.js       Side-view intro animation (butt → poo → toilet)
js/maze.js        Recursive-backtracker maze generator
js/game.js        Maze gameplay: walls, player, hazards, win/lose
js/poo.js         Reusable top-down poo character
```

No build step and no dependencies to install — Three.js is loaded from a CDN via an import map.
