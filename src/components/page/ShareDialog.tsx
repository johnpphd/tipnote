import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Switch,
  IconButton,
  CircularProgress,
  Avatar,
  Select,
  MenuItem,
  Divider,
  Button,
  TextField,
} from "@mui/material";
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Public as PublicIcon,
  PersonRemove as RemoveIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import {
  publishPage,
  unpublishPage,
  sharePageWithUser,
  updateShareRole,
  removePageShare,
} from "@/lib/database/sharing";
import { findUserByEmail } from "@/lib/database/userProfiles";
import type { Page, ShareRole } from "@/types";
import { UserBrandId } from "@/types";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { FONT_MONO } from "@/theme/createTipnoteTheme";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  page: Page;
}

export default function ShareDialog({ open, onClose, page }: ShareDialogProps) {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { enqueueSnackbar } = useSnackbar();
  const [publishLoading, setPublishLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ShareRole>("viewer");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const isPublished = page.isPublished ?? false;
  const shareToken = page.shareToken;
  const sharedWith = useMemo(() => page.sharedWith ?? {}, [page.sharedWith]);
  const sharedUids = useMemo(() => Object.keys(sharedWith), [sharedWith]);

  const { data: sharedProfiles } = useUserProfiles(
    sharedUids.map((uid) => UserBrandId.parse(uid)),
  );

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

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
  }, [user, isPublished, shareToken, page.id, enqueueSnackbar]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    enqueueSnackbar("Link copied to clipboard", { variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, enqueueSnackbar]);

  const handleInvite = useCallback(async () => {
    if (!user || !email.trim()) return;
    setInviteError("");
    setInviteLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate not self
      if (trimmedEmail === user.email?.toLowerCase()) {
        setInviteError("You can't share with yourself");
        setInviteLoading(false);
        return;
      }

      // Find user by email
      const targetUser = await findUserByEmail(trimmedEmail);
      if (!targetUser) {
        setInviteError("No user found with that email");
        setInviteLoading(false);
        return;
      }

      // Check if already a workspace member
      const memberIds = workspace?.memberIds ?? [];
      if (memberIds.includes(targetUser.uid)) {
        setInviteError("Already a workspace member");
        setInviteLoading(false);
        return;
      }

      // Check if already shared
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
  ]);

  const handleRoleChange = useCallback(
    async (targetUid: UserBrandId, newRole: ShareRole) => {
      try {
        await updateShareRole(page.id, targetUid, newRole);
      } catch {
        enqueueSnackbar("Failed to update role", { variant: "error" });
      }
    },
    [page.id, enqueueSnackbar],
  );

  const handleRemoveShare = useCallback(
    async (targetUid: UserBrandId) => {
      try {
        await removePageShare(page.id, targetUid);
        enqueueSnackbar("Access removed", { variant: "info" });
      } catch {
        enqueueSnackbar("Failed to remove access", { variant: "error" });
      }
    },
    [page.id, enqueueSnackbar],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          borderRadius: 2,
          maxWidth: 480,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2,
        }}
      >
        <Typography sx={{ fontSize: "14px", fontWeight: FONT_WEIGHT_SEMIBOLD }}>
          Share
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pb: 2.5 }}>
        {/* Invite by email */}
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setInviteError("");
            }}
            placeholder="Enter email to invite"
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleInvite();
            }}
            sx={{ flex: 1 }}
          />
          <Select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as ShareRole)}
            size="small"
            sx={{ minWidth: 100, fontSize: "13px" }}
          >
            <MenuItem value="viewer">Viewer</MenuItem>
            <MenuItem value="editor">Editor</MenuItem>
          </Select>
          <Button
            variant="contained"
            size="small"
            onClick={() => void handleInvite()}
            disabled={inviteLoading || !email.trim()}
            sx={{ textTransform: "none", fontSize: "13px", minWidth: 64 }}
          >
            {inviteLoading ? <CircularProgress size={16} /> : "Invite"}
          </Button>
        </Box>

        {inviteError && (
          <Typography sx={{ fontSize: "12px", color: "error.main", mb: 1 }}>
            {inviteError}
          </Typography>
        )}

        {/* Shared users list */}
        {sharedUids.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: FONT_WEIGHT_SEMIBOLD,
                color: "text.secondary",
                mb: 0.5,
                mt: 1,
              }}
            >
              People with access
            </Typography>
            {sharedUids.map((uid) => {
              const brandedUid = UserBrandId.parse(uid);
              const profile = sharedProfiles?.find((p) => p.uid === brandedUid);
              const entry = sharedWith[brandedUid];
              return (
                <Box
                  key={uid}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 0.75,
                    gap: 1,
                  }}
                >
                  <Avatar
                    src={profile?.photoURL}
                    sx={{ width: 28, height: 28, fontSize: "13px" }}
                  >
                    {(profile?.displayName || profile?.email || "?").charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_MEDIUM }}
                    >
                      {profile?.displayName || profile?.email || uid}
                    </Typography>
                    {profile?.displayName && profile.email && (
                      <Typography
                        noWrap
                        sx={{ fontSize: "11px", color: "text.secondary" }}
                      >
                        {profile.email}
                      </Typography>
                    )}
                  </Box>
                  <Select
                    value={entry.role}
                    onChange={(e) =>
                      void handleRoleChange(
                        brandedUid,
                        e.target.value as ShareRole,
                      )
                    }
                    size="small"
                    sx={{ fontSize: "12px", minWidth: 90 }}
                  >
                    <MenuItem value="viewer">Viewer</MenuItem>
                    <MenuItem value="editor">Editor</MenuItem>
                  </Select>
                  <IconButton
                    size="small"
                    aria-label="Remove access"
                    onClick={() => void handleRemoveShare(brandedUid)}
                    sx={{ p: 0.5 }}
                  >
                    <RemoveIcon
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Publish toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PublicIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            <Box>
              <Typography
                sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_MEDIUM }}
              >
                Publish to web
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                {isPublished
                  ? "Anyone with the link can view"
                  : "Create a public link for anyone to view"}
              </Typography>
            </Box>
          </Box>
          {publishLoading ? (
            <CircularProgress size={20} />
          ) : (
            <Switch
              checked={isPublished}
              onChange={() => void handleTogglePublish()}
              size="small"
            />
          )}
        </Box>

        {/* Share URL */}
        {isPublished && shareUrl && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              noWrap
              sx={{
                flex: 1,
                fontSize: "12px",
                color: "text.secondary",
                fontFamily: FONT_MONO,
              }}
            >
              {shareUrl}
            </Typography>
            <IconButton
              size="small"
              onClick={() => void handleCopy()}
              sx={{ p: 0.5, flexShrink: 0 }}
            >
              {copied ? (
                <CheckIcon sx={{ fontSize: 16, color: "success.main" }} />
              ) : (
                <CopyIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
