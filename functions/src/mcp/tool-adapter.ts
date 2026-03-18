import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools as anthropicTools } from "../tools/definitions";
import { executeTool } from "../tools/executor";

// Tools that don't make sense in the MCP context
const EXCLUDED_TOOLS = new Set(["navigate_to_page", "web_search"]);

/**
 * Convert a JSON Schema property definition to a Zod schema.
 */
function jsonSchemaPropertyToZod(prop: Record<string, unknown>): z.ZodTypeAny {
  const type = prop.type as string | undefined;
  const description = prop.description as string | undefined;

  let schema: z.ZodTypeAny;

  switch (type) {
    case "string":
      schema = prop.enum
        ? z.enum(prop.enum as [string, ...string[]])
        : z.string();
      break;
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "array":
      schema = z.array(z.any());
      break;
    case "object": {
      const nested = prop.properties as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (nested) {
        const nestedRequired = new Set((prop.required || []) as string[]);
        const shape: Record<string, z.ZodTypeAny> = {};
        for (const [k, v] of Object.entries(nested)) {
          let field = jsonSchemaPropertyToZod(v);
          if (!nestedRequired.has(k)) field = field.optional();
          shape[k] = field;
        }
        schema = z.object(shape);
      } else {
        schema = z.record(z.string(), z.any());
      }
      break;
    }
    default:
      schema = z.any();
  }

  if (description) {
    schema = schema.describe(description);
  }

  return schema;
}

/**
 * Convert an Anthropic tool's input_schema to a Zod shape for McpServer.tool().
 */
function buildZodShape(
  inputSchema: Record<string, unknown>
): Record<string, z.ZodTypeAny> {
  const properties = (inputSchema.properties || {}) as Record<
    string,
    Record<string, unknown>
  >;
  const required = new Set((inputSchema.required || []) as string[]);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let zodProp = jsonSchemaPropertyToZod(prop);
    if (!required.has(key)) {
      zodProp = zodProp.optional();
    }
    shape[key] = zodProp;
  }

  return shape;
}

/**
 * Registers existing notion-clone tools with the MCP server.
 * Converts Anthropic tool format to MCP (Zod-based) tool format.
 */
export function registerMcpTools(server: McpServer): void {
  for (const tool of anthropicTools) {
    if (EXCLUDED_TOOLS.has(tool.name)) continue;

    const description = tool.description || tool.name;
    const zodShape = buildZodShape(
      tool.input_schema as Record<string, unknown>
    );

    // Use the 4-arg overload: tool(name, description, paramsSchema, cb)
    server.tool(
      tool.name,
      description,
      zodShape,
      async (params: Record<string, unknown>, extra) => {
        // Extract userId and workspaceId from the OAuth token's AuthInfo
        const authInfo = extra.authInfo;
        if (!authInfo?.extra?.userId || !authInfo?.extra?.workspaceId) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "Unauthorized: missing user or workspace context",
                }),
              },
            ],
            isError: true,
          };
        }

        const context = {
          workspaceId: authInfo.extra.workspaceId as string,
          userId: authInfo.extra.userId as string,
        };

        const result = await executeTool(tool.name, params, context);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result),
            },
          ],
          isError: !result.success,
        };
      }
    );
  }
}
