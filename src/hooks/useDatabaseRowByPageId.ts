import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbRowsCollection, query, where, onSnapshot } from "@/lib/firebase";
import type { DatabaseRow } from "@/types";
import {
  type PageBrandId,
  type DatabaseBrandId,
  parseDatabaseRow,
} from "@/types";

export function useDatabaseRowByPageId(
  pageId: PageBrandId | undefined,
  databaseId: DatabaseBrandId | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pageId || !databaseId) return;

    const q = query(
      dbRowsCollection(),
      where("pageId", "==", pageId),
      where("databaseId", "==", databaseId),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const row =
          snapshot.docs.length > 0
            ? parseDatabaseRow(snapshot.docs[0].id, snapshot.docs[0].data()!)
            : null;
        queryClient.setQueryData(["databaseRowByPageId", pageId], row);
      },
      (error) =>
        console.error("[useDatabaseRowByPageId] Snapshot error:", error),
    );

    return unsubscribe;
  }, [pageId, databaseId, queryClient]);

  return useQuery<DatabaseRow | null>({
    queryKey: ["databaseRowByPageId", pageId],
    queryFn: () => null,
    enabled: !!pageId && !!databaseId,
    staleTime: Infinity,
  });
}
