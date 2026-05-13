import { useMemo } from "react";
import { usePages } from "@/hooks/usePages";
import { useSharedPages } from "@/hooks/useSharedPages";
import { UserBrandId, type WorkspaceBrandId } from "@/types";

export function useSidebarData(
  workspaceId: WorkspaceBrandId,
  userUid: string | undefined,
) {
  const { data: pages } = usePages(workspaceId);
  const { data: sharedPages } = useSharedPages(
    userUid ? UserBrandId.parse(userUid) : undefined,
  );

  const rootPages = useMemo(() => {
    const allPages = pages ?? [];
    return allPages.filter((p) => !p.parentId);
  }, [pages]);

  return { pages, sharedPages, rootPages };
}
