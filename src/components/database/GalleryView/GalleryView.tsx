import { useMemo } from "react";
import { Box, Typography, Paper, Grid, Chip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId } from "@/types";
import CellDisplay from "../properties/CellDisplay";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

interface GalleryViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onAddRow: () => void;
  onRowClick: (row: DatabaseRow) => void;
  isReadOnly?: boolean;
}

export default function GalleryView({
  database,
  rows,
  view,
  onAddRow,
  onRowClick,
  isReadOnly,
}: GalleryViewProps) {
  const titlePropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "title",
  );

  const urlPropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "url",
  );

  const previewProps = useMemo(
    () =>
      view.config.visibleProperties
        .filter((id) => id !== titlePropId)
        .slice(0, 3)
        .map((id) => database.properties[id])
        .filter(Boolean),
    [view.config.visibleProperties, titlePropId, database.properties],
  );

  return (
    <Box sx={{ p: 1.5 }}>
      <Grid container spacing={1.5}>
        {rows.map((row) => {
          const title = titlePropId
            ? (row.properties[titlePropId] as string) || "Untitled"
            : "Untitled";

          // Use URL property as cover image if it looks like an image
          const coverUrl = urlPropId
            ? (row.properties[urlPropId] as string)
            : null;
          const isImage =
            coverUrl && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(coverUrl);

          return (
            <Grid key={row.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Paper
                onClick={() => onRowClick(row)}
                elevation={1}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  overflow: "hidden",
                  "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                }}
              >
                {/* Cover image area */}
                <Box
                  sx={{
                    height: 140,
                    bgcolor: "action.hover",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {isImage ? (
                    <Box
                      component="img"
                      src={coverUrl}
                      alt={title}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: "48px",
                        opacity: 0.3,
                      }}
                    >
                      {title.charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>

                {/* Card content */}
                <Box sx={{ p: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 0.5 }}
                    noWrap
                  >
                    {title}
                  </Typography>
                  {previewProps.map((prop) => {
                    const val = row.properties[prop.id];
                    if (val == null || val === "") return null;

                    if (prop.type === "select") {
                      const opt = prop.options?.find((o) => o.id === val);
                      return opt ? (
                        <Chip
                          key={prop.id}
                          label={opt.name}
                          size="small"
                          sx={{
                            bgcolor: opt.color,
                            color: "white",
                            height: 20,
                            fontSize: "10px",
                            mr: 0.25,
                            mb: 0.25,
                          }}
                        />
                      ) : null;
                    }

                    return (
                      <Box
                        key={prop.id}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <CellDisplay property={prop} value={val} />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          );
        })}

        {/* Add card */}
        {!isReadOnly && (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper
              component="button"
              onClick={onAddRow}
              elevation={0}
              sx={{
                cursor: "pointer",
                borderRadius: 2,
                border: 2,
                borderColor: "divider",
                borderStyle: "dashed",
                height: "100%",
                minHeight: 200,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <AddIcon sx={{ color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                New
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
