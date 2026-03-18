import type Anthropic from "@anthropic-ai/sdk";

type Tool = Anthropic.Tool;

export const tools: Tool[] = [
  {
    name: "create_page",
    description:
      "Create a new page in the workspace with optional description and body content. The page will appear in the sidebar automatically.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The page title",
        },
        parentId: {
          type: "string",
          description: "Optional parent page ID to nest under",
        },
        icon: {
          type: "string",
          description: "Optional emoji icon for the page",
        },
        description: {
          type: "string",
          description: "Optional short description shown below the title",
        },
        content: {
          type: "array",
          description:
            'Body content as an array of blocks. Each block is an object with "type" and "text". Supported types: "paragraph", "heading" (use attrs.level 1-3), "bulletList", "orderedList", "taskList", "codeBlock", "blockquote". For lists, nest items inside a "content" array with listItem nodes containing paragraph nodes.',
          items: {
            type: "object",
          },
        },
      },
      required: ["title"],
    },
  },
  {
    name: "update_page",
    description:
      "Update an existing page's title, icon, description, or body content.",
    input_schema: {
      type: "object" as const,
      properties: {
        pageId: {
          type: "string",
          description: "The page ID to update",
        },
        title: {
          type: "string",
          description: "New title for the page",
        },
        icon: {
          type: "string",
          description: "New emoji icon",
        },
        description: {
          type: "string",
          description: "New short description shown below the title",
        },
        content: {
          type: "array",
          description:
            'Replace body content. Same format as create_page content: array of block objects with "type" and "text".',
          items: {
            type: "object",
          },
        },
      },
      required: ["pageId"],
    },
  },
  {
    name: "delete_page",
    description:
      "Soft-delete a page (moves it to trash). Ask for confirmation before deleting.",
    input_schema: {
      type: "object" as const,
      properties: {
        pageId: {
          type: "string",
          description: "The page ID to delete",
        },
      },
      required: ["pageId"],
    },
  },
  {
    name: "create_database",
    description:
      "Create a new database with a default table view. Returns the database ID, page ID, and view ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The database title",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "add_database_property",
    description: "Add a new property (column) to an existing database.",
    input_schema: {
      type: "object" as const,
      properties: {
        databaseId: {
          type: "string",
          description: "The database ID",
        },
        name: {
          type: "string",
          description: "Property name",
        },
        type: {
          type: "string",
          enum: [
            "text",
            "number",
            "select",
            "multiSelect",
            "date",
            "checkbox",
            "url",
            "person",
          ],
          description: "Property type",
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              color: { type: "string" },
            },
            required: ["name", "color"],
          },
          description:
            "Options for select/multiSelect properties. Colors: default, gray, brown, orange, yellow, green, blue, purple, pink, red",
        },
      },
      required: ["databaseId", "name", "type"],
    },
  },
  {
    name: "create_database_row",
    description: "Create a new row in a database.",
    input_schema: {
      type: "object" as const,
      properties: {
        databaseId: {
          type: "string",
          description: "The database ID to add a row to",
        },
        properties: {
          type: "object",
          description:
            "Property values keyed by property name. Values depend on type: string for text/title/url, number for number, boolean for checkbox, string for select (option name), string[] for multiSelect (option names), string for date (YYYY-MM-DD).",
        },
      },
      required: ["databaseId"],
    },
  },
  {
    name: "list_database_rows",
    description:
      "List rows in a database with their property values, optionally filtered by a property condition. Returns rows with resolved property names and human-readable values (e.g., select option names instead of IDs). Use filter to search by title, text, select, number, or other property types.",
    input_schema: {
      type: "object" as const,
      properties: {
        databaseId: {
          type: "string",
          description: "The database ID to list rows for",
        },
        limit: {
          type: "number",
          description: "Maximum number of rows to return (default 50, max 200)",
        },
        filter: {
          type: "object",
          description:
            'Filter rows by a property value. Provide "property" (the property name, e.g. "Title", "Genre") and exactly one condition: "equals" for exact match (all types, case-insensitive for text), "contains" for substring match (text/title/url), "greater_than" or "less_than" for numeric comparisons. For select/multiSelect, "equals" matches the option name. Example: {"property": "Title", "contains": "Idea"} or {"property": "Rating", "greater_than": 7}.',
          properties: {
            property: {
              type: "string",
              description:
                "The property name to filter on (e.g., 'Title', 'Genre', 'Rating')",
            },
            equals: {
              description:
                "Exact match. String comparison is case-insensitive. For select, matches the option name. For checkbox, use true/false.",
            },
            contains: {
              type: "string",
              description:
                "Substring match (case-insensitive). Works for text, title, and url properties.",
            },
            greater_than: {
              type: "number",
              description:
                "Greater than comparison. Works for number properties.",
            },
            less_than: {
              type: "number",
              description: "Less than comparison. Works for number properties.",
            },
          },
          required: ["property"],
        },
      },
      required: ["databaseId"],
    },
  },
  {
    name: "get_database_row",
    description:
      "Get a specific database row by its row ID, including all property values with human-readable names.",
    input_schema: {
      type: "object" as const,
      properties: {
        rowId: {
          type: "string",
          description: "The row ID to get",
        },
      },
      required: ["rowId"],
    },
  },
  {
    name: "update_database_row",
    description:
      "Update property values on an existing database row. Properties are keyed by property name (case-insensitive). For select properties, use the option name. For multiSelect, use an array of option names.",
    input_schema: {
      type: "object" as const,
      properties: {
        rowId: {
          type: "string",
          description: "The row ID to update",
        },
        properties: {
          type: "object",
          description:
            "Property values keyed by property name. Same format as create_database_row properties.",
        },
      },
      required: ["rowId", "properties"],
    },
  },
  {
    name: "delete_database_row",
    description:
      "Delete a database row. This soft-deletes the associated page.",
    input_schema: {
      type: "object" as const,
      properties: {
        rowId: {
          type: "string",
          description: "The row ID to delete",
        },
      },
      required: ["rowId"],
    },
  },
  {
    name: "search_pages",
    description:
      "Search for pages by title. Returns matching pages with their IDs and titles.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to match against page titles",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_pages",
    description:
      "List all top-level pages in the workspace (not database rows). Returns page IDs, titles, and icons.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_page_content",
    description:
      "Get details about a specific page including its title, icon, type, description, and body content.",
    input_schema: {
      type: "object" as const,
      properties: {
        pageId: {
          type: "string",
          description: "The page ID to get content for",
        },
      },
      required: ["pageId"],
    },
  },
  {
    name: "navigate_to_page",
    description:
      "Navigate the user to a specific page in the app. Use this after creating a page or when the user asks to go to a page.",
    input_schema: {
      type: "object" as const,
      properties: {
        pageId: {
          type: "string",
          description: "The page ID to navigate to",
        },
      },
      required: ["pageId"],
    },
  },
  {
    name: "web_search",
    description:
      "Search the web for current information. Use this for questions about movies, ratings, reviews, news, facts, people, places, or anything that requires up-to-date knowledge beyond the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "The search query. Be specific — e.g. 'Oppenheimer rotten tomatoes rating' rather than just 'Oppenheimer'.",
        },
        count: {
          type: "number",
          description:
            "Number of results to return (1-10). Default 5. Use fewer for simple fact lookups, more for research.",
        },
      },
      required: ["query"],
    },
  },
];
