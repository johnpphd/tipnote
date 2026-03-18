import express from "express";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { NotionCloneOAuthProvider } from "./oauth-provider";
import { createMcpServer } from "./server";
import { handleAuthCallback } from "./auth-callback";
import { BASE_URL } from "./config";

/**
 * Creates the Express app that serves:
 * - OAuth 2.1 discovery, DCR, authorize, token endpoints (via mcpAuthRouter)
 * - Custom authorization callback endpoint
 * - MCP Streamable HTTP endpoint with bearer auth
 */
export function createMcpApp(): express.Application {
  const app = express();

  // Parse JSON bodies (needed for /oauth/callback and /mcp)
  app.use(express.json());

  const provider = new NotionCloneOAuthProvider();

  // Mount the MCP SDK's OAuth router at the root.
  // This adds: /.well-known/oauth-authorization-server,
  //            /.well-known/oauth-protected-resource,
  //            /oauth/register, /oauth/authorize, /oauth/token, /oauth/revoke
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl: new URL(BASE_URL),
      baseUrl: new URL(BASE_URL),
      serviceDocumentationUrl: new URL(BASE_URL),
      scopesSupported: ["read", "write"],
    })
  );

  // Custom callback endpoint for the consent page POST
  app.post("/oauth/callback", handleAuthCallback);

  // Bearer auth middleware for MCP endpoints
  const bearerAuth = requireBearerAuth({ verifier: provider });

  // MCP Streamable HTTP endpoint (POST = send messages, GET = SSE, DELETE = close)
  app.post("/mcp", bearerAuth, async (req, res) => {
    try {
      const server = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
      });

      // Connect server to transport
      await server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.get("/mcp", bearerAuth, async (req, res) => {
    // SSE endpoint for server-initiated notifications (stateless = not supported)
    res.status(405).json({
      error: "SSE streaming not supported in stateless mode",
    });
  });

  app.delete("/mcp", bearerAuth, async (_req, res) => {
    // Session cleanup (stateless = no-op)
    res.status(200).end();
  });

  return app;
}
