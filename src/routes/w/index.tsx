import { createFileRoute } from "@tanstack/react-router";
import { Box, Typography, Button } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { createPage } from "@/lib/database/pages";
import { useNavigate } from "@tanstack/react-router";
import { UserBrandId, Title } from "@/types";

export const Route = createFileRoute("/w/")({
  component: WorkspaceHome,
});

function WorkspaceHome() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const navigate = useNavigate();

  const handleNewPage = async () => {
    if (!user || !workspaceId) return;
    const pageId = await createPage(workspaceId, UserBrandId.parse(user.uid), {
      title: Title.parse("Untitled"),
      type: "page",
    });
    void navigate({ to: "/w/$pageId", params: { pageId } });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 2,
        p: 4,
      }}
    >
      <Typography variant="h2">Welcome</Typography>
      <Typography variant="body1" color="text.secondary">
        Select a page from the sidebar or create a new one.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => void handleNewPage()}
      >
        New Page
      </Button>
    </Box>
  );
}
