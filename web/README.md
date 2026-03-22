# Web Prototypes

Each subdirectory is a self-contained web app prototype.

Prototypes are automatically deployed to **GitHub Pages** on every push to `main`.

**Live index:** `https://<your-username>.github.io/Scratch/`
**Per-project URL:** `https://<your-username>.github.io/Scratch/web/<project-name>/`

---

## One-time setup (do this once from your phone)

1. Open your repo on github.com
2. Go to **Settings → Pages**
3. Under **Source**, choose **GitHub Actions**
4. Save

That's it. The next push to `main` that touches `web/` will trigger a deploy.

---

## Creating a new prototype

Ask Claude:
> "Create a new web prototype called `my-idea`"

Claude will copy `web/_template/` to `web/my-idea/`, adjust the name, commit, and push. GitHub Actions will build and deploy it automatically. The new prototype will appear on the index page within ~2 minutes.

---

## Template

`web/_template/` is the starter for every new prototype:

- **React 19 + TypeScript** via Vite
- `vite.config.ts` — sets `base` path automatically for GitHub Pages deployment
- `npm run dev` — local dev server (if you ever run locally)
- `npm run build` — production build

The `VITE_BASE` env var is injected by CI so asset paths work correctly under the `/Scratch/web/<name>/` subpath. Locally, it defaults to `/` so everything works normally.

---

## Plain HTML prototypes

Drop a folder with an `index.html` directly (no `package.json` needed) and it gets copied as-is.

---

## Stack options

| Use case | Stack |
|---|---|
| Interactive UI | React + TypeScript (default template) |
| Simple page | Plain HTML/CSS/JS |
| Data-heavy | React + fetch/SWR |
| Full-stack | Next.js (set `output: 'export'` in `next.config.ts`) |
