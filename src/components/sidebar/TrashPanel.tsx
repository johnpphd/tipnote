import { useCallback, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Description as PageIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";
import { useDeletedPages } from "@/hooks/useDeletedPages";
import { restorePage, permanentDeletePage } from "@/lib/database/pages";
import { SIDEBAR_WIDTH } from "./Sidebar";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { WorkspaceBrandId, PageBrandId } from "@/types";

interface TrashPanelProps {
  open: boolean;
  onClose: () => void;
  workspaceId: WorkspaceBrandId;
}

export default function TrashPanel({
  open,
  onClose,
  workspaceId,
}: TrashPanelProps) {
  const { data: deletedPages } = useDeletedPages(workspaceId);
  const [confirmDeleteId, setConfirmDeleteId] = useState<PageBrandId | null>(
    null,
  );
  const [loadingId, setLoadingId] = useState<PageBrandId | null>(null);

  const handleRestore = useCallback(
    async (e: React.MouseEvent, pageId: PageBrandId) => {
      e.stopPropagation();
      setLoadingId(pageId);
      try {
        await restorePage(pageId);
      } finally {
        setLoadingId(null);
      }
    },
    [],
  );

  const handlePermanentDelete = useCallback(
    async (e: React.MouseEvent, pageId: PageBrandId) => {
      e.stopPropagation();
      setLoadingId(pageId);
      try {
        await permanentDeletePage(pageId);
      } finally {
        setLoadingId(null);
      }
    },
    [],
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 300,
          ml: `${SIDEBAR_WIDTH}px`,
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, fontSize: "14px" }}
        >
          Trash
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "12px", mt: 0.5 }}
        >
          Pages in trash can be restored or permanently deleted.
        </Typography>
      </Box>

      <List dense>
        {(!deletedPages || deletedPages.length === 0) && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Trash is empty
            </Typography>
          </Box>
        )}
        {deletedPages?.map((page) => (
          <ListItemButton key={page.id} sx={{ py: 0.5, px: 2 }}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {page.icon ? (
                <Typography fontSize="14px">{page.icon}</Typography>
              ) : (
                <PageIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={page.title || "Untitled"}
              primaryTypographyProps={{
                variant: "body2",
                noWrap: true,
                sx: { fontSize: "13px" },
              }}
            />
            <IconButton
              size="small"
              aria-label="Restore page"
              disabled={loadingId === page.id}
              onClick={(e) => void handleRestore(e, page.id)}
            >
              {loadingId === page.id ? (
                <CircularProgress size={16} />
              ) : (
                <RestoreIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete permanently"
              disabled={loadingId === page.id}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteId(page.id);
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteForeverIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </ListItemButton>
        ))}
      </List>

      <Dialog
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
      >
        <DialogTitle
          sx={{ fontSize: "14px", fontWeight: FONT_WEIGHT_SEMIBOLD }}
        >
          Delete permanently?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "13px" }}>
            This page will be permanently deleted. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} size="small">
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              if (confirmDeleteId)
                void handlePermanentDelete(
                  e as unknown as React.MouseEvent,
                  confirmDeleteId,
                );
              setConfirmDeleteId(null);
            }}
            color="error"
            variant="contained"
            size="small"
          >
            Delete forever
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
