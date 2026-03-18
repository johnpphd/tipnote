import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbRowsCollection, query, where, onSnapshot } from "@/lib/firebase";
import type { DatabaseRow } from "@/types";
import { type DatabaseBrandId, parseDatabaseRow } from "@/types";

export function useDatabaseRows(databaseId: DatabaseBrandId | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!databaseId) return;

    const q = query(dbRowsCollection(), where("databaseId", "==", databaseId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) =>
          parseDatabaseRow(doc.id, doc.data()!),
        );
        queryClient.setQueryData(["databaseRows", databaseId], rows);
      },
      (error) => console.error("[useDatabaseRows] Snapshot error:", error),
    );

    return unsubscribe;
  }, [databaseId, queryClient]);

  return useQuery<DatabaseRow[]>({
    queryKey: ["databaseRows", databaseId],
    queryFn: () => [],
    enabled: !!databaseId,
    staleTime: Infinity,
  });
}
