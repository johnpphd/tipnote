import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  InputBase,
} from "@mui/material";
import {
  Description as PageIcon,
  TableChart as DatabaseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "@tanstack/react-router";
import { usePages } from "@/hooks/usePages";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { PageBrandId } from "@/types";

interface SearchDialogInnerProps {
  onClose: () => void;
}

/** Inner component remounts each time dialog opens, resetting state */
function SearchDialogInner({ onClose }: SearchDialogInnerProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { workspaceId } = useWorkspace();
  const { data: pages } = usePages(workspaceId ?? undefined);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!pages || !query.trim()) return pages?.slice(0, 10) ?? [];
    const lower = query.toLowerCase();
    return pages
      .filter((p) => p.title.toLowerCase().includes(lower))
      .slice(0, 10);
  }, [pages, query]);

  const handleSelect = useCallback(
    (pageId: PageBrandId) => {
      void navigate({ to: "/w/$pageId", params: { pageId } });
      onClose();
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex].id);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
        <InputBase
          autoFocus
          placeholder="Search pages..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{ flex: 1, fontSize: "16px" }}
        />
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            border: 1,
            borderColor: "divider",
            borderRadius: 0.5,
            px: 0.75,
            py: 0.25,
            fontSize: "10px",
          }}
        >
          ESC
        </Typography>
      </Box>

      <List sx={{ maxHeight: 400, overflowY: "auto", py: 0.5 }}>
        {results.length === 0 && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No results found
            </Typography>
          </Box>
        )}
        {results.map((page, index) => (
          <ListItemButton
            key={page.id}
            selected={index === selectedIndex}
            onClick={() => handleSelect(page.id)}
            sx={{ py: 0.75, px: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {page.icon ? (
                <Typography fontSize="16px">{page.icon}</Typography>
              ) : page.type === "database" ? (
                <DatabaseIcon
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
              ) : (
                <PageIcon fontSize="small" sx={{ color: "text.secondary" }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={page.title || "Untitled"}
              primaryTypographyProps={{
                variant: "body2",
                noWrap: true,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </>
  );
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchDialog({ open, onClose }: SearchDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: "fixed",
          top: "20%",
          m: 0,
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
        },
      }}
    >
      {open && <SearchDialogInner onClose={onClose} />}
    </Dialog>
  );
}
