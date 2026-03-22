# Claude Context

This is a personal scratch monorepo for prototypes and app ideas.

## Repo layout

- `web/` — web apps (React, Next.js, Vite, plain HTML/JS, etc.)
- `mobile/` — mobile apps (Expo/React Native preferred)
- `automations/` — scripts, bots, cron jobs, n8n-style workflows, CLI tools
- `shared/` — reusable utilities, types, or components shared across projects

## Stack preferences

- **Web:** React + TypeScript, Tailwind CSS, Vite or Next.js
- **Mobile:** Expo (React Native)
- **Automations:** Python or Node.js scripts; use Claude API where AI is needed
- **AI:** Claude API via `@anthropic-ai/sdk` (TS) or `anthropic` (Python)

## Per-project setup

Each project is self-contained in its subdirectory with its own `package.json` / `pyproject.toml`. Do not add a root-level package manager workspace unless explicitly asked.

## Web deployment (GitHub Pages)

All `web/` projects are automatically built and deployed to GitHub Pages on every push to `main` that touches `web/`.

- **Live index:** `https://m0oz.github.io/Scratch/`
- **Per-project URL:** `https://m0oz.github.io/Scratch/<project-name>/`

### How it works

- `.github/workflows/deploy-web.yml` runs on push to `main`
- For each `web/<name>/` that has a `package.json`: runs `npm install` then `npm run build` with `VITE_BASE=/<repo>/<name>/` injected so asset paths resolve correctly
- For plain `index.html` folders (no `package.json`): copied as-is
- Directories starting with `_` (e.g. `_template`) are skipped
- A minimal index page listing all projects is generated at the root

### Creating a new web prototype

1. Copy `web/_template/` to `web/<name>/`
2. Update the `name` field in `package.json`
3. Commit and push to `main` — GitHub Actions handles the rest (~2 min to go live)

### One-time GitHub setup (first time only)

Go to **Settings → Pages → Source** and select **GitHub Actions**.

### Local dev

```sh
cd web/<name>
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build into dist/
```

## General guidelines

- Keep prototypes small and focused — validate the idea first
- Prefer simplicity over abstraction for early-stage code
- Add a short `README.md` inside each project explaining what it does and how to run it
