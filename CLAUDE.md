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

## General guidelines

- Keep prototypes small and focused — validate the idea first
- Prefer simplicity over abstraction for early-stage code
- Add a short `README.md` inside each project explaining what it does and how to run it
