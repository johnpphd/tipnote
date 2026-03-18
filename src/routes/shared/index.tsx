import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  Description as PageIcon,
  TableChart as DatabaseIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useSharedPages } from "@/hooks/useSharedPages";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { UserBrandId } from "@/types";

export const Route = createFileRoute("/shared/")({
  component: SharedListingPage,
});

function SharedListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: sharedPages, error } = useSharedPages(
    user?.uid ? UserBrandId.parse(user.uid) : undefined,
  );

  const pages = sharedPages ?? [];

  return (
    <Box>
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 0.5,
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.default",
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}>
          Shared with me
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 700, mx: "auto", width: "100%", px: 2, py: 3 }}>
        {error ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 8,
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "14px", color: "error.main" }}>
              Failed to load shared pages
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
              {error}
            </Typography>
          </Box>
        ) : pages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 8,
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "14px", color: "text.secondary" }}>
              No pages have been shared with you yet
            </Typography>
          </Box>
        ) : (
          <List dense>
            {pages.map((page) => {
              const role =
                page.sharedWith?.[UserBrandId.parse(user!.uid)]?.role;
              return (
                <ListItemButton
                  key={page.id}
                  onClick={() =>
                    void navigate({
                      to: "/shared/$pageId",
                      params: {
                        pageId: page.id,
                      },
                    })
                  }
                  sx={{ borderRadius: 1, py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {page.type === "database" ? (
                      <DatabaseIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                    ) : (
                      <PageIcon
                        sx={{ fontSize: 18, color: "text.secondary" }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        {page.icon && (
                          <Typography
                            component="span"
                            sx={{ fontSize: "14px" }}
                          >
                            {page.icon}
                          </Typography>
                        )}
                        <Typography
                          noWrap
                          sx={{
                            fontSize: "14px",
                            fontWeight: FONT_WEIGHT_MEDIUM,
                          }}
                        >
                          {page.title || "Untitled"}
                        </Typography>
                        {role && (
                          <Chip
                            label={role === "editor" ? "Editor" : "Viewer"}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "11px", height: 20 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
