export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResult[];
  timestamp: number;
}

export interface ToolResult {
  name: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ChatAction {
  type: "navigate";
  pageId: string;
}

export interface ChatContext {
  workspaceId: string;
  currentPageId?: string;
  currentPageTitle?: string;
}
