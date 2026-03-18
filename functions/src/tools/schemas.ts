import { z } from "zod";

// ---------- create_page ----------

export const createPageSchema = z.object({
  title: z.string().describe("The page title"),
  parentId: z
    .string()
    .describe("Optional parent page ID to nest under")
    .optional(),
  icon: z.string().describe("Optional emoji icon for the page").optional(),
  description: z
    .string()
    .describe("Optional short description shown below the title")
    .optional(),
  content: z
    .array(z.record(z.string(), z.unknown()))
    .describe(
      'Body content as an array of blocks. Each block is an object with "type" and "text". Supported types: "paragraph", "heading" (use attrs.level 1-3), "bulletList", "orderedList", "taskList", "codeBlock", "blockquote". For lists, nest items inside a "content" array with listItem nodes containing paragraph nodes.'
    )
    .optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;

// ---------- update_page ----------

export const updatePageSchema = z.object({
  pageId: z.string().describe("The page ID to update"),
  title: z.string().describe("New title for the page").optional(),
  icon: z.string().describe("New emoji icon").optional(),
  description: z
    .string()
    .describe("New short description shown below the title")
    .optional(),
  content: z
    .array(z.record(z.string(), z.unknown()))
    .describe(
      'Replace body content. Same format as create_page content: array of block objects with "type" and "text".'
    )
    .optional(),
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

// ---------- delete_page ----------

export const deletePageSchema = z.object({
  pageId: z.string().describe("The page ID to delete"),
});

export type DeletePageInput = z.infer<typeof deletePageSchema>;

// ---------- create_database ----------

export const createDatabaseSchema = z.object({
  title: z.string().describe("The database title"),
});

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>;

// ---------- add_database_property ----------

export const addDatabasePropertySchema = z.object({
  databaseId: z.string().describe("The database ID"),
  name: z.string().describe("Property name"),
  type: z
    .enum([
      "text",
      "number",
      "select",
      "multiSelect",
      "date",
      "checkbox",
      "url",
      "person",
    ])
    .describe("Property type"),
  options: z
    .array(
      z.object({
        name: z.string(),
        color: z.string(),
      })
    )
    .describe(
      "Options for select/multiSelect properties. Colors: default, gray, brown, orange, yellow, green, blue, purple, pink, red"
    )
    .optional(),
});

export type AddDatabasePropertyInput = z.infer<
  typeof addDatabasePropertySchema
>;

// ---------- create_database_row ----------

export const createDatabaseRowSchema = z.object({
  databaseId: z.string().describe("The database ID to add a row to"),
  properties: z
    .record(z.string(), z.unknown())
    .describe(
      "Property values keyed by property name. Values depend on type: string for text/title/url, number for number, boolean for checkbox, string for select (option name), string[] for multiSelect (option names), string for date (YYYY-MM-DD)."
    )
    .optional(),
});

export type CreateDatabaseRowInput = z.infer<typeof createDatabaseRowSchema>;

// ---------- list_database_rows ----------

export const listDatabaseRowsFilterSchema = z.object({
  property: z
    .string()
    .describe(
      "The property name to filter on (e.g., 'Title', 'Genre', 'Rating')"
    ),
  equals: z
    .unknown()
    .describe(
      "Exact match. String comparison is case-insensitive. For select, matches the option name. For checkbox, use true/false."
    )
    .optional(),
  contains: z
    .string()
    .describe(
      "Substring match (case-insensitive). Works for text, title, and url properties."
    )
    .optional(),
  greater_than: z
    .number()
    .describe("Greater than comparison. Works for number properties.")
    .optional(),
  less_than: z
    .number()
    .describe("Less than comparison. Works for number properties.")
    .optional(),
});

export const listDatabaseRowsSchema = z.object({
  databaseId: z.string().describe("The database ID to list rows for"),
  limit: z
    .number()
    .describe("Maximum number of rows to return (default 50, max 200)")
    .optional(),
  filter: listDatabaseRowsFilterSchema
    .describe(
      'Filter rows by a property value. Provide "property" (the property name, e.g. "Title", "Genre") and exactly one condition: "equals" for exact match (all types, case-insensitive for text), "contains" for substring match (text/title/url), "greater_than" or "less_than" for numeric comparisons. For select/multiSelect, "equals" matches the option name. Example: {"property": "Title", "contains": "Idea"} or {"property": "Rating", "greater_than": 7}.'
    )
    .optional(),
});

export type ListDatabaseRowsInput = z.infer<typeof listDatabaseRowsSchema>;

// ---------- get_database_row ----------

export const getDatabaseRowSchema = z.object({
  rowId: z.string().describe("The row ID to get"),
});

export type GetDatabaseRowInput = z.infer<typeof getDatabaseRowSchema>;

// ---------- update_database_row ----------

export const updateDatabaseRowSchema = z.object({
  rowId: z.string().describe("The row ID to update"),
  properties: z
    .record(z.string(), z.unknown())
    .describe(
      "Property values keyed by property name. Same format as create_database_row properties."
    ),
});

export type UpdateDatabaseRowInput = z.infer<typeof updateDatabaseRowSchema>;

// ---------- delete_database_row ----------

export const deleteDatabaseRowSchema = z.object({
  rowId: z.string().describe("The row ID to delete"),
});

export type DeleteDatabaseRowInput = z.infer<typeof deleteDatabaseRowSchema>;

// ---------- search_pages ----------

export const searchPagesSchema = z.object({
  query: z.string().describe("Search query to match against page titles"),
});

export type SearchPagesInput = z.infer<typeof searchPagesSchema>;

// ---------- list_pages ----------

export const listPagesSchema = z.object({});

export type ListPagesInput = z.infer<typeof listPagesSchema>;

// ---------- get_page_content ----------

export const getPageContentSchema = z.object({
  pageId: z.string().describe("The page ID to get content for"),
});

export type GetPageContentInput = z.infer<typeof getPageContentSchema>;

// ---------- navigate_to_page ----------

export const navigateToPageSchema = z.object({
  pageId: z.string().describe("The page ID to navigate to"),
});

export type NavigateToPageInput = z.infer<typeof navigateToPageSchema>;

// ---------- web_search ----------

export const webSearchSchema = z.object({
  query: z
    .string()
    .describe(
      "The search query. Be specific — e.g. 'Oppenheimer rotten tomatoes rating' rather than just 'Oppenheimer'."
    ),
  count: z
    .number()
    .describe(
      "Number of results to return (1-10). Default 5. Use fewer for simple fact lookups, more for research."
    )
    .optional(),
});

export type WebSearchInput = z.infer<typeof webSearchSchema>;

// ---------- Tool name -> schema mapping ----------

export const toolSchemas = {
  create_page: createPageSchema,
  update_page: updatePageSchema,
  delete_page: deletePageSchema,
  create_database: createDatabaseSchema,
  add_database_property: addDatabasePropertySchema,
  create_database_row: createDatabaseRowSchema,
  list_database_rows: listDatabaseRowsSchema,
  get_database_row: getDatabaseRowSchema,
  update_database_row: updateDatabaseRowSchema,
  delete_database_row: deleteDatabaseRowSchema,
  search_pages: searchPagesSchema,
  list_pages: listPagesSchema,
  get_page_content: getPageContentSchema,
  navigate_to_page: navigateToPageSchema,
  web_search: webSearchSchema,
} as const;

export type ToolName = keyof typeof toolSchemas;
