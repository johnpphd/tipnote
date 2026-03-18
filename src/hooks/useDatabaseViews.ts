import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbViewsCollection, query, where, onSnapshot } from "@/lib/firebase";
import type { DatabaseView } from "@/types";
import { type DatabaseBrandId, parseDatabaseView } from "@/types";

export function useDatabaseViews(databaseId: DatabaseBrandId | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!databaseId) return;

    const q = query(dbViewsCollection(), where("databaseId", "==", databaseId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const views = snapshot.docs.map((doc) =>
          parseDatabaseView(doc.id, doc.data()!),
        );
        queryClient.setQueryData(["databaseViews", databaseId], views);
      },
      (error) => console.error("[useDatabaseViews] Snapshot error:", error),
    );

    return unsubscribe;
  }, [databaseId, queryClient]);

  return useQuery<DatabaseView[]>({
    queryKey: ["databaseViews", databaseId],
    queryFn: () => [],
    enabled: !!databaseId,
    staleTime: Infinity,
  });
}
