import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pagesCollection, query, where, onSnapshot } from "@/lib/firebase";
import type { Page } from "@/types";
import {
  type DatabaseBrandId,
  type WorkspaceBrandId,
  type PageBrandId,
  parsePage,
} from "@/types";

export function useDatabaseRowPages(
  databaseId: DatabaseBrandId | undefined,
  workspaceId: WorkspaceBrandId | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!databaseId || !workspaceId) return;

    const q = query(
      pagesCollection(),
      where("parentDatabaseId", "==", databaseId),
      where("workspaceId", "==", workspaceId),
      where("isDbRow", "==", true),
      where("isDeleted", "==", false),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pageMap = new Map<PageBrandId, Page>();
        for (const doc of snapshot.docs) {
          const page = parsePage(doc.id, doc.data()!);
          pageMap.set(page.id, page);
        }
        queryClient.setQueryData(["databaseRowPages", databaseId], pageMap);
      },
      (error) => console.error("[useDatabaseRowPages] Snapshot error:", error),
    );

    return unsubscribe;
  }, [databaseId, workspaceId, queryClient]);

  return useQuery<Map<PageBrandId, Page>>({
    queryKey: ["databaseRowPages", databaseId],
    queryFn: () => new Map(),
    enabled: !!databaseId && !!workspaceId,
    staleTime: Infinity,
  });
}
