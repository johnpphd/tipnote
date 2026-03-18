import { useCallback } from "react";
import { usePage } from "./usePage";
import { savePageContent } from "@/lib/blocks/blockService";
import type { JSONContent } from "@tiptap/core";
import type { PageBrandId } from "@/types";

export function usePageContent(pageId: PageBrandId | undefined) {
  const { data: page, isLoading } = usePage(pageId);

  const content = (page as Record<string, unknown> | null)?.content as
    | JSONContent
    | null
    | undefined;

  const updateContent = useCallback(
    (newContent: JSONContent) => {
      if (!pageId) return;
      void savePageContent(pageId, newContent);
    },
    [pageId],
  );

  return {
    content: content ?? null,
    isLoading,
    updateContent,
  };
}
