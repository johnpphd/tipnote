import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { handleCopilotKit } from "./copilotkit";
import { createMcpApp } from "./mcp/app";

admin.initializeApp();

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const braveSearchApiKey = defineSecret("BRAVE_SEARCH_API_KEY");

export const copilotkit = onRequest(
  {
    timeoutSeconds: 300,
    memory: "512MiB",
    region: "us-central1",
    secrets: [anthropicApiKey, braveSearchApiKey],
    cors: true,
  },
  handleCopilotKit
);

const mcpApp = createMcpApp();

export const mcp = onRequest(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    region: "us-central1",
    cors: false, // Express handles routing
  },
  mcpApp
);
