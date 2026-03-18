# TipNote

A Notion-like document editor you can self-host. Write pages, build databases, share with teammates -- all on your own Firebase project.

## What Can It Do?

- Write and organize pages in a tree (like Notion)
- Rich text editing -- headings, lists, code blocks, tables, images, slash commands
- Drag-and-drop page reordering
- Inline databases with table, board, calendar, gallery, and list views
- Sort, filter, and group database rows
- Emoji icons and cover images on any page
- Share pages with specific people (viewer or editor access)
- Publish pages as public links anyone can view
- Built-in AI chat (powered by Claude) with an MCP server
- Sign in with Google or email/password

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Material UI 7, TanStack Router |
| Editor | TipTap 2 (ProseMirror-based) |
| State | Jotai atoms, React Query |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions |
| AI | CopilotKit + Anthropic Claude |
| Build | Vite 6, TypeScript 5.7 |

---

## Getting Started (Step by Step)

### What You Need First

1. **Node.js 22 or newer** -- check with `node -v`. If you need to install it, grab it from [nodejs.org](https://nodejs.org) or use [nvm](https://github.com/nvm-sh/nvm).
2. **Yarn** -- check with `yarn -v`. Install with `npm install -g yarn` if you don't have it.
3. **Firebase CLI** -- install with `npm install -g firebase-tools`.
4. **A Firebase project** -- the free Spark plan works fine for development.

### Step 1: Create a Firebase Project

Go to [console.firebase.google.com](https://console.firebase.google.com/) and click "Add project". Then turn on these four things:

1. **Authentication** -- click Build > Authentication > Get started. Enable the **Email/Password** provider and the **Google** provider.
2. **Firestore** -- click Build > Firestore Database > Create database. Pick "Start in test mode" for now (we'll deploy proper rules in Step 5).
3. **Storage** -- click Build > Storage > Get started. This stores uploaded images.
4. **Register a Web App** -- click the gear icon > Project settings > "Add app" > Web (the `</>` icon). Copy the config values it shows you -- you'll need them in the next step.

### Step 2: Clone the Repo

```bash
git clone https://github.com/johnpphd/tipnote.git
cd tipnote
```

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` in your editor and paste in the values from Step 1. It looks like this:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

You can find all of these in Firebase Console > Project Settings > Your Apps > Web App.

### Step 4: Install Dependencies

```bash
yarn install
cd functions && yarn install && cd ..
```

This installs packages for both the frontend and the Cloud Functions backend.

### Step 5: Connect Firebase and Deploy Rules

```bash
firebase login
firebase use --add your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

The first command opens a browser to sign in. The second links this folder to your Firebase project. The third deploys the security rules so your database is protected.

### Step 6: Start the App

```bash
yarn dev
```

Open [http://localhost:5180](http://localhost:5180) in your browser. That's it -- you're running TipNote locally.

The Vite dev server automatically proxies API requests to the Firebase emulator, so everything works out of the box.

---

## (Optional) Cloud Functions Setup

The AI chat and MCP server features require Cloud Functions. You can skip this if you just want the editor.

### Local Development (Emulator)

```bash
cd functions && yarn build && cd ..
firebase emulators:start --only functions,firestore,auth,storage
```

Then in another terminal:

```bash
yarn dev
```

### Deploy to Production

Set the required secrets:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set BRAVE_SEARCH_API_KEY
```

Set environment config:

```bash
firebase functions:config:set app.base_url="https://your-project-id.web.app"
```

Deploy:

```bash
firebase deploy --only functions
```

---

## (Optional) Deploy to the Web

```bash
yarn build
firebase deploy --only hosting
```

Your app is now live at `https://your-project-id.web.app`.

To use a custom domain: Firebase Console > Hosting > Add custom domain.

---

## Project Structure

```
tipnote/
  src/
    components/     UI components (editor, sidebar, database views, chat)
    hooks/          React hooks (data fetching with React Query)
    lib/
      firebase/     Firebase SDK setup (auth, firestore, storage)
      database/     All Firestore CRUD operations
      blocks/       Block/content persistence
      chat/         AI chat types and utilities
    routes/         Pages (TanStack Router file-based routing)
    theme/          MUI theme (Notion-inspired palette)
    types/          TypeScript branded types and domain models
    atoms/          Jotai state atoms
  functions/        Cloud Functions (AI chat API + MCP server)
  firestore.rules   Database security rules
```

## Scripts

| Command | What It Does |
|---------|-------------|
| `yarn dev` | Start the dev server on port 5180 |
| `yarn build` | Full production build (types + bundle) |
| `yarn typecheck` | Check TypeScript types without building |
| `yarn lint` | Run ESLint (includes branded-type and theme rules) |
| `yarn prettier` | Check code formatting |
| `yarn prettier:fix` | Auto-fix formatting |

## Environment Variables Reference

### Frontend (`.env` file)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |

### Cloud Functions (set via Firebase CLI)

| Variable | How to Set | Description |
|----------|-----------|-------------|
| `BASE_URL` | `functions:config:set` | Your app's public URL (for OAuth) |
| `ANTHROPIC_API_KEY` | `functions:secrets:set` | Anthropic API key for AI chat |
| `BRAVE_SEARCH_API_KEY` | `functions:secrets:set` | Brave Search key for web search tool |

> `projectId`, `authDomain`, and `storageBucket` are auto-injected by Firebase in deployed functions -- you don't need to set them.

## License

MIT
