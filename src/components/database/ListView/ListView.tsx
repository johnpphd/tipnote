import { useState, useCallback } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId } from "@/types";
import CellEditor from "../properties/CellEditor";
import CellDisplay from "../properties/CellDisplay";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

interface ListViewProps {
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

export default function ListView({
  database,
  rows,
  view,
  onUpdateRow,
  onAddRow,
  onRowClick,
  isReadOnly,
}: ListViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const titlePropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "title",
  );

  const visibleProps = view.config.visibleProperties
    .filter((id) => id !== titlePropId)
    .map((id) => database.properties[id])
    .filter(Boolean);

  const handleToggle = useCallback((rowId: string) => {
    setExpandedId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const handleCellChange = useCallback(
    (rowId: RowBrandId, propId: PropertyBrandId, value: PropertyValue) => {
      onUpdateRow(rowId, { [propId]: value } as Record<
        PropertyBrandId,
        PropertyValue
      >);
    },
    [onUpdateRow],
  );

  return (
    <Box>
      <List disablePadding>
        {rows.map((row) => {
          const title = titlePropId
            ? (row.properties[titlePropId] as string) || "Untitled"
            : "Untitled";
          const isExpanded = expandedId === row.id;

          return (
            <Box key={row.id}>
              <ListItemButton
                onClick={() => handleToggle(row.id)}
                sx={{
                  py: 0.75,
                  px: 2,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <IconButton
                  size="small"
                  sx={{ mr: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(row.id);
                  }}
                >
                  {isExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
                <ListItemText
                  primary={title}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: FONT_WEIGHT_MEDIUM,
                  }}
                />
                {/* Show a few property chips */}
                {visibleProps.slice(0, 3).map((prop) => {
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
                          ml: 0.5,
                        }}
                      />
                    ) : null;
                  }
                  if (prop.type === "checkbox") {
                    return (
                      <Chip
                        key={prop.id}
                        label={val ? "Yes" : "No"}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: "10px", ml: 0.5 }}
                      />
                    );
                  }
                  return null;
                })}
                {!isReadOnly && (
                  <Typography
                    variant="body2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(row);
                    }}
                    sx={{
                      color: "primary.main",
                      fontSize: "12px",
                      ml: 1,
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Open
                  </Typography>
                )}
              </ListItemButton>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 7, pr: 2, pb: 1.5 }}>
                  {visibleProps.map((prop) => (
                    <Box
                      key={prop.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontSize: "12px",
                          minWidth: 100,
                          flexShrink: 0,
                        }}
                      >
                        {prop.name}
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {isReadOnly ? (
                          <CellDisplay
                            property={prop}
                            value={row.properties[prop.id] ?? null}
                          />
                        ) : (
                          <CellEditor
                            property={prop}
                            value={row.properties[prop.id] ?? null}
                            onChange={(val) =>
                              handleCellChange(row.id, prop.id, val)
                            }
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>
              <Divider />
            </Box>
          );
        })}
      </List>

      {/* Add row button */}
      {!isReadOnly && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1,
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={onAddRow}
        >
          <IconButton size="small" sx={{ mr: 0.5 }}>
            <AddIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "13px" }}
          >
            New
          </Typography>
        </Box>
      )}
    </Box>
  );
}
