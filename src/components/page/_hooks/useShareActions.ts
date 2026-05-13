import { useCallback } from "react";
import { useSnackbar } from "notistack";
import {
  publishPage,
  unpublishPage,
  sharePageWithUser,
  updateShareRole,
  removePageShare,
} from "@/lib/database/sharing";
import { findUserByEmail } from "@/lib/database/userProfiles";
import type { Page, ShareRole, ShareToken, Workspace } from "@/types";
import { UserBrandId } from "@/types";
import type { User } from "firebase/auth";

interface UseShareActionsArgs {
  user: User | null;
  workspace: Workspace | null | undefined;
  page: Page;
  isPublished: boolean;
  shareToken: ShareToken | undefined;
  shareUrl: string | null;
  sharedWith: Record<string, { role: ShareRole } | undefined>;
  email: string;
  inviteRole: ShareRole;
  setPublishLoading: (v: boolean) => void;
  setCopied: (v: boolean) => void;
  setEmail: (v: string) => void;
  setInviteLoading: (v: boolean) => void;
  setInviteError: (v: string) => void;
}

export function useShareActions({
  user,
  workspace,
  page,
  isPublished,
  shareToken,
  shareUrl,
  sharedWith,
  email,
  inviteRole,
  setPublishLoading,
  setCopied,
  setEmail,
  setInviteLoading,
  setInviteError,
}: UseShareActionsArgs) {
  const { enqueueSnackbar } = useSnackbar();

  const handleTogglePublish = useCallback(async () => {
    if (!user) return;
    setPublishLoading(true);
    try {
      if (isPublished && shareToken) {
        await unpublishPage(page.id, shareToken);
        enqueueSnackbar("Page unpublished", { variant: "info" });
      } else {
        await publishPage(page.id, UserBrandId.parse(user.uid));
        enqueueSnackbar("Page published to web", { variant: "success" });
      }
    } catch {
      enqueueSnackbar("Failed to update sharing settings", {
        variant: "error",
      });
    } finally {
      setPublishLoading(false);
    }
  }, [
    user,
    isPublished,
    shareToken,
    page.id,
    enqueueSnackbar,
    setPublishLoading,
  ]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    enqueueSnackbar("Link copied to clipboard", { variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, enqueueSnackbar, setCopied]);

  const handleInvite = useCallback(async () => {
    if (!user || !email.trim()) return;
    setInviteError("");
    setInviteLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedEmail === user.email?.toLowerCase()) {
        setInviteError("You can't share with yourself");
        setInviteLoading(false);
        return;
      }

      const targetUser = await findUserByEmail(trimmedEmail);
      if (!targetUser) {
        setInviteError("No user found with that email");
        setInviteLoading(false);
        return;
      }

      const memberIds = workspace?.memberIds ?? [];
      if (memberIds.includes(targetUser.uid)) {
        setInviteError("Already a workspace member");
        setInviteLoading(false);
        return;
      }

      if (sharedWith[targetUser.uid]) {
        setInviteError("Already shared with this user");
        setInviteLoading(false);
        return;
      }

      await sharePageWithUser(
        page.id,
        targetUser.uid,
        inviteRole,
        UserBrandId.parse(user.uid),
      );

      setEmail("");
      enqueueSnackbar(
        `Shared with ${targetUser.displayName || targetUser.email}`,
        {
          variant: "success",
        },
      );
    } catch {
      enqueueSnackbar("Failed to share page", { variant: "error" });
    } finally {
      setInviteLoading(false);
    }
  }, [
    user,
    email,
    workspace,
    sharedWith,
    page.id,
    inviteRole,
    enqueueSnackbar,
    setEmail,
    setInviteError,
    setInviteLoading,
  ]);

  const handleRoleChange = useCallback(
    async (targetUid: UserBrandId | undefined, newRole: ShareRole) => {
      try {
        await updateShareRole(page.id, targetUid, newRole);
      } catch {
        enqueueSnackbar("Failed to update role", { variant: "error" });
      }
    },
    [page.id, enqueueSnackbar],
  );

  const handleRemoveShare = useCallback(
    async (targetUid: UserBrandId | undefined) => {
      try {
        await removePageShare(page.id, targetUid);
        enqueueSnackbar("Access removed", { variant: "info" });
      } catch {
        enqueueSnackbar("Failed to remove access", { variant: "error" });
      }
    },
    [page.id, enqueueSnackbar],
  );

  return {
    handleTogglePublish,
    handleCopy,
    handleInvite,
    handleRoleChange,
    handleRemoveShare,
  };
}
