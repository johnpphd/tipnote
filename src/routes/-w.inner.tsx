import { useNavigate, Outlet } from "@tanstack/react-router";
import { Box, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import Sidebar from "@/components/sidebar/Sidebar";
import SearchDialog from "@/components/search/SearchDialog";
import type { WorkspaceBrandId } from "@/types";

/** Inner component so hooks like useCopilotAction run inside <CopilotKit>. */
export default function WorkspaceInner({
  workspaceId,
  sidebarOpen,
  setSidebarOpen,
  searchOpen,
  setSearchOpen,
}: {
  workspaceId: WorkspaceBrandId;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  // Register frontend action for AI-triggered navigation
  useCopilotAction({
    name: "navigate",
    description: "Navigate to a page in the workspace",
    parameters: [
      {
        name: "pageId",
        type: "string",
        description: "The ID of the page to navigate to",
        required: true,
      },
    ],
    handler: async ({ pageId }: { pageId: string }) => {
      void navigate({ to: "/w/$pageId", params: { pageId } });
      return `Navigated to page ${pageId}`;
    },
  });

  return (
    <CopilotSidebar
      defaultOpen={false}
      shortcut="j"
      labels={{
        title: "AI Assistant",
        initial:
          "Ask me to create pages, databases, search your workspace, or manage content.",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        {/* Skip to content link for keyboard users */}
        <Box
          component="a"
          href="#main-content"
          sx={{
            position: "absolute",
            left: -9999,
            top: "auto",
            width: 1,
            height: 1,
            overflow: "hidden",
            "&:focus": {
              position: "fixed",
              top: 8,
              left: 8,
              width: "auto",
              height: "auto",
              zIndex: 9999,
              bgcolor: "background.paper",
              color: "text.primary",
              p: 1.5,
              borderRadius: 1,
              fontSize: "14px",
            },
          }}
        >
          Skip to content
        </Box>
        <Sidebar
          workspaceId={workspaceId}
          onSearchClick={() => setSearchOpen(true)}
        />
        <Box
          id="main-content"
          component="main"
          sx={{
            flexGrow: 1,
            height: "100%",
            overflow: "auto",
            bgcolor: "background.default",
            transition: "margin 225ms cubic-bezier(0, 0, 0.2, 1)",
          }}
        >
          {!sidebarOpen && (
            <IconButton
              size="small"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              sx={{ position: "fixed", top: 5, left: 12, zIndex: 20 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Outlet />
        </Box>

        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Box>
    </CopilotSidebar>
  );
}
