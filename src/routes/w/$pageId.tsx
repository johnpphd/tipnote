import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { usePage } from "@/hooks/usePage";
import { usePageContent } from "@/hooks/usePageContent";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { createPage } from "@/lib/database/pages";
import TopBar from "@/components/page/TopBar";
import PageHeader from "@/components/page/PageHeader";
import RowPropertiesPanel from "@/components/page/RowPropertiesPanel";
import BlockEditor from "@/components/editor/BlockEditor";
import DatabaseView from "@/components/database/DatabaseView";
import { PageBrandId, UserBrandId, ViewBrandId, Title } from "@/types";

interface PageSearch {
  v?: string;
}

export const Route = createFileRoute("/w/$pageId")({
  validateSearch: (search: Record<string, unknown>): PageSearch => ({
    v: typeof search.v === "string" ? search.v : undefined,
  }),
  component: PageView,
});

function PageView() {
  const { pageId: rawPageId } = Route.useParams();
  const brandedPageId = PageBrandId.parse(rawPageId);
  const { v: activeViewId } = Route.useSearch();
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const { data: page, isLoading } = usePage(brandedPageId);
  const { content, updateContent } = usePageContent(brandedPageId);
  const navigate = useNavigate();

  const handleViewChange = useCallback(
    (viewId: ViewBrandId) => {
      void navigate({
        to: "/w/$pageId",
        params: { pageId: rawPageId },
        search: { v: viewId },
      });
    },
    [navigate, rawPageId],
  );

  const handleAddSubpage = useCallback(async () => {
    if (!user || !workspaceId) return;
    const newPageId = await createPage(
      workspaceId,
      UserBrandId.parse(user.uid),
      {
        title: Title.parse("Untitled"),
        type: "page",
        parentId: brandedPageId,
      },
    );
    void navigate({ to: "/w/$pageId", params: { pageId: newPageId } });
  }, [user, workspaceId, brandedPageId, navigate]);

  if (isLoading || !page) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        {isLoading ? (
          <CircularProgress />
        ) : (
          <Typography color="text.secondary">Page not found</Typography>
        )}
      </Box>
    );
  }

  if (!workspaceId) return null;

  // Database pages render DatabaseView instead of BlockEditor
  if (page.type === "database" && page.databaseId) {
    return (
      <Box>
        <TopBar page={page} />
        <Box sx={{ px: { xs: 1, sm: 2, md: 4, lg: 6 }, py: { xs: 1, md: 2 } }}>
          <PageHeader page={page} />
          <DatabaseView
            databaseId={page.databaseId}
            urlViewId={
              activeViewId ? ViewBrandId.parse(activeViewId) : undefined
            }
            onViewChange={handleViewChange}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <TopBar page={page} />
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 2, md: 4 },
        }}
      >
        <PageHeader page={page} />
        {page.isDbRow && page.parentDatabaseId && (
          <RowPropertiesPanel
            pageId={brandedPageId}
            parentDatabaseId={page.parentDatabaseId}
          />
        )}
        <BlockEditor
          key={brandedPageId}
          content={content}
          onUpdate={updateContent}
          workspaceId={page.workspaceId}
          pageId={brandedPageId}
        />

        {/* Add subpage button at the bottom */}
        <Box sx={{ mt: 4, mb: 2 }}>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => void handleAddSubpage()}
            sx={{
              color: "text.secondary",
              textTransform: "none",
              fontSize: "13px",
            }}
          >
            Add a sub-page
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
