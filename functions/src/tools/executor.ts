import * as admin from "firebase-admin";
import { randomUUID as uuidv4 } from "node:crypto";

function getDb() {
  return admin.firestore();
}

interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  /** Optional action for the frontend to execute (e.g., navigation) */
  action?: { type: string; pageId?: string };
}

interface ToolContext {
  workspaceId: string;
  userId: string;
}

/**
 * Verify a page belongs to the user's workspace before operating on it.
 * Returns the page data if valid, or a ToolResult error if not.
 */
async function verifyPageAccess(
  pageId: string,
  workspaceId: string
): Promise<
  | { ok: true; data: FirebaseFirestore.DocumentData }
  | { ok: false; error: ToolResult }
> {
  const doc = await getDb().collection("pages").doc(pageId).get();
  if (!doc.exists) {
    return { ok: false, error: { success: false, error: "Page not found" } };
  }
  const data = doc.data()!;
  if (data.workspaceId !== workspaceId) {
    return {
      ok: false,
      error: { success: false, error: "Page not found in this workspace" },
    };
  }
  return { ok: true, data };
}

/**
 * Verify a database belongs to the user's workspace before operating on it.
 * Accepts either a database document ID or a page ID (resolves automatically).
 */
async function verifyDatabaseAccess(
  databaseId: string,
  workspaceId: string
): Promise<
  | { ok: true; data: FirebaseFirestore.DocumentData; databaseId: string }
  | { ok: false; error: ToolResult }
> {
  // Try direct database document lookup first
  const doc = await getDb().collection("databases").doc(databaseId).get();
  if (doc.exists) {
    const data = doc.data()!;
    if (data.workspaceId !== workspaceId) {
      return {
        ok: false,
        error: {
          success: false,
          error: "Database not found in this workspace",
        },
      };
    }
    return { ok: true, data, databaseId };
  }

  // Fallback: caller may have passed a page ID instead of database ID
  const byPage = await getDb()
    .collection("databases")
    .where("pageId", "==", databaseId)
    .limit(1)
    .get();

  if (byPage.empty) {
    return {
      ok: false,
      error: { success: false, error: "Database not found" },
    };
  }

  const dbDoc = byPage.docs[0];
  const data = dbDoc.data();
  if (data.workspaceId !== workspaceId) {
    return {
      ok: false,
      error: { success: false, error: "Database not found in this workspace" },
    };
  }
  return { ok: true, data, databaseId: dbDoc.id };
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "create_page":
        return await createPage(input, context);
      case "update_page":
        return await updatePage(input, context);
      case "delete_page":
        return await deletePage(input, context);
      case "create_database":
        return await createDatabase(input, context);
      case "add_database_property":
        return await addDatabaseProperty(input, context);
      case "create_database_row":
        return await createDatabaseRow(input, context);
      case "list_database_rows":
        return await listDatabaseRows(input, context);
      case "get_database_row":
        return await getDatabaseRow(input, context);
      case "update_database_row":
        return await updateDatabaseRow(input, context);
      case "delete_database_row":
        return await deleteDatabaseRow(input, context);
      case "search_pages":
        return await searchPages(input, context);
      case "list_pages":
        return await listPages(context);
      case "get_page_content":
        return await getPageContent(input, context);
      case "navigate_to_page":
        return navigateToPage(input);
      case "web_search":
        return await webSearch(input);
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Convert a simplified block (with `text` shorthand) to TipTap-compatible JSON.
 * MCP API accepts: { type: "paragraph", text: "Hello" }
 * TipTap expects:  { type: "paragraph", content: [{ type: "text", text: "Hello" }] }
 */
function normalizeTipTapBlock(
  block: Record<string, unknown>
): Record<string, unknown> {
  const { type, text, content, attrs, ...rest } = block;
  const result: Record<string, unknown> = { type, ...rest };

  if (attrs !== undefined) {
    result.attrs = attrs;
  }

  // If the block already has a content array, recurse into children
  if (Array.isArray(content)) {
    result.content = content.map((child) =>
      normalizeTipTapBlock(child as Record<string, unknown>)
    );
    return result;
  }

  // If there's a text shorthand, convert it to a proper content array
  if (typeof text === "string" && text.length > 0) {
    if (type === "blockquote") {
      // Blockquotes wrap text in a paragraph node
      result.content = [
        {
          type: "paragraph",
          content: [{ type: "text", text }],
        },
      ];
    } else {
      // Paragraphs, headings, codeBlocks, etc. wrap text in a text node
      result.content = [{ type: "text", text }];
    }
  }

  return result;
}

/**
 * Build a TipTap-compatible JSON document from an array of block objects.
 * If the input is already a full TipTap doc (has type "doc"), pass it through.
 * Otherwise normalize each block and wrap in the standard TipTap doc envelope.
 */
function buildTipTapContent(blocks: unknown[]): Record<string, unknown> {
  if (
    blocks.length === 1 &&
    (blocks[0] as Record<string, unknown>)?.type === "doc"
  ) {
    return blocks[0] as Record<string, unknown>;
  }
  const normalized = blocks.map((b) =>
    normalizeTipTapBlock(b as Record<string, unknown>)
  );
  return { type: "doc", content: normalized };
}

async function createPage(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const title = (input.title as string) || "Untitled";
  const parentId = (input.parentId as string) || null;
  const icon = (input.icon as string) || "";
  const description = (input.description as string) || "";

  // If nesting under a parent, verify it belongs to this workspace
  if (parentId) {
    const check = await verifyPageAccess(parentId, context.workspaceId);
    if (!check.ok) return check.error;
  }

  const pageData: Record<string, unknown> = {
    title,
    icon,
    coverImage: "",
    description,
    parentId,
    childOrder: [],
    type: "page",
    databaseId: null,
    isDbRow: false,
    parentDatabaseId: null,
    workspaceId: context.workspaceId,
    ownerId: context.userId,
    createdBy: context.userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isDeleted: false,
  };

  // Set body content if provided
  if (Array.isArray(input.content) && input.content.length > 0) {
    pageData.content = buildTipTapContent(input.content);
  }

  const docRef = await getDb().collection("pages").add(pageData);

  return {
    success: true,
    data: { pageId: docRef.id, title },
    action: { type: "navigate", pageId: docRef.id },
  };
}

async function updatePage(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const pageId = input.pageId as string;
  if (!pageId) return { success: false, error: "pageId is required" };

  const check = await verifyPageAccess(pageId, context.workspaceId);
  if (!check.ok) return check.error;

  const updates: Record<string, unknown> = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (input.title !== undefined) updates.title = input.title;
  if (input.icon !== undefined) updates.icon = input.icon;
  if (input.description !== undefined) updates.description = input.description;
  if (Array.isArray(input.content) && input.content.length > 0) {
    updates.content = buildTipTapContent(input.content);
  }

  await getDb().collection("pages").doc(pageId).update(updates);

  return { success: true, data: { pageId } };
}

async function deletePage(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const pageId = input.pageId as string;
  if (!pageId) return { success: false, error: "pageId is required" };

  const check = await verifyPageAccess(pageId, context.workspaceId);
  if (!check.ok) return check.error;

  await getDb().collection("pages").doc(pageId).update({
    isDeleted: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, data: { pageId } };
}

async function createDatabase(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const title = (input.title as string) || "Untitled Database";
  const titlePropId = uuidv4();

  // Create the page for the database
  const pageRef = await getDb().collection("pages").add({
    title,
    icon: "",
    coverImage: "",
    parentId: null,
    childOrder: [],
    type: "database",
    databaseId: null,
    isDbRow: false,
    parentDatabaseId: null,
    workspaceId: context.workspaceId,
    ownerId: context.userId,
    createdBy: context.userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isDeleted: false,
  });

  // Create the database document
  const dbRef = await getDb()
    .collection("databases")
    .add({
      pageId: pageRef.id,
      workspaceId: context.workspaceId,
      properties: {
        [titlePropId]: {
          id: titlePropId,
          name: "Name",
          type: "title",
        },
      },
      propertyOrder: [titlePropId],
      defaultViewId: null,
    });

  // Create default table view
  const viewRef = await getDb()
    .collection("dbViews")
    .add({
      databaseId: dbRef.id,
      workspaceId: context.workspaceId,
      name: "Table View",
      type: "table",
      config: {
        visibleProperties: [titlePropId],
        sorts: [],
        filters: [],
      },
    });

  // Link page -> database and database -> default view
  await getDb()
    .collection("pages")
    .doc(pageRef.id)
    .update({ databaseId: dbRef.id });
  await getDb()
    .collection("databases")
    .doc(dbRef.id)
    .update({ defaultViewId: viewRef.id, viewOrder: [viewRef.id] });

  return {
    success: true,
    data: {
      databaseId: dbRef.id,
      pageId: pageRef.id,
      viewId: viewRef.id,
      title,
    },
    action: { type: "navigate", pageId: pageRef.id },
  };
}

async function addDatabaseProperty(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const databaseId = input.databaseId as string;
  if (!databaseId) return { success: false, error: "databaseId is required" };

  const check = await verifyDatabaseAccess(databaseId, context.workspaceId);
  if (!check.ok) return check.error;

  const propertyId = uuidv4();
  const property: Record<string, unknown> = {
    id: propertyId,
    name: input.name as string,
    type: input.type as string,
  };

  if (input.options) {
    property.options = (
      input.options as Array<{ name: string; color: string }>
    ).map((opt) => ({
      id: uuidv4(),
      name: opt.name,
      color: opt.color || "default",
    }));
  }

  const currentOrder = (check.data.propertyOrder as string[]) || [];

  await getDb()
    .collection("databases")
    .doc(databaseId)
    .update({
      [`properties.${propertyId}`]: property,
      propertyOrder: [...currentOrder, propertyId],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return {
    success: true,
    data: { propertyId, name: input.name, type: input.type },
  };
}

async function createDatabaseRow(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const databaseId = input.databaseId as string;
  if (!databaseId) return { success: false, error: "databaseId is required" };

  const check = await verifyDatabaseAccess(databaseId, context.workspaceId);
  if (!check.ok) return check.error;

  const inputProperties = (input.properties as Record<string, unknown>) || {};

  // Resolve property names to IDs and option names to option IDs
  const dbProps = check.data.properties as Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >;
  const nameToProperty = new Map<
    string,
    {
      id: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >();
  for (const prop of Object.values(dbProps)) {
    nameToProperty.set(prop.name.toLowerCase(), {
      id: prop.id,
      type: prop.type,
      options: prop.options,
    });
  }

  const resolvedProperties: Record<string, unknown> = {};
  let pageTitle = "";
  const unknownKeys: string[] = [];

  for (const [key, value] of Object.entries(inputProperties)) {
    // Look up by name (case-insensitive), then by ID
    const propDef =
      nameToProperty.get(key.toLowerCase()) ||
      (dbProps[key]
        ? { id: key, type: dbProps[key].type, options: dbProps[key].options }
        : null);

    if (!propDef) {
      unknownKeys.push(key);
      continue;
    }

    if (propDef.type === "title") {
      pageTitle = (value as string) || "";
      // Dual-write: pages.title (source of truth) + dbRows.properties (views read this)
      resolvedProperties[propDef.id] = pageTitle;
    } else if (
      propDef.type === "select" &&
      typeof value === "string" &&
      propDef.options
    ) {
      const option = propDef.options.find(
        (o) => o.name.toLowerCase() === value.toLowerCase()
      );
      resolvedProperties[propDef.id] = option ? option.id : value;
    } else if (
      propDef.type === "multiSelect" &&
      Array.isArray(value) &&
      propDef.options
    ) {
      resolvedProperties[propDef.id] = value.map((v) => {
        const option = propDef.options!.find(
          (o) => o.name.toLowerCase() === (v as string).toLowerCase()
        );
        return option ? option.id : v;
      });
    } else {
      resolvedProperties[propDef.id] = value;
    }
  }

  // Create a page for the row
  const pageRef = await getDb().collection("pages").add({
    title: pageTitle,
    icon: "",
    coverImage: "",
    parentId: null,
    childOrder: [],
    type: "page",
    databaseId: null,
    isDbRow: true,
    parentDatabaseId: databaseId,
    workspaceId: context.workspaceId,
    ownerId: context.userId,
    createdBy: context.userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isDeleted: false,
  });

  // Create the row document
  const rowRef = await getDb().collection("dbRows").add({
    databaseId,
    pageId: pageRef.id,
    workspaceId: context.workspaceId,
    properties: resolvedProperties,
    createdBy: context.userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const resultData: Record<string, unknown> = {
    rowId: rowRef.id,
    pageId: pageRef.id,
  };
  if (unknownKeys.length > 0) {
    const validNames = Object.values(dbProps).map((p) => p.name);
    resultData.warnings = [
      `Unknown properties were ignored: ${unknownKeys.join(", ")}. Valid properties: ${validNames.join(", ")}`,
    ];
  }

  return {
    success: true,
    data: resultData,
  };
}

/**
 * Resolve raw property values (with IDs) to human-readable format using the
 * database schema. Returns an object keyed by property name with display values.
 */
function resolveRowProperties(
  rawProperties: Record<string, unknown>,
  dbProps: Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >
): Record<string, unknown> {
  const idToProperty = new Map<
    string,
    {
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >();
  for (const prop of Object.values(dbProps)) {
    idToProperty.set(prop.id, {
      name: prop.name,
      type: prop.type,
      options: prop.options,
    });
  }

  const resolved: Record<string, unknown> = {};
  for (const [propId, value] of Object.entries(rawProperties)) {
    const propDef = idToProperty.get(propId);
    if (!propDef) {
      resolved[propId] = value;
      continue;
    }

    if (
      propDef.type === "select" &&
      typeof value === "string" &&
      propDef.options
    ) {
      const option = propDef.options.find((o) => o.id === value);
      resolved[propDef.name] = option ? option.name : value;
    } else if (
      propDef.type === "multiSelect" &&
      Array.isArray(value) &&
      propDef.options
    ) {
      resolved[propDef.name] = value.map((v) => {
        const option = propDef.options!.find((o) => o.id === v);
        return option ? option.name : v;
      });
    } else {
      resolved[propDef.name] = value;
    }
  }

  return resolved;
}

/**
 * Apply a single filter condition to a resolved property value.
 * Returns true if the row matches the filter.
 */
function matchesFilter(
  resolvedProperties: Record<string, unknown>,
  filter: {
    property: string;
    equals?: unknown;
    contains?: string;
    greater_than?: number;
    less_than?: number;
  }
): boolean {
  const value = resolvedProperties[filter.property];

  if (filter.contains !== undefined) {
    // Substring match (case-insensitive) for string values
    if (typeof value !== "string") return false;
    return value.toLowerCase().includes(filter.contains.toLowerCase());
  }

  if (filter.equals !== undefined) {
    if (typeof value === "string" && typeof filter.equals === "string") {
      return value.toLowerCase() === filter.equals.toLowerCase();
    }
    // For multiSelect arrays, check if any option matches
    if (Array.isArray(value) && typeof filter.equals === "string") {
      return value.some(
        (v) =>
          typeof v === "string" &&
          v.toLowerCase() === (filter.equals as string).toLowerCase()
      );
    }
    return value === filter.equals;
  }

  if (filter.greater_than !== undefined) {
    if (typeof value !== "number") return false;
    return value > filter.greater_than;
  }

  if (filter.less_than !== undefined) {
    if (typeof value !== "number") return false;
    return value < filter.less_than;
  }

  // No condition provided — match all
  return true;
}

async function listDatabaseRows(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const databaseId = input.databaseId as string;
  if (!databaseId) return { success: false, error: "databaseId is required" };

  const check = await verifyDatabaseAccess(databaseId, context.workspaceId);
  if (!check.ok) return check.error;

  const limit = Math.min(Math.max((input.limit as number) || 50, 1), 200);
  const filter = input.filter as
    | {
        property: string;
        equals?: unknown;
        contains?: string;
        greater_than?: number;
        less_than?: number;
      }
    | undefined;

  const resolvedDbId = check.databaseId;

  // When filtering, fetch a larger batch since we'll discard non-matching rows
  const fetchLimit = filter ? 1000 : limit;

  const rowSnapshot = await getDb()
    .collection("dbRows")
    .where("databaseId", "==", resolvedDbId)
    .limit(fetchLimit)
    .get();

  const dbProps = check.data.properties as Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >;

  // Find the title property ID
  const titlePropId = Object.values(dbProps).find(
    (p) => p.type === "title"
  )?.id;
  const titlePropName = titlePropId
    ? (dbProps[titlePropId]?.name ?? "Name")
    : null;

  // Batch-fetch pages to get authoritative titles
  // Firestore getAll supports up to 100 refs at a time — batch in chunks
  const pageIds = rowSnapshot.docs
    .map((doc) => doc.data().pageId as string)
    .filter(Boolean);
  const pageMap = new Map<string, string>();
  for (let i = 0; i < pageIds.length; i += 100) {
    const chunk = pageIds.slice(i, i + 100);
    const pageRefs = chunk.map((id) => getDb().collection("pages").doc(id));
    const pageDocs = await getDb().getAll(...pageRefs);
    for (const pageDoc of pageDocs) {
      if (pageDoc.exists) {
        pageMap.set(pageDoc.id, (pageDoc.data()!.title as string) || "");
      }
    }
  }

  let rows = rowSnapshot.docs.map((doc) => {
    const d = doc.data();
    const rawProps = (d.properties as Record<string, unknown>) || {};
    const resolved = resolveRowProperties(rawProps, dbProps);
    // Inject authoritative title from page document
    if (titlePropName && d.pageId) {
      const pageTitle = pageMap.get(d.pageId as string);
      if (pageTitle !== undefined) {
        resolved[titlePropName] = pageTitle;
      }
    }
    return {
      rowId: doc.id,
      pageId: d.pageId,
      properties: resolved,
    };
  });

  // Apply filter if provided
  if (filter?.property) {
    rows = rows.filter((row) => matchesFilter(row.properties, filter));
  }

  // Apply limit after filtering
  rows = rows.slice(0, limit);

  return {
    success: true,
    data: {
      rows,
      count: rows.length,
      databaseId: resolvedDbId,
      ...(filter ? { filtered: true } : {}),
    },
  };
}

async function getDatabaseRow(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const rowId = input.rowId as string;
  if (!rowId) return { success: false, error: "rowId is required" };

  const rowDoc = await getDb().collection("dbRows").doc(rowId).get();
  if (!rowDoc.exists) return { success: false, error: "Row not found" };

  const rowData = rowDoc.data()!;

  // Verify workspace access via the database
  const check = await verifyDatabaseAccess(
    rowData.databaseId as string,
    context.workspaceId
  );
  if (!check.ok) return check.error;

  const dbProps = check.data.properties as Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >;
  const rawProps = (rowData.properties as Record<string, unknown>) || {};
  const resolved = resolveRowProperties(rawProps, dbProps);

  // Inject authoritative title from page document
  const titlePropId = Object.values(dbProps).find(
    (p) => p.type === "title"
  )?.id;
  if (titlePropId && rowData.pageId) {
    const pageDoc = await getDb()
      .collection("pages")
      .doc(rowData.pageId as string)
      .get();
    if (pageDoc.exists) {
      const titlePropName = dbProps[titlePropId]?.name ?? "Name";
      resolved[titlePropName] = (pageDoc.data()!.title as string) || "";
    }
  }

  return {
    success: true,
    data: {
      rowId,
      pageId: rowData.pageId,
      databaseId: rowData.databaseId,
      properties: resolved,
    },
  };
}

async function updateDatabaseRow(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const rowId = input.rowId as string;
  if (!rowId) return { success: false, error: "rowId is required" };

  const rowDoc = await getDb().collection("dbRows").doc(rowId).get();
  if (!rowDoc.exists) return { success: false, error: "Row not found" };

  const rowData = rowDoc.data()!;

  const check = await verifyDatabaseAccess(
    rowData.databaseId as string,
    context.workspaceId
  );
  if (!check.ok) return check.error;

  const inputProperties = (input.properties as Record<string, unknown>) || {};
  const dbProps = check.data.properties as Record<
    string,
    {
      id: string;
      name: string;
      type: string;
      options?: Array<{ id: string; name: string }>;
    }
  >;

  // Build name-to-property lookup
  const nameToProperty = new Map<
    string,
    { id: string; type: string; options?: Array<{ id: string; name: string }> }
  >();
  for (const prop of Object.values(dbProps)) {
    nameToProperty.set(prop.name.toLowerCase(), {
      id: prop.id,
      type: prop.type,
      options: prop.options,
    });
  }

  const currentProps = (rowData.properties as Record<string, unknown>) || {};
  const updatedProps = { ...currentProps };
  let pageTitle: string | undefined;
  let hasNonTitleChanges = false;
  const unknownKeys: string[] = [];

  for (const [key, value] of Object.entries(inputProperties)) {
    const propDef =
      nameToProperty.get(key.toLowerCase()) ||
      (dbProps[key]
        ? { id: key, type: dbProps[key].type, options: dbProps[key].options }
        : null);

    if (!propDef) {
      unknownKeys.push(key);
      continue;
    }

    if (propDef.type === "title") {
      pageTitle = (value as string) || "";
      // Dual-write: pages.title (source of truth) + dbRows.properties (views read this)
      updatedProps[propDef.id] = pageTitle;
      hasNonTitleChanges = true;
    } else if (
      propDef.type === "select" &&
      typeof value === "string" &&
      propDef.options
    ) {
      const option = propDef.options.find(
        (o) => o.name.toLowerCase() === value.toLowerCase()
      );
      updatedProps[propDef.id] = option ? option.id : value;
      hasNonTitleChanges = true;
    } else if (
      propDef.type === "multiSelect" &&
      Array.isArray(value) &&
      propDef.options
    ) {
      updatedProps[propDef.id] = value.map((v) => {
        const option = propDef.options!.find(
          (o) => o.name.toLowerCase() === (v as string).toLowerCase()
        );
        return option ? option.id : v;
      });
      hasNonTitleChanges = true;
    } else {
      updatedProps[propDef.id] = value;
      hasNonTitleChanges = true;
    }
  }

  // Update page title if the title property changed
  if (pageTitle !== undefined && rowData.pageId) {
    await getDb()
      .collection("pages")
      .doc(rowData.pageId as string)
      .update({
        title: pageTitle,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  // Only update dbRows if non-title properties changed
  if (hasNonTitleChanges) {
    await getDb().collection("dbRows").doc(rowId).update({
      properties: updatedProps,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const resultData: Record<string, unknown> = { rowId };
  if (unknownKeys.length > 0) {
    const validNames = Object.values(dbProps).map((p) => p.name);
    resultData.warnings = [
      `Unknown properties were ignored: ${unknownKeys.join(", ")}. Valid properties: ${validNames.join(", ")}`,
    ];
  }

  return { success: true, data: resultData };
}

async function deleteDatabaseRow(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const rowId = input.rowId as string;
  if (!rowId) return { success: false, error: "rowId is required" };

  const rowDoc = await getDb().collection("dbRows").doc(rowId).get();
  if (!rowDoc.exists) return { success: false, error: "Row not found" };

  const rowData = rowDoc.data()!;

  const check = await verifyDatabaseAccess(
    rowData.databaseId as string,
    context.workspaceId
  );
  if (!check.ok) return check.error;

  // Soft-delete the associated page
  if (rowData.pageId) {
    await getDb()
      .collection("pages")
      .doc(rowData.pageId as string)
      .update({
        isDeleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  // Delete the row document
  await getDb().collection("dbRows").doc(rowId).delete();

  return { success: true, data: { rowId } };
}

async function searchPages(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const query = ((input.query as string) || "").toLowerCase();

  // Firestore doesn't support full-text search, so we fetch workspace pages and filter
  const snapshot = await getDb()
    .collection("pages")
    .where("workspaceId", "==", context.workspaceId)
    .where("isDeleted", "==", false)
    .where("isDbRow", "==", false)
    .limit(100)
    .get();

  const results = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title as string,
        icon: (data.icon as string) || "",
        type: data.type as string,
        databaseId: (data.databaseId as string) || null,
      };
    })
    .filter((page) => page.title.toLowerCase().includes(query))
    .slice(0, 20);

  return { success: true, data: { pages: results, count: results.length } };
}

async function listPages(context: ToolContext): Promise<ToolResult> {
  const snapshot = await getDb()
    .collection("pages")
    .where("workspaceId", "==", context.workspaceId)
    .where("isDeleted", "==", false)
    .where("isDbRow", "==", false)
    .limit(100)
    .get();

  const pages = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title as string,
      icon: (data.icon as string) || "",
      type: data.type as string,
      databaseId: (data.databaseId as string) || null,
    };
  });

  return { success: true, data: { pages, count: pages.length } };
}

async function getPageContent(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const pageId = input.pageId as string;
  if (!pageId) return { success: false, error: "pageId is required" };

  const check = await verifyPageAccess(pageId, context.workspaceId);
  if (!check.ok) return check.error;

  const result: Record<string, unknown> = {
    id: pageId,
    title: check.data.title,
    icon: check.data.icon || "",
    type: check.data.type,
    description: check.data.description || "",
    parentId: check.data.parentId || null,
    isDeleted: check.data.isDeleted || false,
  };

  // Include body content if it exists
  if (check.data.content) {
    result.content = check.data.content;
  }

  return { success: true, data: result };
}

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveWebResults {
  web?: { results?: BraveSearchResult[] };
  infobox?: {
    results?: Array<{
      title: string;
      description: string;
      long_desc?: string;
      ratings?: Array<{ name: string; score: string }>;
    }>;
  };
}

async function webSearch(input: Record<string, unknown>): Promise<ToolResult> {
  const query = input.query as string;
  if (!query) return { success: false, error: "query is required" };

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Web search is not configured" };
  }

  const count = Math.min(Math.max((input.count as number) || 5, 1), 10);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Search failed: ${response.status} ${response.statusText}`,
    };
  }

  const data = (await response.json()) as BraveWebResults;

  const results: Array<{ title: string; url: string; snippet: string }> = [];

  // Extract infobox if present (rich data like ratings)
  let infobox: Record<string, unknown> | undefined;
  if (data.infobox?.results?.length) {
    const info = data.infobox.results[0];
    infobox = {
      title: info.title,
      description: info.description,
      longDescription: info.long_desc,
      ratings: info.ratings,
    };
  }

  // Extract web results
  if (data.web?.results) {
    for (const r of data.web.results) {
      results.push({
        title: r.title,
        url: r.url,
        snippet: r.description,
      });
    }
  }

  return {
    success: true,
    data: {
      query,
      results,
      resultCount: results.length,
      ...(infobox ? { infobox } : {}),
    },
  };
}

function navigateToPage(input: Record<string, unknown>): ToolResult {
  const pageId = input.pageId as string;
  if (!pageId) return { success: false, error: "pageId is required" };

  return {
    success: true,
    data: { pageId },
    action: { type: "navigate", pageId },
  };
}
