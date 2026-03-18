import { useState, useMemo } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Description as PageIcon,
  TableChart as DatabaseIcon,
  Delete as TrashIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  PeopleOutline as PeopleIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { usePages } from "@/hooks/usePages";
import { useSharedPages } from "@/hooks/useSharedPages";
import { useAuth } from "@/hooks/useAuth";
import { createPage } from "@/lib/database/pages";
import { createDatabase } from "@/lib/database/databases";
import { useAtom } from "jotai";
import { sidebarOpenAtom, themeModeAtom } from "@/atoms/workspace";
import { useDragResize } from "@/hooks/useDragResize";
import PageTreeItem from "./PageTreeItem";
import TrashPanel from "./TrashPanel";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { UserBrandId, Title, type WorkspaceBrandId } from "@/types";

export const SIDEBAR_WIDTH = 240;

interface SidebarProps {
  workspaceId: WorkspaceBrandId;
  onSearchClick?: () => void;
}

export default function Sidebar({ workspaceId, onSearchClick }: SidebarProps) {
  const [open, setOpen] = useAtom(sidebarOpenAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const { user } = useAuth();
  const { data: pages } = usePages(workspaceId);
  const { data: sharedPages } = useSharedPages(
    user?.uid ? UserBrandId.parse(user.uid) : undefined,
  );
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const currentPageId = (params as Record<string, string | undefined>).pageId;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { ratio, isDragging, containerRef, onDividerMouseDown } =
    useDragResize();

  const hasSharedPages = Boolean(sharedPages && sharedPages.length > 0);

  const rootPages = useMemo(() => {
    const allPages = pages ?? [];
    return allPages.filter((p) => !p.parentId);
  }, [pages]);

  const handleCreatePage = async () => {
    if (!user) return;
    const pageId = await createPage(workspaceId, UserBrandId.parse(user.uid), {
      title: Title.parse("Untitled"),
      type: "page",
    });
    void navigate({ to: "/w/$pageId", params: { pageId } });
    setAddMenuAnchor(null);
  };

  const handleCreateDatabase = async () => {
    if (!user) return;
    const { pageId } = await createDatabase(
      workspaceId,
      UserBrandId.parse(user.uid),
      "Untitled Database",
    );
    void navigate({ to: "/w/$pageId", params: { pageId } });
    setAddMenuAnchor(null);
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        width: open && !isMobile ? SIDEBAR_WIDTH : 0,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Workspace header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          minHeight: 44,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
            }}
          >
            {user?.displayName?.charAt(0) ?? "W"}
          </Box>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: FONT_WEIGHT_SEMIBOLD,
              color: "text.primary",
            }}
          >
            {user?.displayName ?? "Workspace"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          aria-label="Collapse sidebar"
          onClick={() => setOpen(false)}
          sx={{ p: 0.5, minWidth: 44, minHeight: 44 }}
        >
          <ChevronLeftIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        </IconButton>
      </Box>

      {/* Navigation items */}
      <List dense sx={{ px: 0.75, py: 0.5 }}>
        <ListItemButton
          onClick={onSearchClick}
          sx={{
            borderRadius: "12px",
            py: 0.75,
            px: 1,
            minHeight: { xs: 44, md: 32 },
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText
            primary="Search"
            primaryTypographyProps={{
              sx: { fontSize: "13px", color: "text.secondary" },
            }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => void navigate({ to: "/w" })}
          sx={{
            borderRadius: "12px",
            py: 0.75,
            px: 1,
            minHeight: { xs: 44, md: 32 },
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <HomeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText
            primary="Home"
            primaryTypographyProps={{
              sx: { fontSize: "13px", color: "text.secondary" },
            }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={() => void navigate({ to: "/shared" })}
          sx={{
            borderRadius: "12px",
            py: 0.75,
            px: 1,
            minHeight: { xs: 44, md: 32 },
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <PeopleIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText
            primary="Shared with me"
            primaryTypographyProps={{
              sx: { fontSize: "13px", color: "text.secondary" },
            }}
          />
        </ListItemButton>
      </List>

      {/* Resizable sections container */}
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Private section -- top pane, takes remaining space */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              pt: 2.5,
              pb: 0.75,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: FONT_WEIGHT_SEMIBOLD,
                color: "secondary.main",
                letterSpacing: "0.02em",
              }}
            >
              Private
            </Typography>
            <IconButton
              size="small"
              aria-label="Add page"
              onClick={(e) => setAddMenuAnchor(e.currentTarget)}
              sx={{ p: 0.25, minWidth: 44, minHeight: 44 }}
            >
              <AddIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </IconButton>
            <Menu
              anchorEl={addMenuAnchor}
              open={Boolean(addMenuAnchor)}
              onClose={() => setAddMenuAnchor(null)}
            >
              <MenuItem onClick={() => void handleCreatePage()}>
                <ListItemIcon>
                  <PageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="New Page" />
              </MenuItem>
              <MenuItem onClick={() => void handleCreateDatabase()}>
                <ListItemIcon>
                  <DatabaseIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="New Database" />
              </MenuItem>
            </Menu>
          </Box>

          <Box
            component="nav"
            aria-label="Sidebar"
            sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}
          >
            <List dense role="tree" sx={{ px: 0.75, py: 0.25 }}>
              {rootPages.map((page) => (
                <PageTreeItem
                  key={page.id}
                  page={page}
                  pages={pages ?? []}
                  currentPageId={currentPageId}
                  depth={0}
                />
              ))}
            </List>
          </Box>
        </Box>

        {/* Drag divider + Shared section -- bottom pane */}
        {hasSharedPages && (
          <>
            {/* Resize divider */}
            <Box
              onMouseDown={onDividerMouseDown}
              sx={{
                flexShrink: 0,
                height: "1px",
                position: "relative",
                cursor: "ns-resize",
                bgcolor: isDragging ? "primary.main" : "divider",
                transition: isDragging ? "none" : "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "primary.main",
                },
                // Invisible hit area for easier grabbing
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: "-3px",
                  bottom: "-3px",
                  left: 0,
                  right: 0,
                },
              }}
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: `0 0 ${(1 - ratio) * 100}%`,
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 1.5,
                  pt: 1,
                  pb: 0.5,
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: FONT_WEIGHT_SEMIBOLD,
                    color: "secondary.main",
                    letterSpacing: "0.02em",
                  }}
                >
                  Shared
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <List dense sx={{ px: 0.75, py: 0.25 }}>
                  {sharedPages?.map((page) => (
                    <ListItemButton
                      key={page.id}
                      selected={currentPageId === page.id}
                      onClick={() =>
                        void navigate({
                          to: "/shared/$pageId",
                          params: {
                            pageId: page.id,
                          },
                        })
                      }
                      sx={{
                        borderRadius: "12px",
                        py: 0.75,
                        px: 1,
                        minHeight: { xs: 44, md: 32 },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        {page.type === "database" ? (
                          <DatabaseIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                        ) : (
                          <PageIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={page.title || "Untitled"}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: "13px",
                            color: "text.primary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Theme toggle */}
      <ListItemButton
        onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
        sx={{
          py: 0.75,
          px: 1.5,
          minHeight: { xs: 44, md: 32 },
          flex: "0 0 auto",
          mx: 0.75,
          borderRadius: "12px",
          "&:hover": { bgcolor: "action.selected" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 24 }}>
          {themeMode === "dark" ? (
            <LightModeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          ) : (
            <DarkModeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
        </ListItemIcon>
        <ListItemText
          primary={themeMode === "dark" ? "Light mode" : "Dark mode"}
          primaryTypographyProps={{
            sx: { fontSize: "13px", color: "text.secondary" },
          }}
        />
      </ListItemButton>

      {/* Trash button */}
      <ListItemButton
        onClick={() => setShowTrash(true)}
        sx={{
          py: 0.75,
          px: 1.5,
          minHeight: { xs: 44, md: 32 },
          flex: "0 0 auto",
          mx: 0.75,
          borderRadius: "12px",
        }}
      >
        <ListItemIcon sx={{ minWidth: 24 }}>
          <TrashIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemIcon>
        <ListItemText
          primary="Trash"
          primaryTypographyProps={{
            sx: { fontSize: "13px", color: "text.secondary" },
          }}
        />
      </ListItemButton>

      <TrashPanel
        open={showTrash}
        onClose={() => setShowTrash(false)}
        workspaceId={workspaceId}
      />
    </Drawer>
  );
}
