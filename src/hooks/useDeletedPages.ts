import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  pagesCollection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "@/lib/firebase";
import type { Page } from "@/types";
import { type WorkspaceBrandId, parsePage } from "@/types";

export function useDeletedPages(workspaceId: WorkspaceBrandId | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const q = query(
      pagesCollection(),
      where("workspaceId", "==", workspaceId),
      where("isDeleted", "==", true),
      where("isDbRow", "==", false),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pages = snapshot.docs.map((doc) => parsePage(doc.id, doc.data()!));
      queryClient.setQueryData(["deletedPages", workspaceId], pages);
    });

    return unsubscribe;
  }, [workspaceId, queryClient]);

  return useQuery<Page[]>({
    queryKey: ["deletedPages", workspaceId],
    queryFn: () => [],
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}
