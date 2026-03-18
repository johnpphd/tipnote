import { useMemo } from "react";
import { usePages } from "./usePages";
import type { Page } from "@/types";
import type { WorkspaceBrandId } from "@/types";

export function useBreadcrumbTrail(
  page: Page,
  workspaceId: WorkspaceBrandId,
): Page[] {
  const { data: pages } = usePages(workspaceId);

  return useMemo(() => {
    if (!pages) return [];
    const path: Page[] = [];
    let current = page;
    while (current.parentId) {
      const parent = pages.find((p) => p.id === current.parentId);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }
    return path;
  }, [page, pages]);
}
