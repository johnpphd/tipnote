import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import { DeleteOutline as DeleteIcon } from "@mui/icons-material";
import type { Database, DatabaseRow, DatabaseView } from "@/types";
import type { PropertyBrandId } from "@/types";
import CellDisplay from "../properties/CellDisplay";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

interface BoardCardProps {
  row: DatabaseRow;
  titlePropId: PropertyBrandId | undefined;
  database: Database;
  view: DatabaseView;
  columnId: string;
  onClick: () => void;
  onDelete?: () => void;
}

function BoardCard({
  row,
  titlePropId,
  database,
  view,
  columnId,
  onClick,
  onDelete,
}: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    data: { type: "card", columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = titlePropId
    ? (row.properties[titlePropId] as string) || "Untitled"
    : "Untitled";

  // Use view.config.visibleProperties, excluding title and groupBy
  const visibleProps = useMemo(() => {
    const groupByPropId = view.config.groupBy;
    return view.config.visibleProperties
      .filter(
        (id) =>
          id !== titlePropId &&
          id !== groupByPropId &&
          database.properties[id] != null,
      )
      .map((id) => ({
        prop: database.properties[id],
        value: row.properties[id],
      }))
      .filter((p) => p.value != null && p.value !== "");
  }, [view, titlePropId, database, row]);

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      elevation={0}
      sx={{
        p: 2,
        position: "relative",
        cursor: isDragging ? "grabbing" : "pointer",
        opacity: isDragging ? 0.5 : 1,
        "&:hover": { bgcolor: "action.hover" },
        "&:hover .board-card-delete": { opacity: 1 },
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
      }}
    >
      {onDelete && (
        <IconButton
          className="board-card-delete"
          size="small"
          aria-label="Delete card"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            opacity: 0,
            transition: "opacity 150ms ease",
            p: 0.25,
            color: "text.secondary",
            "&:hover": { color: "error.main" },
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      <Typography
        variant="body2"
        sx={{
          fontWeight: FONT_WEIGHT_SEMIBOLD,
          mb: visibleProps.length > 0 ? 0.75 : 0,
        }}
      >
        {title}
      </Typography>
      {visibleProps.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.5,
          }}
        >
          {visibleProps.map(({ prop, value }) => (
            <Box
              key={prop.id}
              sx={{
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              {prop.type === "checkbox" ? (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {value ? prop.name : `Not ${prop.name}`}
                </Typography>
              ) : (
                <CellDisplay property={prop} value={value} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default memo(BoardCard);
