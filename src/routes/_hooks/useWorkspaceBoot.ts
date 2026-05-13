import { useEffect, useRef, useState, type SetStateAction } from "react";
import { runMigrations } from "@/lib/database/migrations";
import { getOrCreateWorkspace } from "@/lib/database/workspace";
import { UserBrandId, type WorkspaceBrandId } from "@/types";
import type { User } from "firebase/auth";

interface UseWorkspaceBootArgs {
  user: User | null;
  workspaceId: WorkspaceBrandId | null;
  setWorkspaceId: (update: SetStateAction<WorkspaceBrandId | null>) => void;
}

export function useWorkspaceBoot({
  user,
  workspaceId,
  setWorkspaceId,
}: UseWorkspaceBootArgs) {
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

  return { authToken };
}
