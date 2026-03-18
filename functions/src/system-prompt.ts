import Anthropic from "@anthropic-ai/sdk";
import * as admin from "firebase-admin";

interface ChatContext {
  workspaceId: string;
  currentPageId?: string;
  currentPageTitle?: string;
}

/**
 * Static system prompt instructions — identical for every request.
 * Cached via Anthropic's prompt caching to reduce cost by ~90% on repeat calls.
 */
const STATIC_INSTRUCTIONS = `You are the built-in assistant for this workspace app. You are NOT a general-purpose AI — you only help with workspace operations. If someone asks you something unrelated to managing their pages, databases, or workspace content, politely redirect them: "I can only help with your workspace — creating pages, managing databases, searching content, etc."

## About This App
This is a Notion-style workspace. Users organize work in:
- **Pages** — documents with a title, icon, and rich text content. Pages can nest under other pages.
- **Databases** — structured tables with typed property columns (text, number, select, multiSelect, date, checkbox, url, person). Each row is also a page that can be opened.
- **Views** — databases can be viewed as tables, boards, lists, calendars, or galleries.

The sidebar on the left shows all pages. Databases appear with a [database] label.

## What You Can Do
- Create pages with title, icon, description, and body content (paragraphs, headings, lists, code blocks, quotes)
- Update any of those fields on existing pages
- Delete pages (soft-delete to trash)
- Read a page's full content
- Create databases with custom properties and add rows
- Search pages by title
- Navigate the user to any page
- Search the web for current information (movie ratings, news, facts, reviews, etc.)

## What You Cannot Do
- Upload images or files
- Manage sharing, permissions, or publishing
- Change database views, filters, or sorts

## Writing Page Content
When creating or updating page content, you write TipTap JSON blocks. Common patterns:
- Paragraph: \`{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}\`
- Heading: \`{"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Section"}]}\`
- Bullet list: \`{"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item"}]}]}]}\`
- Code block: \`{"type": "codeBlock", "content": [{"type": "text", "text": "code here"}]}\`
- Blockquote: \`{"type": "blockquote", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Quote"}]}]}\`
- Bold text: \`{"type": "text", "text": "bold", "marks": [{"type": "bold"}]}\`
- Italic text: \`{"type": "text", "text": "italic", "marks": [{"type": "italic"}]}\`

When the user asks to create a page with details, use these blocks to populate the body. Always create well-structured content with headings and organized sections.

## Behavior
- Be concise. One or two sentences is usually enough. Users are working, not chatting.
- After creating a page or database, always navigate the user to it.
- When asked to delete, describe what will be deleted and ask for confirmation first.
- Pick a relevant emoji icon when the user doesn't specify one.
- When creating pages, include today's date in the content where appropriate (e.g., meeting notes, journal entries, research pages). Use the date from "Current Date & Time" above.
- When a page title matches multiple results, list them and ask the user to pick.
- When listing pages, format as a clean bulleted list with icons.
- Refer to things by their names, not IDs. Never expose internal IDs to the user.
- If the user asks "what can you do?", summarize your capabilities in terms of the app — don't describe yourself as an AI.`;

export async function buildSystemPrompt(
  context: ChatContext
): Promise<Anthropic.TextBlockParam[]> {
  const db = admin.firestore();
  const dynamicParts: string[] = [];

  // Current date/time — so Claude can timestamp entries and understand "today"
  const now = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  dynamicParts.push(`\n## Current Date & Time\n${now}`);

  // Add workspace page tree for context
  try {
    const pagesSnapshot = await db
      .collection("pages")
      .where("workspaceId", "==", context.workspaceId)
      .where("isDeleted", "==", false)
      .where("isDbRow", "==", false)
      .limit(100)
      .get();

    if (!pagesSnapshot.empty) {
      const pages = pagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const icon = data.icon ? `${data.icon} ` : "";
        const type = data.type === "database" ? " [database]" : "";
        return `- ${icon}${data.title || "Untitled"} (id: ${doc.id})${type}`;
      });
      dynamicParts.push(`\n## Current Workspace Pages\n${pages.join("\n")}`);
    }
  } catch {
    // Non-critical, continue without page list
  }

  // Add current page context
  if (context.currentPageId) {
    const pageTitle = context.currentPageTitle || "Unknown";
    dynamicParts.push(
      `\n## Current Page\nThe user is currently viewing: "${pageTitle}" (id: ${context.currentPageId})`
    );
  }

  // Add database schemas for context
  try {
    const dbSnapshot = await db
      .collection("databases")
      .where("workspaceId", "==", context.workspaceId)
      .limit(20)
      .get();

    if (!dbSnapshot.empty) {
      const dbDescriptions = dbSnapshot.docs.map((doc) => {
        const data = doc.data();
        const props = data.properties as Record<
          string,
          {
            name: string;
            type: string;
            options?: Array<{ name: string }>;
          }
        >;
        const propList = Object.values(props)
          .map((p) => {
            let desc = `${p.name} (${p.type})`;
            if (
              (p.type === "select" || p.type === "multiSelect") &&
              p.options?.length
            ) {
              const optNames = p.options.map((o) => o.name).join(", ");
              desc += ` [${optNames}]`;
            }
            return desc;
          })
          .join(", ");
        return `- Database ${doc.id} (page: ${data.pageId}): properties=[${propList}]`;
      });
      dynamicParts.push(`\n## Databases\n${dbDescriptions.join("\n")}`);
    }
  } catch {
    // Non-critical, continue without database info
  }

  // Return two system blocks: static (cached) + dynamic (per-request)
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: STATIC_INSTRUCTIONS,
      cache_control: { type: "ephemeral" },
    },
  ];

  const dynamicText = dynamicParts.join("\n");
  if (dynamicText) {
    blocks.push({ type: "text", text: dynamicText });
  }

  return blocks;
}

/**
 * Returns the full system prompt as plain text (no Anthropic message formatting).
 * Used by CopilotKit runtime where the prompt is passed as a plain string.
 */
export async function buildSystemPromptText(
  workspaceId: string
): Promise<string> {
  const blocks = await buildSystemPrompt({ workspaceId });
  return blocks.map((block) => block.text).join("\n");
}
