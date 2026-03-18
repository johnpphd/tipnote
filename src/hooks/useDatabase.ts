import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { databaseRef, onSnapshot } from "@/lib/firebase";
import type { Database } from "@/types";
import { type DatabaseBrandId, parseDatabase } from "@/types";

export function useDatabase(databaseId: DatabaseBrandId | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!databaseId) return;

    const unsubscribe = onSnapshot(
      databaseRef(databaseId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = parseDatabase(snapshot.id, snapshot.data()!);
          queryClient.setQueryData(["database", databaseId], data);
        }
      },
      (error) => console.error("[useDatabase] Snapshot error:", error),
    );

    return unsubscribe;
  }, [databaseId, queryClient]);

  return useQuery<Database | null>({
    queryKey: ["database", databaseId],
    queryFn: () => null,
    enabled: !!databaseId,
    staleTime: Infinity,
  });
}
