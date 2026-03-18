import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  MoreHoriz as MoreHorizIcon,
  Edit as EditIcon,
  VisibilityOff as VisibilityOffIcon,
  DeleteOutline as DeleteOutlineIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import type { Database, DatabaseRow, DatabaseView } from "@/types";
import type { PropertyBrandId, RowBrandId, PageBrandId } from "@/types";
import { NOTION_COLORS } from "@/theme/notionColors";
import BoardCard from "./BoardCard";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

export type ColumnMenuAction =
  | { type: "color"; optionId: string; colorName: string }
  | { type: "hide"; optionId: string }
  | { type: "deletePages"; optionId: string }
  | { type: "editGroups" }
  | { type: "rename"; optionId: string; newName: string };

const COLOR_DISPLAY_ORDER = [
  "default",
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
] as const;

function getColorName(color: string): string {
  for (const [name, hex] of Object.entries(NOTION_COLORS)) {
    if (hex === color) return name;
  }
  return color;
}

interface BoardColumnProps {
  id: string;
  label: string;
  color: string;
  rows: DatabaseRow[];
  sortedRowIds: string[];
  titlePropId: PropertyBrandId | undefined;
  database: Database;
  view: DatabaseView;
  onRowClick: (row: DatabaseRow) => void;
  onDeleteRow?: (rowId: RowBrandId, pageId: PageBrandId) => void;
  onAddRow: () => void;
  onColumnMenuAction?: (action: ColumnMenuAction) => void;
  isReadOnly?: boolean;
}

export default function BoardColumn({
  id,
  label,
  color,
  rows,
  sortedRowIds,
  titlePropId,
  database,
  view,
  onRowClick,
  onDeleteRow,
  onAddRow,
  onColumnMenuAction,
  isReadOnly,
}: BoardColumnProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");

  const canRename = !isReadOnly && id !== "__none__";

  const handleSaveLabel = () => {
    const trimmed = labelDraft.trim();
    if (!trimmed || trimmed === label) {
      setIsEditingLabel(false);
      return;
    }
    onColumnMenuAction?.({ type: "rename", optionId: id, newName: trimmed });
    setIsEditingLabel(false);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "column", columnId: id },
    disabled: isReadOnly,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column-droppable-${id}`,
    data: { type: "column", columnId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentColorName = getColorName(color);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        minWidth: 280,
        maxWidth: 280,
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        opacity: isDragging ? 0.5 : 1,
        "&:hover .column-menu-btn": { opacity: 1 },
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.75,
          mb: 0.5,
        }}
      >
        {!isReadOnly && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: isDragging ? "grabbing" : "grab",
              color: "text.secondary",
              opacity: 0.5,
              "&:hover": { opacity: 1 },
              mr: -0.5,
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 16 }} />
          </Box>
        )}
        {isEditingLabel ? (
          <TextField
            autoFocus
            size="small"
            variant="standard"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={handleSaveLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveLabel();
              if (e.key === "Escape") setIsEditingLabel(false);
            }}
            sx={{
              maxWidth: 160,
              "& .MuiInputBase-input": {
                fontSize: "12px",
                fontWeight: FONT_WEIGHT_SEMIBOLD,
                color: "white",
                py: 0,
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: "divider",
              },
            }}
          />
        ) : (
          <Chip
            label={label}
            size="small"
            onDoubleClick={
              canRename
                ? () => {
                    setLabelDraft(label);
                    setIsEditingLabel(true);
                  }
                : undefined
            }
            sx={{
              bgcolor: color,
              color: "white",
              fontWeight: FONT_WEIGHT_SEMIBOLD,
              fontSize: "12px",
              height: 24,
              cursor: canRename ? "default" : undefined,
            }}
          />
        )}
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "12px" }}
        >
          {rows.length}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {!isReadOnly && (
          <>
            <IconButton
              className="column-menu-btn"
              size="small"
              aria-label="Column options"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ p: 0.25, opacity: 0, transition: "opacity 0.15s" }}
            >
              <MoreHorizIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" aria-label="Add row" onClick={onAddRow}>
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        )}
      </Box>

      {/* Cards */}
      <SortableContext
        items={sortedRowIds}
        strategy={verticalListSortingStrategy}
      >
        <Box
          ref={setDroppableRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            px: 0.5,
            flex: 1,
            minHeight: 50,
          }}
        >
          {rows.map((row) => (
            <BoardCard
              key={row.id}
              row={row}
              titlePropId={titlePropId}
              database={database}
              view={view}
              columnId={id}
              onClick={() => onRowClick(row)}
              onDelete={
                onDeleteRow ? () => onDeleteRow(row.id, row.pageId) : undefined
              }
            />
          ))}
        </Box>
      </SortableContext>

      {/* Column menu popover */}
      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ width: 220, py: 0.5 }}>
          <List dense disablePadding>
            <ListItemButton
              onClick={() => {
                onColumnMenuAction?.({ type: "editGroups" });
                setMenuAnchor(null);
              }}
              sx={{ px: 1.5, py: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <EditIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </ListItemIcon>
              <ListItemText
                primary="Edit groups"
                primaryTypographyProps={{ sx: { fontSize: "13px" } }}
              />
            </ListItemButton>

            {id !== "__none__" && (
              <ListItemButton
                onClick={() => {
                  onColumnMenuAction?.({ type: "hide", optionId: id });
                  setMenuAnchor(null);
                }}
                sx={{ px: 1.5, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <VisibilityOffIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Hide group"
                  primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                />
              </ListItemButton>
            )}

            {rows.length > 0 && (
              <ListItemButton
                onClick={() => {
                  onColumnMenuAction?.({ type: "deletePages", optionId: id });
                  setMenuAnchor(null);
                }}
                sx={{ px: 1.5, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <DeleteOutlineIcon
                    sx={{ fontSize: 16, color: "error.main" }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`Delete ${rows.length} page${rows.length !== 1 ? "s" : ""}`}
                  primaryTypographyProps={{
                    sx: { fontSize: "13px", color: "error.main" },
                  }}
                />
              </ListItemButton>
            )}
          </List>

          {id !== "__none__" && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ px: 1.5, py: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "11px",
                    fontWeight: FONT_WEIGHT_SEMIBOLD,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    mb: 0.75,
                  }}
                >
                  Color
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {COLOR_DISPLAY_ORDER.map((colorName) => {
                    const hex = NOTION_COLORS[colorName]!;
                    const isSelected = currentColorName === colorName;
                    return (
                      <Box
                        key={colorName}
                        role="button"
                        tabIndex={0}
                        aria-label={colorName}
                        onClick={() => {
                          onColumnMenuAction?.({
                            type: "color",
                            optionId: id,
                            colorName,
                          });
                          setMenuAnchor(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onColumnMenuAction?.({
                              type: "color",
                              optionId: id,
                              colorName,
                            });
                            setMenuAnchor(null);
                          }
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "8px",
                          bgcolor: hex,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: isSelected
                            ? "2px solid white"
                            : "2px solid transparent",
                          "&:hover": { opacity: 0.8 },
                        }}
                      >
                        {isSelected && (
                          <CheckIcon sx={{ fontSize: 14, color: "white" }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </Box>
  );
}
