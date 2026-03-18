import { useState } from "react";
import { Box, Typography, IconButton, Button, Tooltip } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ChevronRight as ChevronRightIcon,
  StarBorder as FavoriteIcon,
  MoreHoriz as ActionsIcon,
} from "@mui/icons-material";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { sidebarOpenAtom } from "@/atoms/workspace";
import { useBreadcrumbTrail } from "@/hooks/useBreadcrumbTrail";
import { useDatabase } from "@/hooks/useDatabase";
import ShareDialog from "./ShareDialog";
import type { Page } from "@/types";
import { FONT_WEIGHT_REGULAR, FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

interface TopBarProps {
  page: Page;
}

export default function TopBar({ page }: TopBarProps) {
  const navigate = useNavigate();
  const sidebarOpen = useAtomValue(sidebarOpenAtom);
  const trail = useBreadcrumbTrail(page, page.workspaceId);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: parentDatabase } = useDatabase(
    page.isDbRow ? (page.parentDatabaseId ?? undefined) : undefined,
  );
  const backPageId = page.parentId ?? parentDatabase?.pageId ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: { xs: 1, sm: 2 },
        pl: sidebarOpen ? { xs: 1, sm: 2 } : { xs: 6, sm: 6 },
        py: 0.5,
        minHeight: 44,
        boxShadow: "0 1px 6px rgba(0, 0, 0, 0.06)",
        bgcolor: "background.default",
        position: "sticky",
        top: 0,
        zIndex: 10,
        transition: "padding-left 225ms cubic-bezier(0, 0, 0.2, 1)",
      }}
    >
      {/* Back button -- shown when page has a parent or is a DB row */}
      {backPageId && (
        <Tooltip
          title={
            page.isDbRow ? "Back to parent database" : "Back to parent page"
          }
        >
          <IconButton
            size="small"
            aria-label={
              page.isDbRow
                ? "Go back to parent database"
                : "Go back to parent page"
            }
            onClick={() =>
              navigate({
                to: "/w/$pageId",
                params: { pageId: backPageId },
              })
            }
            sx={{ p: 0.5, mr: 0.5, flexShrink: 0 }}
          >
            <ArrowBackIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Breadcrumb trail */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          flex: 1,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {trail.map((ancestor, i) => (
          <Box
            key={ancestor.id}
            sx={{
              display: {
                xs: i < trail.length - 1 ? "none" : "flex",
                sm: "flex",
              },
              alignItems: "center",
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            <Typography
              component="button"
              onClick={() =>
                navigate({
                  to: "/w/$pageId",
                  params: { pageId: ancestor.id },
                })
              }
              sx={{
                fontSize: "13px",
                color: "text.secondary",
                cursor: "pointer",
                border: "none",
                background: "none",
                p: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                "&:hover": { color: "text.primary" },
              }}
            >
              {ancestor.icon && (
                <Typography component="span" sx={{ fontSize: "13px", mr: 0.5 }}>
                  {ancestor.icon}
                </Typography>
              )}
              {ancestor.title || "Untitled"}
            </Typography>
            <ChevronRightIcon
              sx={{
                fontSize: 14,
                color: "text.secondary",
                mx: 0.25,
                flexShrink: 0,
              }}
            />
          </Box>
        ))}

        {/* Current page title */}
        <Typography
          noWrap
          sx={{
            fontSize: "13px",
            color: trail.length > 0 ? "text.primary" : "text.secondary",
            fontWeight:
              trail.length > 0 ? FONT_WEIGHT_MEDIUM : FONT_WEIGHT_REGULAR,
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {page.icon && (
            <Typography component="span" sx={{ fontSize: "13px", mr: 0.5 }}>
              {page.icon}
            </Typography>
          )}
          {page.title || "Untitled"}
        </Typography>
      </Box>

      {/* Right-side actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
        <Button
          size="small"
          onClick={() => setShareOpen(true)}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            fontSize: "12px",
            color: "primary.main",
            textTransform: "none",
            minWidth: "auto",
            px: 1,
          }}
        >
          Share
        </Button>
        <Tooltip title="Coming soon">
          <IconButton
            size="small"
            aria-label="Favorite"
            onClick={() => {}}
            sx={{ p: 0.5 }}
          >
            <FavoriteIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Coming soon">
          <IconButton
            size="small"
            aria-label="More actions"
            onClick={() => {}}
            sx={{ p: 0.5 }}
          >
            <ActionsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </IconButton>
        </Tooltip>
      </Box>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        page={page}
      />
    </Box>
  );
}
