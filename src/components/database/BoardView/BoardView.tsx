import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Box, Typography, Paper, Chip, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyDefinition,
  PropertyValue,
} from "@/types";
import { RowBrandId, type PropertyBrandId, type PageBrandId } from "@/types";
import { ON_CHIP_COLOR } from "@/theme/notionColors";
import BoardColumn from "./BoardColumn";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { useBoardColumns } from "./_hooks/useBoardColumns";
import { useBoardDragDrop } from "./_hooks/useBoardDragDrop";
import { useBoardGroupActions } from "./_hooks/useBoardGroupActions";

interface BoardViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onAddRow: (
    defaultProperties?: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onDeleteRow?: (rowId: RowBrandId, pageId: PageBrandId) => void;
  onRowClick: (row: DatabaseRow) => void;
  onUpdateGroupOrder?: (order: string[]) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
  onUpdateView?: (config: Partial<DatabaseView["config"]>) => void;
  onDeleteRows?: (rowIds: RowBrandId[], pageIds: PageBrandId[]) => void;
  onOpenGroupSettings?: () => void;
  isReadOnly?: boolean;
}

export default function BoardView({
  database,
  rows,
  view,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onRowClick,
  onUpdateGroupOrder,
  onUpdateProperty,
  onUpdateView,
  onDeleteRows,
  onOpenGroupSettings,
  isReadOnly,
}: BoardViewProps) {
  const {
    groupByPropId,
    groupByProp,
    orderedColumns,
    groupedRows,
    hasSorts,
    cardOrder,
    hiddenGroups,
    visibleColumns,
    visibleColumnIds,
  } = useBoardColumns({ database, view, rows });

  const {
    activeId,
    activeType,
    sensors,
    sortedRowIdsPerColumn,
    getColumnRows,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardDragDrop({
    orderedColumns,
    groupedRows,
    visibleColumnIds,
    groupByPropId,
    rows,
    hasSorts,
    cardOrder,
    isReadOnly,
    onUpdateRow,
    onUpdateGroupOrder,
    onUpdateView,
  });

  const { handleColumnMenuAction, handleAddGroup } = useBoardGroupActions({
    database,
    groupByProp,
    groupByPropId,
    hiddenGroups,
    groupedRows,
    onUpdateProperty,
    onUpdateView,
    onDeleteRows,
    onOpenGroupSettings,
  });

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;
  const activeColumn =
    activeType === "column"
      ? visibleColumns.find((c) => c.id === activeId)
      : null;

  // Find title property for card display
  const titlePropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "title",
  );

  if (!groupByProp) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Board view requires a Select property to group by.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a Select property and set it as the Group By in view settings.
        </Typography>
      </Box>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleColumnIds}
        strategy={horizontalListSortingStrategy}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            px: 1,
            py: 1,
            minHeight: 400,
          }}
        >
          {visibleColumns.map((col) => (
            <BoardColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              rows={getColumnRows(col.id)}
              sortedRowIds={sortedRowIdsPerColumn[col.id] ?? []}
              titlePropId={titlePropId}
              database={database}
              view={view}
              onRowClick={onRowClick}
              onDeleteRow={onDeleteRow}
              onAddRow={() =>
                onAddRow(
                  col.id !== "__none__" && groupByPropId
                    ? { [groupByPropId]: col.id }
                    : undefined,
                )
              }
              onColumnMenuAction={
                isReadOnly ? undefined : handleColumnMenuAction
              }
              isReadOnly={isReadOnly}
            />
          ))}

          {!isReadOnly && (
            <Box
              sx={{
                minWidth: 280,
                maxWidth: 280,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Button
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={handleAddGroup}
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontSize: "13px",
                  justifyContent: "flex-start",
                  px: 1,
                  py: 0.75,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                New group
              </Button>
            </Box>
          )}
        </Box>
      </SortableContext>

      <DragOverlay>
        {activeType === "column" && activeColumn ? (
          <Chip
            label={activeColumn.label}
            size="small"
            sx={{
              bgcolor: activeColumn.color,
              color: ON_CHIP_COLOR,
              fontWeight: FONT_WEIGHT_SEMIBOLD,
              fontSize: "12px",
              height: 24,
              cursor: "grabbing",
            }}
          />
        ) : activeRow && titlePropId ? (
          <Paper elevation={3} sx={{ p: 1.5, width: 260, opacity: 0.9 }}>
            <Typography variant="body2">
              {(activeRow.properties[titlePropId] as string) || "Untitled"}
            </Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
