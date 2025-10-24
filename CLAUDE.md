# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-app monorepo for game and maze prototypes. Each project is a standalone React + Vite application that builds independently and deploys to GitHub Pages under its own subdirectory path (e.g., `/tetris-puzzle/`, `/maze-generator/`).

**Live Site**: https://timrefsix.github.io/game-playground/

## Project Structure

```
/
├── index.html                 # Landing page linking to all apps
├── .github/workflows/pages.yml # Deployment workflow
├── tetris-puzzle/             # Drag-and-drop Tetris puzzle game
├── maze-generator/            # Visual maze generation with multiple algorithms
└── maze-compiler/             # MazeScript IDE and compiler
```

Each project directory contains:
- Standard Vite + React setup
- `package.json` with scripts (dev, build, lint, preview)
- `vite.config.js` with `base: './'` for relative paths
- `src/` with React components (single `App.jsx` entry point)
- ESLint configuration in `eslint.config.js`

## Development Commands

### Installing Dependencies
```bash
# Install for a specific app
npm install --prefix tetris-puzzle
npm install --prefix maze-generator
npm install --prefix maze-compiler

# Install all apps
npm install --prefix tetris-puzzle && npm install --prefix maze-generator && npm install --prefix maze-compiler
```

### Running Development Server
```bash
# Run dev server for any app
npm run dev --prefix tetris-puzzle
npm run dev --prefix maze-generator
npm run dev --prefix maze-compiler
```

### Building
```bash
# Build a specific app
npm run build --prefix tetris-puzzle

# Build all apps (as done in CI)
npm run build --prefix tetris-puzzle && npm run build --prefix maze-generator && npm run build --prefix maze-compiler
```

### Linting
```bash
# Lint a specific app
npm run lint --prefix tetris-puzzle
npm run lint --prefix maze-generator
npm run lint --prefix maze-compiler
```

### Preview Production Build
```bash
npm run preview --prefix tetris-puzzle
```

## Architecture Notes

### Multi-App Deployment Strategy
- Each app builds to its own `dist/` directory
- GitHub Actions workflow (`.github/workflows/pages.yml`) builds all apps and combines them into a single `site/` directory
- The root `index.html` acts as a landing page with links to each app
- All apps use `base: './'` in Vite config to ensure relative paths work in subdirectories

### Adding a New App
1. Create a new directory at the repository root
2. Set up a Vite + React project (or any static site generator)
3. Add `base: './'` to `vite.config.js` if using Vite
4. Update `.github/workflows/pages.yml` to include build and copy steps for the new app
5. Update `index.html` to add a link to the new app

### Technology Stack
- **React 19.1.1** with React DOM
- **Vite 7.1.7** for build tooling
- **ESLint 9.36.0** with React-specific plugins (react-hooks, react-refresh)
- **lucide-react** for icons (in maze-generator and maze-compiler)
- No shared dependencies between apps (each is fully independent)

### Build Output
- Each app builds to `<app-name>/dist/`
- Deployment combines all builds under `site/<app-name>/`
- Production site structure mirrors repository structure

## Deployment

Deployment is automatic via GitHub Actions when pushing to the `main` branch. The workflow:
1. Runs `npm ci` for each app (using cached dependencies)
2. Builds each app with `npm run build`
3. Combines all builds into a `site/` directory
4. Deploys to GitHub Pages

Manual deployment can be triggered via the "Actions" tab on GitHub.

## Project-Specific Details

### tetris-puzzle
A drag-and-drop puzzle where players arrange Tetris pieces to fill a 5×5 grid. Pure React implementation.

### maze-generator
Visual maze generator supporting multiple procedural generation algorithms with export capabilities. Uses lucide-react for UI icons.

### maze-compiler
Experimental IDE that compiles a custom "MazeScript" language into MASM-inspired bytecode. Uses lucide-react for editor UI.
