// The base URL for this MCP server (Firebase Hosting).
// Derived from FIREBASE_CONFIG (auto-injected in deployed functions) or BASE_URL env var.
function deriveBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const config = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
  if (config.projectId) return `https://${config.projectId}.web.app`;
  throw new Error(
    "Cannot determine BASE_URL. Set BASE_URL env var or deploy to Firebase."
  );
}
export const BASE_URL = deriveBaseUrl();
