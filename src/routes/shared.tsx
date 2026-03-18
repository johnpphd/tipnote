import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Box, IconButton, CircularProgress } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import Sidebar from "@/components/sidebar/Sidebar";
import { useAtom } from "jotai";
import { sidebarOpenAtom } from "@/atoms/workspace";

export const Route = createFileRoute("/shared")({
  component: SharedLayout,
});

function SharedLayout() {
  const { user, loading: authLoading } = useAuth();
  const { workspaceId } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      {workspaceId && <Sidebar workspaceId={workspaceId} />}
      <Box
        id="main-content"
        component="main"
        sx={{
          flexGrow: 1,
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
    </Box>
  );
}
