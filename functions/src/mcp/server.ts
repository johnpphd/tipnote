import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerMcpTools } from "./tool-adapter";
import { registerMcpResources } from "./resources";

/**
 * Creates and configures the MCP server with tools and resources.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "notion-clone",
    version: "1.0.0",
  });

  registerMcpTools(server);
  registerMcpResources(server);

  return server;
}
