import { useState, useCallback, memo } from "react";
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Collapse,
} from "@mui/material";
import {
  Description as PageIcon,
  TableChart as DatabaseIcon,
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useNavigate } from "@tanstack/react-router";
import { softDeletePage } from "@/lib/database/pages";
import type { Page } from "@/types";
import { FONT_WEIGHT_REGULAR, FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

interface PageTreeItemProps {
  page: Page;
  pages: Page[];
  currentPageId: string | undefined;
  depth: number;
}

function PageTreeItem({
  page,
  pages,
  currentPageId,
  depth,
}: PageTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const children = pages.filter((p) => p.parentId === page.id);
  const hasChildren = children.length > 0;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const handleClick = useCallback(() => {
    void navigate({ to: "/w/$pageId", params: { pageId: page.id } });
  }, [navigate, page.id]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await softDeletePage(page.id);
      if (currentPageId === page.id) {
        void navigate({ to: "/w" });
      }
    },
    [page.id, currentPageId, navigate],
  );

  return (
    <Box role="treeitem" aria-expanded={hasChildren ? expanded : undefined}>
      <ListItemButton
        selected={currentPageId === page.id}
        onClick={handleClick}
        sx={{
          borderRadius: "12px",
          mx: 0,
          mb: 0.25,
          py: 0.5,
          pl: 0.5 + depth * 1.5,
          minHeight: { xs: 44, md: 32 },
          "&.Mui-selected": {
            bgcolor: "action.selected",
            "&:hover": { bgcolor: "action.selected" },
          },
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {hasChildren && (
          <IconButton
            size="small"
            aria-label={expanded ? "Collapse" : "Expand"}
            onClick={handleToggle}
            sx={{
              width: { xs: 44, md: 28 },
              height: { xs: 44, md: 28 },
              minWidth: { xs: 44, md: 28 },
              minHeight: { xs: 44, md: 28 },
              mr: 0.5,
            }}
          >
            {expanded ? (
              <ExpandMoreIcon sx={{ fontSize: 14 }} />
            ) : (
              <ChevronRightIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        )}
        <ListItemIcon sx={{ minWidth: 24 }}>
          {page.icon ? (
            <Typography fontSize="14px">{page.icon}</Typography>
          ) : page.type === "database" ? (
            <DatabaseIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          ) : (
            <PageIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={page.title || "Untitled"}
          primaryTypographyProps={{
            variant: "body2",
            noWrap: true,
            sx: {
              fontSize: "13px",
              fontWeight:
                currentPageId === page.id
                  ? FONT_WEIGHT_MEDIUM
                  : FONT_WEIGHT_REGULAR,
            },
          }}
        />
        <IconButton
          size="small"
          aria-label="Delete page"
          onClick={(e) => void handleDelete(e)}
          sx={{
            opacity: 0,
            width: { xs: 44, md: 28 },
            height: { xs: 44, md: 28 },
            minWidth: { xs: 44, md: 28 },
            minHeight: { xs: 44, md: 28 },
            ".MuiListItemButton-root:hover &, .MuiListItemButton-root:focus-within &":
              { opacity: 0.6 },
          }}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </ListItemButton>

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {children.map((child) => (
            <MemoizedPageTreeItem
              key={child.id}
              page={child}
              pages={pages}
              currentPageId={currentPageId}
              depth={depth + 1}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

const MemoizedPageTreeItem = memo(PageTreeItem);
export default MemoizedPageTreeItem;
