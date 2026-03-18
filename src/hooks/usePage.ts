import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageRef, onSnapshot, getDoc } from "@/lib/firebase";
import type { Page } from "@/types";
import { type PageBrandId, parsePage } from "@/types";

export function usePage(pageId: PageBrandId | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pageId) return;

    const unsubscribe = onSnapshot(
      pageRef(pageId),
      (doc) => {
        if (doc.exists()) {
          const page = parsePage(doc.id, doc.data()!);
          queryClient.setQueryData(["page", pageId], page);
        }
      },
      (error) => console.error("[usePage] Snapshot error:", error),
    );

    return unsubscribe;
  }, [pageId, queryClient]);

  return useQuery<Page | null>({
    queryKey: ["page", pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const doc = await getDoc(pageRef(pageId));
      return doc.exists() ? parsePage(doc.id, doc.data()!) : null;
    },
    enabled: !!pageId,
    staleTime: Infinity,
  });
}
