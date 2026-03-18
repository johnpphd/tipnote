import * as admin from "firebase-admin";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function getDb() {
  return admin.firestore();
}

function getWorkspaceId(extra: {
  authInfo?: { extra?: Record<string, unknown> };
}): string | null {
  return (extra.authInfo?.extra?.workspaceId as string) || null;
}

function noWorkspaceError(uri: string) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json" as const,
        text: JSON.stringify({ error: "No workspace context" }),
      },
    ],
  };
}

/**
 * Registers MCP resources that expose workspace structure.
 */
export function registerMcpResources(server: McpServer): void {
  // Resource: current workspace info
  server.resource(
    "workspace",
    "notion://workspace",
    { description: "Current workspace information" },
    async (_uri, extra) => {
      const workspaceId = getWorkspaceId(extra);
      if (!workspaceId) return noWorkspaceError("notion://workspace");

      const doc = await getDb().collection("workspaces").doc(workspaceId).get();
      const data = doc.data();

      return {
        contents: [
          {
            uri: "notion://workspace",
            mimeType: "application/json",
            text: JSON.stringify({
              id: workspaceId,
              name: data?.name || "Workspace",
              icon: data?.icon || "",
              memberCount: (data?.memberIds as string[])?.length || 0,
            }),
          },
        ],
      };
    }
  );

  // Resource: all pages (flat list)
  server.resource(
    "pages",
    "notion://pages",
    { description: "All pages in the workspace (not database rows)" },
    async (_uri, extra) => {
      const workspaceId = getWorkspaceId(extra);
      if (!workspaceId) return noWorkspaceError("notion://pages");

      const snapshot = await getDb()
        .collection("pages")
        .where("workspaceId", "==", workspaceId)
        .where("isDeleted", "==", false)
        .where("isDbRow", "==", false)
        .limit(200)
        .get();

      const pages = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title || "Untitled",
          icon: d.icon || "",
          type: d.type || "page",
          parentId: d.parentId || null,
          description: d.description || "",
        };
      });

      return {
        contents: [
          {
            uri: "notion://pages",
            mimeType: "application/json",
            text: JSON.stringify({ pages, count: pages.length }),
          },
        ],
      };
    }
  );

  // Resource: all databases with schemas
  server.resource(
    "databases",
    "notion://databases",
    { description: "All databases with their property schemas" },
    async (_uri, extra) => {
      const workspaceId = getWorkspaceId(extra);
      if (!workspaceId) return noWorkspaceError("notion://databases");

      const dbSnapshot = await getDb()
        .collection("databases")
        .where("workspaceId", "==", workspaceId)
        .limit(50)
        .get();

      const databases = await Promise.all(
        dbSnapshot.docs.map(async (doc) => {
          const d = doc.data();

          // Get the database page title
          let title = "Untitled Database";
          if (d.pageId) {
            const pageDoc = await getDb()
              .collection("pages")
              .doc(d.pageId as string)
              .get();
            if (pageDoc.exists) {
              title = (pageDoc.data()?.title as string) || title;
            }
          }

          // Count rows
          const rowCount = await getDb()
            .collection("dbRows")
            .where("databaseId", "==", doc.id)
            .count()
            .get();

          // Extract property schema
          const properties = d.properties as Record<
            string,
            { id: string; name: string; type: string }
          >;
          const propertyList = Object.values(properties || {}).map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
          }));

          return {
            id: doc.id,
            pageId: d.pageId,
            title,
            properties: propertyList,
            propertyOrder: d.propertyOrder || [],
            rowCount: rowCount.data().count,
          };
        })
      );

      return {
        contents: [
          {
            uri: "notion://databases",
            mimeType: "application/json",
            text: JSON.stringify({
              databases,
              count: databases.length,
            }),
          },
        ],
      };
    }
  );
}
