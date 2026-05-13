import { useCallback } from "react";
import { useSnackbar } from "notistack";
import { updatePage } from "@/lib/database/pages";
import { updateDatabaseRow } from "@/lib/database/databases";
import { uploadImage } from "@/lib/firebase";
import { Title, IconEmoji, ImageUrl } from "@/types";
import type { DatabaseRow, Page } from "@/types";

interface UsePageHeaderActionsArgs {
  page: Page;
  dbRow: DatabaseRow | null | undefined;
  titlePropId: string | undefined;
  description: string;
}

export function usePageHeaderActions({
  page,
  dbRow,
  titlePropId,
  description,
}: UsePageHeaderActionsArgs) {
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (trimmed !== page.title) {
        const newTitle = Title.parse(trimmed || "Untitled");
        void updatePage(page.id, { title: newTitle });

        if (dbRow && titlePropId) {
          void updateDatabaseRow(dbRow.id, { [titlePropId]: newTitle });
        }
      }
    },
    [page.title, page.id, dbRow, titlePropId],
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      void updatePage(page.id, { icon: IconEmoji.parse(emoji) });
    },
    [page.id],
  );

  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(page.workspaceId, page.id, file);
        await updatePage(page.id, { coverImage: ImageUrl.parse(url) });
      } catch {
        enqueueSnackbar("Failed to upload cover image", { variant: "error" });
      }
    },
    [page.workspaceId, page.id, enqueueSnackbar],
  );

  const handleRemoveCover = useCallback(() => {
    void updatePage(page.id, { coverImage: ImageUrl.parse("") });
  }, [page.id]);

  const handleDescriptionBlur = useCallback(() => {
    void updatePage(page.id, { description: Title.parse(description) });
  }, [page.id, description]);

  return {
    handleSave,
    handleEmojiSelect,
    handleCoverUpload,
    handleRemoveCover,
    handleDescriptionBlur,
  };
}
