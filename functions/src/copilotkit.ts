import * as admin from "firebase-admin";
import type { Request, Response, NextFunction } from "express";
import { CopilotRuntime } from "@copilotkitnext/runtime";
import { createCopilotEndpointSingleRouteExpress } from "@copilotkitnext/runtime/express";
import { BuiltInAgent, defineTool } from "@copilotkitnext/agent";
import { toolSchemas, type ToolName } from "./tools/schemas";
import { tools } from "./tools/definitions";
import { executeTool } from "./tools/executor";
import { buildSystemPromptText } from "./system-prompt";

/**
 * Build a description lookup from the Anthropic tool definitions.
 * Falls back to the tool name if no description is found.
 */
function getToolDescriptions(): Record<string, string> {
  const descriptions: Record<string, string> = {};
  for (const tool of tools) {
    descriptions[tool.name] = tool.description || tool.name;
  }
  return descriptions;
}

/**
 * Convert toolSchemas to CopilotKit v2 ToolDefinition[] using defineTool.
 * Each tool closes over the workspace/user context for secure execution.
 */
function buildTools(workspaceId: string, userId: string) {
  const descriptions = getToolDescriptions();

  return Object.entries(toolSchemas).map(([toolName, schema]) =>
    defineTool({
      name: toolName,
      description: descriptions[toolName] || toolName,
      parameters: schema,
      execute: async (args: Record<string, unknown>) => {
        try {
          return await executeTool(toolName as ToolName, args, {
            workspaceId,
            userId,
          });
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      },
    })
  );
}

/**
 * CopilotKit v2 runtime handler for the tipnote workspace assistant.
 *
 * Uses the Express adapter from @copilotkitnext/runtime/express which
 * synthesizes the request body from req.body when the stream is already
 * consumed (as happens with Firebase Functions' Express middleware).
 *
 * Auth and workspace verification mirror chat.ts exactly.
 */
export async function handleCopilotKit(
  req: Request,
  res: Response
): Promise<void> {
  // The "info" method is unauthenticated — the client sends it to discover
  // runtime capabilities before any user interaction.
  // The client may send GET /api/copilotkit/info or POST with method:"info".
  if (req.body?.method === "info" || req.path?.endsWith("/info")) {
    res.status(200).json({
      version: "1.0.0",
      agents: { default: { name: "default" } },
      audioFileTranscriptionEnabled: false,
    });
    return;
  }

  // Normalize req.url to "/" — Firebase Functions receives various paths
  // ("/copilotkit", "/copilotkit/info", "/") depending on hosting rewrites
  // vs emulator vs direct invocation. The Express router expects "/".
  req.url = "/";

  // Verify Firebase Auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  let userId: string;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await admin.auth().verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    res.status(401).json({ error: "Invalid authorization token" });
    return;
  }

  // Extract workspaceId from header or body.
  // v2 single-route envelope: { method, params, body: { forwardedProps: { workspaceId } } }
  const workspaceId =
    (req.headers["x-workspace-id"] as string | undefined) ??
    req.body?.body?.forwardedProps?.workspaceId ??
    req.body?.forwardedProps?.workspaceId;

  if (!workspaceId) {
    res
      .status(400)
      .json({ error: "workspaceId required (X-Workspace-Id header or body)" });
    return;
  }

  // Verify the user is a member of the requested workspace
  const workspaceDoc = await admin
    .firestore()
    .collection("workspaces")
    .doc(workspaceId)
    .get();

  if (!workspaceDoc.exists) {
    res.status(404).json({ error: "Workspace not found" });
    return;
  }

  const memberIds = workspaceDoc.data()?.memberIds as string[] | undefined;
  if (!memberIds?.includes(userId)) {
    res.status(403).json({ error: "Not a member of this workspace" });
    return;
  }

  // Build workspace-scoped tools and system prompt
  const copilotTools = buildTools(workspaceId, userId);
  const systemPrompt = await buildSystemPromptText(workspaceId);

  const agent = new BuiltInAgent({
    model: "anthropic/claude-sonnet-4-20250514",
    tools: copilotTools,
    prompt: systemPrompt,
    maxSteps: 10,
  });

  const runtime = new CopilotRuntime({
    agents: { default: agent },
  });

  const router = createCopilotEndpointSingleRouteExpress({
    runtime,
    basePath: "/",
  });

  router(req, res, (() => res.status(404).end()) as NextFunction);
}
