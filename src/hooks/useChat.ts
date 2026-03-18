import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useCopilotChatInternal,
  useCopilotAction,
} from "@copilotkit/react-core";
import type { ChatMessage, ChatContext } from "@/lib/chat/types";

/**
 * Maps AG-UI messages (from CopilotKit v2) to the app's ChatMessage format.
 * AG-UI messages: { id, role: "user"|"assistant"|"tool", content?, toolCalls? }
 */
function mapAGUIMessages(
  messages: Array<{
    id: string;
    role: string;
    content?: string | unknown;
    toolCalls?: Array<{ function: { name: string; arguments: string } }>;
  }>,
): ChatMessage[] {
  const result: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : Array.isArray(msg.content)
            ? (msg.content as Array<{ type: string; text?: string }>)
                .filter((part) => part.type === "text" && part.text)
                .map((part) => part.text!)
                .join("")
            : "";
      result.push({
        id: msg.id,
        role: "user",
        content,
        toolResults: [],
        timestamp: Date.now(),
      });
    } else if (msg.role === "assistant") {
      const toolResults =
        msg.toolCalls?.map((tc) => ({
          name: tc.function.name,
          success: true,
          data: safeParseArgs(tc.function.arguments),
        })) ?? [];

      result.push({
        id: msg.id,
        role: "assistant",
        content: typeof msg.content === "string" ? msg.content : "",
        toolResults,
        timestamp: Date.now(),
      });
    } else if (msg.role === "tool") {
      // Attach tool result to the last assistant message
      const lastAssistant = findLastAssistant(result);
      if (lastAssistant?.toolResults?.length) {
        const decoded = safeParseArgs(
          typeof msg.content === "string" ? msg.content : "",
        );
        // Update the first unresolved tool result
        const tools = [...lastAssistant.toolResults];
        const matchIdx = tools.findIndex((t) => !t.data?._resolved);
        if (matchIdx >= 0) {
          tools[matchIdx] = {
            ...tools[matchIdx],
            success: !(decoded as Record<string, unknown> | undefined)?.error,
            data: { ...(decoded as Record<string, unknown>), _resolved: true },
            error: (decoded as Record<string, unknown> | undefined)?.error as
              | string
              | undefined,
          };
          lastAssistant.toolResults = tools;
        }
      }
    }
  }

  return result;
}

function findLastAssistant(messages: ChatMessage[]): ChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i];
  }
  return undefined;
}

function safeParseArgs(args: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(args) as Record<string, unknown>;
  } catch {
    return args ? { value: args } : undefined;
  }
}

export function useChat(_context: ChatContext) {
  const navigate = useNavigate();

  // Use useCopilotChatInternal to access AG-UI `messages` (not deprecated `visibleMessages`)
  const {
    messages: agMessages,
    appendMessage,
    reset,
    isLoading,
  } = useCopilotChatInternal();

  // Register a frontend action to handle navigation from tool results
  useCopilotAction({
    name: "navigate",
    description: "Navigate to a page in the workspace",
    parameters: [
      {
        name: "pageId",
        type: "string",
        description: "The ID of the page to navigate to",
        required: true,
      },
    ],
    handler: async ({ pageId }: { pageId: string }) => {
      void navigate({
        to: "/w/$pageId",
        params: { pageId },
      });
      return `Navigated to page ${pageId}`;
    },
  });

  // Map AG-UI messages to app format
  const messages: ChatMessage[] = useMemo(
    () => mapAGUIMessages(agMessages ?? []),
    [agMessages],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      const { TextMessage } = await import("@copilotkit/runtime-client-gql");
      const { MessageRole } = await import("@copilotkit/runtime-client-gql");
      const msg = new TextMessage({
        content: content.trim(),
        role: MessageRole.User,
      });
      await appendMessage(msg);
    },
    [appendMessage],
  );

  const clearMessages = useCallback(() => {
    reset();
  }, [reset]);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
