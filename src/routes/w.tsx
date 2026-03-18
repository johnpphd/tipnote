import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAtom } from "jotai";
import { sidebarOpenAtom } from "@/atoms/workspace";
import { runMigrations } from "@/lib/database/migrations";
import { getOrCreateWorkspace } from "@/lib/database/workspace";
import { UserBrandId } from "@/types";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");

  // Keep auth token fresh for CopilotKit headers
  useEffect(() => {
    if (!user) return;
    const refreshToken = () => {
      void user.getIdToken().then(setAuthToken);
    };
    refreshToken();
    // Refresh token every 50 minutes (tokens expire at 60 min)
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

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

  // Recover missing workspaceId for already-authenticated users
  useEffect(() => {
    if (!user || workspaceId) return;
    void getOrCreateWorkspace(UserBrandId.parse(user.uid), "My Workspace").then(
      setWorkspaceId,
    );
  }, [user, workspaceId, setWorkspaceId]);

  // Run one-time data migrations
  const migrationsRun = useRef(false);
  useEffect(() => {
    if (workspaceId && !migrationsRun.current) {
      migrationsRun.current = true;
      void runMigrations(workspaceId);
    }
  }, [workspaceId]);

  // Cmd+K to open search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
