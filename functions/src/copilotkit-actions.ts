import { z } from "zod";
import { Action, Parameter } from "@copilotkit/shared";
import { jsonSchemaToActionParameters } from "@copilotkit/shared";
import { executeTool } from "./tools/executor";
import { tools } from "./tools/definitions";
import { toolSchemas, ToolName } from "./tools/schemas";

/**
 * Convert a Zod schema to CopilotKit Parameter[] format.
 * Uses Zod v4's built-in toJSONSchema and CopilotKit's converter.
 */
function zodToParameters(schema: z.ZodType): Parameter[] {
  const jsonSchema = z.toJSONSchema(schema);
  return jsonSchemaToActionParameters(jsonSchema as Parameters<typeof jsonSchemaToActionParameters>[0]);
}

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
 * Build CopilotKit actions for a given workspace and user context.
 *
 * The closure over workspaceId/userId means these are injected per-request
 * after auth verification, so each action automatically operates within
 * the correct security context.
 */
export function buildActions(workspaceId: string, userId: string): Action<Parameter[]>[] {
  const descriptions = getToolDescriptions();

  return (Object.entries(toolSchemas) as [ToolName, z.ZodType][]).map(
    ([toolName, schema]) => {
      const action: Action<Parameter[]> = {
        name: toolName,
        description: descriptions[toolName] || toolName,
        parameters: zodToParameters(schema),
        handler: async (args: Record<string, unknown>) => {
          try {
            const result = await executeTool(toolName, args, {
              workspaceId,
              userId,
            });

            // For navigate_to_page, include the action metadata so the
            // frontend can perform client-side navigation.
            if (toolName === "navigate_to_page" && result.action) {
              return {
                ...result,
                action: result.action,
              };
            }

            return result;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Unknown error";
            return { success: false, error: message };
          }
        },
      };

      return action;
    }
  );
}
