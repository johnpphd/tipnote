import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { workspaceIdAtom } from "@/atoms/workspace";
import { subscribeToWorkspace } from "@/lib/database/workspace";
import type { Workspace } from "@/types";

export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useAtom(workspaceIdAtom);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const unsubscribe = subscribeToWorkspace(workspaceId, (workspace) => {
      queryClient.setQueryData(["workspace", workspaceId], workspace);
    });

    return unsubscribe;
  }, [workspaceId, queryClient]);

  const query = useQuery<Workspace | null>({
    queryKey: ["workspace", workspaceId],
    queryFn: () => null,
    enabled: !!workspaceId,
    staleTime: Infinity,
  });

  return {
    workspace: query.data ?? null,
    workspaceId,
    setWorkspaceId,
    isLoading: query.isLoading,
  };
}
