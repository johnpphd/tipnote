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
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("firebase/")) return "firebase";
          if (id.includes("@tiptap/") || id.includes("prosemirror-") || id.includes("lowlight")) return "editor";
          if (id.includes("@mui/")) return "mui";
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react/") || id.includes("node_modules/scheduler/")) return "react";
          if (id.includes("@tanstack/react-router")) return "router";
          if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) return "query";
          if (id.includes("@tanstack/react-table") || id.includes("@tanstack/react-virtual")) return "table";
          if (id.includes("@copilotkit/")) return "copilotkit";
          if (id.includes("@dnd-kit/")) return "dnd";
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
