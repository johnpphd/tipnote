import { useMemo, lazy, Suspense } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAtom } from "jotai";
import { sidebarOpenAtom } from "@/atoms/workspace";
import { useWorkspaceBoot } from "./_hooks/useWorkspaceBoot";
import { useSearchHotkey } from "./_hooks/useSearchHotkey";

const CopilotKitProvider = lazy(() =>
  import("@copilotkit/react-core").then((m) => ({ default: m.CopilotKit })),
);
const WorkspaceInner = lazy(() => import("./-w.inner"));

export const Route = createFileRoute("/w")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { user, loading: authLoading } = useAuth();
  const { workspaceId, setWorkspaceId } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenAtom);
  const { searchOpen, setSearchOpen } = useSearchHotkey();
  const { authToken } = useWorkspaceBoot({ user, workspaceId, setWorkspaceId });

  const copilotHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${authToken}`,
      "X-Workspace-Id": workspaceId || "",
    }),
    [authToken, workspaceId],
  );

  const copilotProperties = useMemo(
    () => ({
      workspaceId: workspaceId || "",
    }),
    [workspaceId],
  );

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!workspaceId || !authToken) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            width: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <CopilotKitProvider
        runtimeUrl="/api/copilotkit"
        headers={copilotHeaders}
        properties={copilotProperties}
      >
        <WorkspaceInner
          workspaceId={workspaceId}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
        />
      </CopilotKitProvider>
    </Suspense>
  );
}
