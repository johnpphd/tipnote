import { useCallback } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Box, Typography, CircularProgress, Chip } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useSharedPage } from "@/hooks/useSharedPage";
import { savePageContent } from "@/lib/blocks/blockService";
import PageHeader from "@/components/page/PageHeader";
import RowPropertiesPanel from "@/components/page/RowPropertiesPanel";
import DatabaseView from "@/components/database/DatabaseView";
import BlockEditor from "@/components/editor/BlockEditor";
import type { DatabaseRow } from "@/types";
import { PageBrandId, UserBrandId, ViewBrandId } from "@/types";
import type { JSONContent } from "@tiptap/core";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

interface SharedPageSearch {
  v?: string;
}

export const Route = createFileRoute("/shared/$pageId")({
  validateSearch: (search: Record<string, unknown>): SharedPageSearch => ({
    v: typeof search.v === "string" ? search.v : undefined,
  }),
  component: SharedPageView,
});

function SharedPageView() {
  const { pageId: rawPageId } = Route.useParams();
  const brandedPageId = PageBrandId.parse(rawPageId);
  const { v: activeViewId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const brandedUid = user ? UserBrandId.parse(user.uid) : undefined;
  const { data } = useSharedPage(brandedPageId, brandedUid);

  const handleContentUpdate = useCallback(
    (content: JSONContent) => {
      if (!brandedPageId) return;
      void savePageContent(brandedPageId, content);
    },
    [brandedPageId],
  );

  const handleRowClick = useCallback(
    (row: DatabaseRow) => {
      void navigate({
        to: "/shared/$pageId",
        params: { pageId: row.pageId },
      });
    },
    [navigate],
  );

  const handleViewChange = useCallback(
    (viewId: ViewBrandId) => {
      void navigate({
        to: "/shared/$pageId",
        params: { pageId: rawPageId },
        search: { v: viewId },
      });
    },
    [navigate, rawPageId],
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

  // Still loading shared page data
  if (!data || (!data.page && !data.permissionDenied)) {
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

  // Permission denied or page not found
  if (data.permissionDenied || !data.page) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
          bgcolor: "background.default",
          gap: 2,
        }}
      >
        <LockIcon sx={{ fontSize: 48, color: "text.secondary" }} />
        <Typography variant="h5" sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>
          You don&apos;t have access to this page
        </Typography>
        <Typography color="text.secondary">
          Ask the page owner to share it with you.
        </Typography>
      </Box>
    );
  }

  const { page, role, isEditor } = data;
  const isReadOnly = !isEditor;

  const content = (page as unknown as Record<string, unknown>)?.content as
    | Record<string, unknown>
    | null
    | undefined;

  return (
    <Box>
      {/* Lightweight top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 0.5,
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <LockIcon
          sx={{ fontSize: 16, color: "text.secondary", mr: 1, flexShrink: 0 }}
        />
        <Typography
          noWrap
          sx={{
            fontSize: "13px",
            color: "text.primary",
            fontWeight: FONT_WEIGHT_MEDIUM,
          }}
        >
          {page.icon && (
            <Typography component="span" sx={{ fontSize: "13px", mr: 0.5 }}>
              {page.icon}
            </Typography>
          )}
          {page.title || "Untitled"}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {role && (
          <Chip
            label={role === "editor" ? "Editor" : "Viewer"}
            size="small"
            variant="outlined"
            sx={{ fontSize: "11px", height: 22 }}
          />
        )}
      </Box>

      {/* Database pages */}
      {page.type === "database" && page.databaseId && (
        <Box
          sx={{
            px: { xs: 1, sm: 2, md: 4, lg: 6 },
            py: { xs: 1, md: 2 },
          }}
        >
          <PageHeader page={page} isReadOnly={isReadOnly} />
          <DatabaseView
            databaseId={page.databaseId}
            urlViewId={
              activeViewId ? ViewBrandId.parse(activeViewId) : undefined
            }
            onViewChange={handleViewChange}
            isReadOnly={isReadOnly}
            onRowClick={handleRowClick}
          />
        </Box>
      )}

      {/* Regular pages (including db row pages) */}
      {page.type !== "database" && (
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 2, md: 4 },
          }}
        >
          <PageHeader page={page} isReadOnly={isReadOnly} />
          {page.isDbRow && page.parentDatabaseId && (
            <RowPropertiesPanel
              pageId={page.id}
              parentDatabaseId={page.parentDatabaseId}
              isReadOnly={isReadOnly}
            />
          )}
          <BlockEditor
            key={page.id}
            content={content ?? null}
            onUpdate={isEditor ? handleContentUpdate : () => {}}
            workspaceId={page.workspaceId}
            pageId={page.id}
            editable={isEditor}
          />
        </Box>
      )}
    </Box>
  );
}
