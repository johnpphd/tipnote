import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageRef, databaseRef, onSnapshot, getDoc } from "@/lib/firebase";
import type { Page, ShareRole } from "@/types";
import { PageBrandId, type UserBrandId, parsePage } from "@/types";

interface SharedPageResult {
  page: Page | null;
  role: ShareRole | null;
  isEditor: boolean;
  isViewer: boolean;
  permissionDenied: boolean;
}

/**
 * Resolve the user's share role for a page.
 * For directly shared pages, reads from page.sharedWith.
 * For database row pages (isDbRow), inherits from the parent database's page.
 */
async function resolveShareRole(
  page: Page,
  uid: UserBrandId,
): Promise<ShareRole | null> {
  // Direct sharing check
  const directRole = page.sharedWith?.[uid]?.role ?? null;
  if (directRole) return directRole;

  // For row pages, inherit role from parent database's page
  if (page.isDbRow && page.parentDatabaseId) {
    try {
      const dbSnap = await getDoc(databaseRef(page.parentDatabaseId));
      if (!dbSnap.exists()) return null;
      const dbPageId = dbSnap.data().pageId as string;
      const parentPageSnap = await getDoc(pageRef(PageBrandId.parse(dbPageId)));
      if (!parentPageSnap.exists()) return null;
      const parentData = parentPageSnap.data();
      return (
        (parentData.sharedWith as Record<string, { role: ShareRole }>)?.[uid]
          ?.role ?? null
      );
    } catch {
      return null;
    }
  }

  return null;
}

export function useSharedPage(
  pageId: PageBrandId | undefined,
  uid: UserBrandId | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pageId || !uid) return;

    const ref = pageRef(pageId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          queryClient.setQueryData(["sharedPage", pageId, uid], {
            page: null,
            role: null,
            isEditor: false,
            isViewer: false,
            permissionDenied: false,
          });
          return;
        }

        const page = parsePage(snap.id, snap.data()!);

        void resolveShareRole(page, uid).then((role) => {
          queryClient.setQueryData(["sharedPage", pageId, uid], {
            page,
            role,
            isEditor: role === "editor",
            isViewer: role === "viewer",
            permissionDenied: false,
          });
        });
      },
      () => {
        // Permission denied or other error
        queryClient.setQueryData(["sharedPage", pageId, uid], {
          page: null,
          role: null,
          isEditor: false,
          isViewer: false,
          permissionDenied: true,
        });
      },
    );

    return unsubscribe;
  }, [pageId, uid, queryClient]);

  return useQuery<SharedPageResult>({
    queryKey: ["sharedPage", pageId, uid],
    queryFn: () => ({
      page: null,
      role: null,
      isEditor: false,
      isViewer: false,
      permissionDenied: false,
    }),
    enabled: !!pageId && !!uid,
    staleTime: Infinity,
  });
}
