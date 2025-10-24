# Game Playground

A multi-app sandbox for experimenting with puzzle mechanics, maze tooling, and other prototypes. Each subdirectory builds independently and is published to GitHub Pages under the same path (for example, `/tetris-puzzle/`).

## Live Site
- https://timrefsix.github.io/game-playground/

## Projects
- `/tetris-puzzle` — Drag-and-drop Tetris pieces to fill a 5×5 grid.
- `/maze-generator` — Visual maze generator supporting several algorithms and export options.
- `/maze-compiler` — Experimental IDE that compiles MazeScript into MASM-inspired bytecode.
- `/chord-playground` — Browser-based chord progression generator powered by Tone.js for real-time audio playback.

To add more apps, drop any static site (React, Hugo, plain HTML, etc.) into a sibling directory and update the deploy workflow if a custom build is required.

## Development
```bash
# Install dependencies for a specific app
npm install --prefix tetris-puzzle
npm install --prefix maze-generator
npm install --prefix maze-compiler
npm install --prefix chord-playground

# Run a dev server
npm run dev --prefix maze-generator
npm run dev --prefix chord-playground
```

## Deployment
Pushing to `main` triggers `.github/workflows/pages.yml`, which builds each app and publishes the combined output to GitHub Pages.
