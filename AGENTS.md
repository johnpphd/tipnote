# AGENTS.md

Project instructions for AI coding agents. Agent-agnostic -- works with Claude Code, Cursor, Windsurf, Copilot, etc.

## Project Overview

Tipnote is a Notion-like document editor. Features include rich text editing with slash commands, databases with multiple views, page sharing, workspace management, and AI chat.

## Verification Commands

Run after every code change:

```sh
yarn typecheck && yarn lint && yarn prettier
```

Full build (includes functions):

```sh
yarn build
```

Functions only:

```sh
cd functions && yarn build
```

## Architecture

- **Frontend**: React 19 + MUI 7 + TanStack Router (file-based routes in `src/routes/`)
- **Editor**: TipTap 2 with slash commands, tables, code blocks, task lists, images
- **State**: Jotai atoms in `src/atoms/`
- **Data**: Firebase Firestore via service layer in `src/lib/database/`, wrapped by hooks in `src/hooks/` with React Query caching
- **Firebase SDK**: Initialized in `src/lib/firebase/` -- components import from here, never from `firebase/*` directly
- **Backend**: Firebase Cloud Functions in `functions/src/` -- CopilotKit chat API + MCP server
- **Theme**: Notion-inspired MUI theme in `src/theme/notionTheme.ts`

## Conventions

- All Firestore CRUD lives in `src/lib/database/`, not in components
- Hooks in `src/hooks/` wrap lib calls with React Query caching
- Path alias: `@/` resolves to `src/`
- Route files in `src/routes/` use TanStack Router file-based routing
- `functions/` is a separate yarn workspace with its own tsconfig
- Custom ESLint plugins:
  - `branded-types` -- enforces branded type safety
  - `theme-guardrails` -- enforces style consistency with the MUI theme

## Don't

- Start the dev server -- it's already running on port 5180
- Put Firebase credentials in code -- they come from environment variables
- Import from `firebase/*` directly in components -- use `src/lib/firebase/`
- Add raw color values or hardcoded styles -- use the theme
