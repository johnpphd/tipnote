import { useQuery } from "@tanstack/react-query";
import { pageRef, getDoc } from "@/lib/firebase";
import type { Page } from "@/types";
import { type PageBrandId, parsePage } from "@/types";

export function usePublishedPage(pageId: PageBrandId | undefined) {
  return useQuery<Page | null>({
    queryKey: ["publishedPage", pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const snap = await getDoc(pageRef(pageId));
      if (!snap.exists()) return null;
      const page = parsePage(snap.id, snap.data()!);
      if (!page.isPublished) return null;
      return page;
    },
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000,
  });
}
