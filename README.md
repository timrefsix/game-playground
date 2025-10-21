# Game Playground

A multi-app sandbox for experimenting with tiny games and micro front-ends. Each app lives in its own folder and is published to GitHub Pages under the same path (for example, `/app-1/`).

## Live Site
- https://timrefsix.github.io/game-playground/

## Projects
- `/game` — HTML5 canvas catch-the-orb toy.
- `/app-1` — React counter demo scaffolded with Vite.
- `/app-2` — React color cycler also built with Vite.

Add new apps by dropping any static site (React, Hugo, plain HTML, etc.) into a sibling folder and updating the deploy workflow if it needs a custom build.

## Development
```bash
# Install dependencies for a specific app
npm install --prefix app-1
npm install --prefix app-2

# Run a dev server
npm run dev --prefix app-1
```

## Deployment
Pushing to `main` triggers `.github/workflows/pages.yml`, which builds each app and publishes the combined output to GitHub Pages.
