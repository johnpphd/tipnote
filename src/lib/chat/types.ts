import type { PageBrandId, WorkspaceBrandId } from "@/types";

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
  pageId: PageBrandId;
}

export interface ChatContext {
  workspaceId: WorkspaceBrandId;
  currentPageId?: PageBrandId;
  currentPageTitle?: string;
}
