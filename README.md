# Scratch

Personal monorepo for prototypes and app ideas built with Claude.

## Structure

```
scratch/
├── web/          # Web app prototypes (React, Next.js, plain HTML, etc.)
├── mobile/       # Mobile app prototypes (React Native, Expo, Flutter, etc.)
├── automations/  # Scripts, bots, and workflow automations
└── shared/       # Shared utilities, components, or types reused across projects
```

Each project lives in its own subdirectory with its own dependencies and tooling.

## Conventions

- **New project:** create a folder inside the relevant category (`web/my-app`, `mobile/my-app`, `automations/my-script`)
- **Shared code:** anything reused across multiple projects goes in `shared/`
- **No cross-project deps:** projects should not import from sibling projects directly; use `shared/` as the bridge
