import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID;
  if (!FIREBASE_PROJECT_ID) {
    throw new Error("VITE_FIREBASE_PROJECT_ID is required. Copy .env.example to .env and fill in your values.");
  }

  return {
  plugins: [TanStackRouterVite({ routesDirectory: "src/routes" }), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          editor: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/core",
            "@tiptap/extension-code-block-lowlight",
            "@tiptap/extension-image",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-task-item",
            "@tiptap/extension-task-list",
            "@tiptap/extension-table",
            "@tiptap/extension-table-cell",
            "@tiptap/extension-table-header",
            "@tiptap/extension-table-row",
            "@tiptap/suggestion",
            "lowlight",
            "prosemirror-model",
            "prosemirror-state",
            "prosemirror-view",
            "prosemirror-transform",
            "prosemirror-commands",
            "prosemirror-keymap",
            "prosemirror-schema-list",
            "prosemirror-history",
            "prosemirror-dropcursor",
            "prosemirror-gapcursor",
            "prosemirror-tables",
          ],
          mui: ["@mui/material", "@mui/icons-material"],
          react: ["react", "react-dom", "react/jsx-runtime", "scheduler"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
          table: ["@tanstack/react-table", "@tanstack/react-virtual"],
          copilotkit: ["@copilotkit/react-core", "@copilotkit/react-ui"],
          dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
        },
      },
    },
  },
  server: {
    port: 5180,
    proxy: {
      "/api/copilotkit": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1`,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
      },
      "/.well-known": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/authorize": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/token": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/register": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/revoke": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/oauth": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
      "/mcp": {
        target: `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/mcp`,
        changeOrigin: true,
      },
    },
  },
  };
});
