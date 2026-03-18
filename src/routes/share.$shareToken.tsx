import { useState, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Typography, CircularProgress } from "@mui/material";
import { Public as PublicIcon } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { usePublishedPage } from "@/hooks/usePublishedPage";
import { lookupShareToken } from "@/lib/database/sharing";
import PageHeader from "@/components/page/PageHeader";
import DatabaseView from "@/components/database/DatabaseView";
import BlockEditor from "@/components/editor/BlockEditor";
import { PageBrandId, UserBrandId, ShareToken, ViewBrandId } from "@/types";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

interface ShareSearch {
  v?: string;
}

export const Route = createFileRoute("/share/$shareToken")({
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    v: typeof search.v === "string" ? search.v : undefined,
  }),
  component: SharePage,
});

function SharePage() {
  const { shareToken } = Route.useParams();
  const { v: activeViewId } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lookup, setLookup] = useState<{
    pageId: PageBrandId;
  } | null>(null);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    void lookupShareToken(ShareToken.parse(shareToken))
      .then((result) => {
        setLookup(result ? { pageId: PageBrandId.parse(result.pageId) } : null);
        setLookupDone(true);
      })
      .catch((error) => {
        console.error("[SharePage] lookupShareToken error:", error);
        setLookupDone(true);
      });
  }, [shareToken]);

  const { data: page, isLoading: pageLoading } = usePublishedPage(
    lookup?.pageId,
  );

  // Redirect authenticated shared users to the proper shared page route
  // where they get their assigned role (editor/viewer) instead of read-only
  useEffect(() => {
    if (!user || !lookup || !page) return;
    const brandedUid = UserBrandId.parse(user.uid);
    const shareEntry = page.sharedWith?.[brandedUid];
    if (shareEntry) {
      void navigate({
        to: "/shared/$pageId",
        params: {
          pageId: page.id,
        },
        replace: true,
      });
    }
  }, [user, lookup, page, navigate]);

  const handleViewChange = useCallback(
    (viewId: ViewBrandId) => {
      void navigate({
        to: "/share/$shareToken",
        params: { shareToken },
        search: { v: viewId },
      });
    },
    [navigate, shareToken],
  );

  // Loading state
  if (!lookupDone || (lookup && pageLoading)) {
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
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not found
  if (!lookup || !page) {
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
        <Typography variant="h5" sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD }}>
          Page not found
        </Typography>
        <Typography color="text.secondary">
          This page may have been unpublished or the link is invalid.
        </Typography>
      </Box>
    );
  }

  const content = (page as unknown as Record<string, unknown>)?.content as
    | Record<string, unknown>
    | null
    | undefined;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
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
        <PublicIcon
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
        <Typography
          sx={{
            fontSize: "11px",
            color: "text.secondary",
            whiteSpace: "nowrap",
          }}
        >
          Published page
        </Typography>
      </Box>

      {/* Database pages */}
      {page.type === "database" && page.databaseId && (
        <Box
          sx={{
            px: { xs: 1, sm: 2, md: 4, lg: 6 },
            py: { xs: 1, md: 2 },
          }}
        >
          <PageHeader page={page} isReadOnly />
          <DatabaseView
            databaseId={page.databaseId}
            urlViewId={
              activeViewId ? ViewBrandId.parse(activeViewId) : undefined
            }
            onViewChange={handleViewChange}
            isReadOnly
          />
        </Box>
      )}

      {/* Regular pages */}
      {page.type !== "database" && (
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 2, md: 4 },
          }}
        >
          <PageHeader page={page} isReadOnly />
          <BlockEditor
            key={page.id}
            content={content ?? null}
            onUpdate={() => {}}
            workspaceId={page.workspaceId}
            pageId={page.id}
            editable={false}
          />
        </Box>
      )}
    </Box>
  );
}
