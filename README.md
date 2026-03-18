# TipNote

A Notion-like collaborative document editor built with React, TipTap, and Firebase.

## Features

- Rich text editing with TipTap (headings, lists, code blocks, tables, images)
- Page hierarchy with drag-and-drop reordering
- Inline databases with views, sorting, and filtering
- Emoji icons and cover images
- Share pages with granular permissions (viewer/editor)
- Publish pages to the web with shareable links
- MCP server for AI integration (Claude, etc.)
- Google Sign-In and email/password auth

## Tech Stack

- **Frontend:** React 19, MUI 7, TanStack Router
- **Editor:** TipTap 2 with extensions
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
- **Build:** Vite 6, TypeScript 5

## Prerequisites

- Node.js 22+
- Yarn
- A Firebase project (free Spark plan works for development)
- Firebase CLI (`npm install -g firebase-tools`)

## Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** (Email/Password and Google Sign-In providers)
3. Enable **Cloud Firestore** (start in test mode, then deploy the included rules)
4. Enable **Cloud Storage** (for cover images and file uploads)
5. Register a **Web App** in Project Settings to get your config values

### 2. Clone and configure

```bash
git clone https://github.com/johnpphd/tipnote.git
cd tipnote
cp .env.example .env
```

Edit `.env` with your Firebase project values (find them in Firebase Console > Project Settings > Your Apps > Web App):

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Connect your Firebase project

```bash
firebase login
firebase use --add your-project-id
```

This creates a `.firebaserc` file (gitignored) linking to your project.

### 4. Install dependencies

```bash
yarn install
cd functions && yarn install && cd ..
```

### 5. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Deploy Cloud Functions

The MCP server and chat API run as Cloud Functions. You need to set environment variables for them:

```bash
# Set the base URL for OAuth callbacks
firebase functions:config:set app.base_url="https://your-project-id.web.app"

# Deploy functions
firebase deploy --only functions
```

Or for local development with the Firebase emulator:

```bash
cd functions && yarn build && cd ..
firebase emulators:start --only functions,firestore,auth,storage
```

### 7. Start the dev server

```bash
yarn dev
```

The app runs at `http://localhost:5180`. The Vite proxy routes `/api/*` and OAuth endpoints to the Firebase emulator automatically.

### 8. (Optional) Deploy to Firebase Hosting

```bash
yarn build
firebase deploy --only hosting
```

Your app will be live at `https://your-project-id.web.app`.

To connect a custom domain, go to Firebase Console > Hosting > Add custom domain.

## Project Structure

```
tipnote/
  src/
    components/     # React components
    hooks/          # Custom React hooks
    lib/
      firebase/     # Firebase client SDK setup (auth, firestore, storage)
      database/     # Firestore CRUD operations
      blocks/       # Block editor operations
      chat/         # Chat/AI integration
    routes/         # TanStack Router pages
    theme/          # MUI theme configuration
    types/          # TypeScript type definitions
    atoms/          # Jotai state atoms
  functions/        # Firebase Cloud Functions (MCP server, chat API)
  firestore.rules   # Firestore security rules
  firestore.indexes.json  # Firestore composite indexes
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Vite dev server (port 5180) |
| `yarn build` | TypeScript compile + Vite production build |
| `yarn typecheck` | Run TypeScript type checking |
| `yarn lint` | Run ESLint |
| `yarn prettier` | Check code formatting |
| `yarn prettier:fix` | Auto-fix formatting |

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | `.env` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `.env` | Firebase project ID (also used by Vite dev proxy) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `.env` | Firebase app ID |
| `BASE_URL` | Functions env | Public URL of the deployed app (for OAuth callbacks) |
| `FIREBASE_API_KEY` | Functions env | Firebase API key (for server-rendered auth page) |
| `FIREBASE_MESSAGING_SENDER_ID` | Functions env | Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Functions env | Firebase app ID |
| `ANTHROPIC_API_KEY` | Functions secret | Anthropic API key (for AI chat) |
| `BRAVE_SEARCH_API_KEY` | Functions secret | Brave Search API key (for web search tool) |

> **Note:** `projectId`, `authDomain`, and `storageBucket` are auto-derived from `FIREBASE_CONFIG` (injected by Firebase in deployed functions). Secrets are set via `firebase functions:secrets:set <NAME>`.

## License

MIT
