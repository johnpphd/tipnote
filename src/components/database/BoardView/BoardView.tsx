import { useMemo, useCallback, useState, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Box, Typography, Paper, Chip, Button } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyDefinition,
  PropertyValue,
  SelectOption,
} from "@/types";
import {
  SelectOptionBrandId,
  DisplayName,
  CssColor,
  RowBrandId,
  type PropertyBrandId,
  type PageBrandId,
} from "@/types";
import { NOTION_COLORS } from "@/theme/notionColors";
import BoardColumn, { type ColumnMenuAction } from "./BoardColumn";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

const RANDOM_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "red",
  "yellow",
  "brown",
];

function resolveColor(color: string): string {
  return NOTION_COLORS[color] ?? color;
}

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  // Track card positions during drag for live preview
  const [dragCardPositions, setDragCardPositions] = useState<Record<
    string,
    string[]
  > | null>(null);
  const dragSourceColumnRef = useRef<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const sensors = useSensors(isReadOnly ? undefined : pointerSensor);

  // Find the groupBy property (must be a select type)
  const groupByPropId = view.config.groupBy;
  const groupByProp = groupByPropId ? database.properties[groupByPropId] : null;

  // Get columns from select options + "No value" column
  const columns = useMemo((): {
    id: string;
    label: string;
    color: string;
  }[] => {
    if (!groupByProp || !groupByProp.options) {
      return [{ id: "__none__", label: "All Items", color: "text.secondary" }];
    }
    return [
      { id: "__none__", label: "No value", color: "text.secondary" },
      ...groupByProp.options.map((opt: SelectOption) => ({
        id: opt.id,
        label: opt.name,
        color: resolveColor(opt.color),
      })),
    ];
  }, [groupByProp]);

  // Reconcile stored groupOrder with current columns, apply sort
  const orderedColumns = useMemo(() => {
    // If alphabetical sort, sort by label (but keep __none__ first)
    if (view.config.groupSortOrder === "alphabetical") {
      const none = columns.find((c) => c.id === "__none__");
      const rest = columns
        .filter((c) => c.id !== "__none__")
        .sort((a, b) => a.label.localeCompare(b.label));
      return none ? [none, ...rest] : rest;
    }

    // Manual sort: use saved groupOrder
    const savedOrder = view.config.groupOrder;
    if (!savedOrder || savedOrder.length === 0) return columns;

    const columnMap = new Map(columns.map((col) => [col.id, col]));
    const ordered: typeof columns = [];

    // Apply saved order (skip any IDs that no longer exist)
    for (const id of savedOrder) {
      const col = columnMap.get(id);
      if (col) {
        ordered.push(col);
        columnMap.delete(id);
      }
    }

    // Append any new columns not in the saved order
    for (const col of columnMap.values()) {
      ordered.push(col);
    }

    return ordered;
  }, [columns, view.config.groupOrder, view.config.groupSortOrder]);

  // Build name-to-ID map (values may be stored as option names, not IDs)
  const nameToId = useMemo(() => {
    const map: Record<string, string> = {};
    if (groupByProp?.options) {
      for (const opt of groupByProp.options) {
        map[opt.name] = opt.id;
        map[opt.id] = opt.id;
      }
    }
    return map;
  }, [groupByProp]);

  // Check if explicit sorts are active (takes precedence over cardOrder)
  const hasSorts = view.config.sorts.length > 0;
  const cardOrder = view.config.cardOrder;

  // Group rows by the groupBy property value, then sort by cardOrder
  const groupedRows = useMemo(() => {
    const groups: Record<string, DatabaseRow[]> = {};
    for (const col of orderedColumns) {
      groups[col.id] = [];
    }
    for (const row of rows) {
      const val = groupByPropId
        ? (row.properties[groupByPropId] as string)
        : null;
      const colId = val ? (nameToId[val] ?? "__none__") : "__none__";
      if (groups[colId]) {
        groups[colId].push(row);
      } else {
        groups["__none__"]?.push(row);
      }
    }

    // Sort each column's cards by cardOrder (unless explicit sorts are active)
    if (!hasSorts && cardOrder) {
      for (const colId of Object.keys(groups)) {
        const order = cardOrder[colId];
        if (!order || order.length === 0) continue;
        const orderIndex = new Map(order.map((id, idx) => [id, idx]));
        groups[colId]!.sort((a, b) => {
          const ai = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const bi = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          return ai - bi;
        });
      }
    }

    return groups;
  }, [rows, orderedColumns, groupByPropId, nameToId, hasSorts, cardOrder]);

  // Compute sorted row IDs per column (uses drag state when dragging, otherwise groupedRows)
  const sortedRowIdsPerColumn = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (dragCardPositions) {
      // During drag: use drag state for live preview
      for (const col of orderedColumns) {
        result[col.id] = dragCardPositions[col.id] ?? [];
      }
    } else {
      for (const col of orderedColumns) {
        result[col.id] = (groupedRows[col.id] ?? []).map((r) => r.id);
      }
    }
    return result;
  }, [orderedColumns, groupedRows, dragCardPositions]);

  // During drag, reorder rows based on dragCardPositions
  const getColumnRows = useCallback(
    (colId: string): DatabaseRow[] => {
      const ids = sortedRowIdsPerColumn[colId] ?? [];
      if (!dragCardPositions) return groupedRows[colId] ?? [];
      const rowMap = new Map(rows.map((r) => [r.id, r]));
      return ids
        .map((id) => rowMap.get(RowBrandId.parse(id)))
        .filter(Boolean) as DatabaseRow[];
    },
    [sortedRowIdsPerColumn, dragCardPositions, groupedRows, rows],
  );

  const hiddenGroups = useMemo(
    () => view.config.hiddenGroups ?? [],
    [view.config.hiddenGroups],
  );
  const hideEmptyGroups = view.config.hideEmptyGroups ?? false;

  // Filter out hidden columns and optionally empty ones
  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter((col) => {
        // Always hide explicitly hidden groups
        if (hiddenGroups.includes(col.id)) return false;
        // Hide empty groups if enabled (but always show __none__ if it has rows)
        if (
          hideEmptyGroups &&
          col.id !== "__none__" &&
          (groupedRows[col.id]?.length ?? 0) === 0
        )
          return false;
        // Hide __none__ if it's empty
        if (col.id === "__none__" && (groupedRows[col.id]?.length ?? 0) === 0)
          return false;
        return true;
      }),
    [orderedColumns, groupedRows, hiddenGroups, hideEmptyGroups],
  );

  const visibleColumnIds = useMemo(
    () => visibleColumns.map((col) => col.id),
    [visibleColumns],
  );

  const activeRow = activeId ? rows.find((r) => r.id === activeId) : null;
  const activeColumn =
    activeType === "column"
      ? visibleColumns.find((c) => c.id === activeId)
      : null;

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const type = (event.active.data.current?.type as string) ?? "card";
      setActiveId(event.active.id as string);
      setActiveType(type as "card" | "column");

      if (type === "card") {
        // Initialize drag positions from current groupedRows
        const positions: Record<string, string[]> = {};
        for (const col of orderedColumns) {
          positions[col.id] = (groupedRows[col.id] ?? []).map((r) => r.id);
        }
        setDragCardPositions(positions);
        dragSourceColumnRef.current =
          (event.active.data.current?.columnId as string) ?? null;
      }
    },
    [orderedColumns, groupedRows],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type === "column") return;

    const activeCardId = active.id as string;
    const overType = over.data.current?.type as string | undefined;
    const overColumnId = over.data.current?.columnId as string | undefined;

    // Only handle card or column drop targets
    if (overType !== "card" && overType !== "column") return;
    if (!overColumnId) return;
    const targetColId = overColumnId;

    setDragCardPositions((prev) => {
      if (!prev) return prev;

      // Find current column of the active card
      let sourceColId: string | null = null;
      for (const [colId, ids] of Object.entries(prev)) {
        if (ids.includes(activeCardId)) {
          sourceColId = colId;
          break;
        }
      }
      if (!sourceColId) return prev;

      const sourceIds = [...(prev[sourceColId] ?? [])];
      const targetIds =
        sourceColId === targetColId
          ? sourceIds
          : [...(prev[targetColId] ?? [])];

      const activeIndex = sourceIds.indexOf(activeCardId);
      if (activeIndex === -1) return prev;

      if (sourceColId === targetColId) {
        // Same column reorder
        if (overType === "card") {
          const overIndex = sourceIds.indexOf(over.id as string);
          if (overIndex === -1 || activeIndex === overIndex) return prev;
          return {
            ...prev,
            [sourceColId]: arrayMove(sourceIds, activeIndex, overIndex),
          };
        }
        return prev;
      }

      // Cross-column move
      sourceIds.splice(activeIndex, 1);
      if (overType === "card") {
        const overIndex = targetIds.indexOf(over.id as string);
        if (overIndex === -1) {
          targetIds.push(activeCardId);
        } else {
          targetIds.splice(overIndex, 0, activeCardId);
        }
      } else {
        // Dropping onto column droppable (empty area)
        targetIds.push(activeCardId);
      }

      return {
        ...prev,
        [sourceColId]: sourceIds,
        [targetColId]: targetIds,
      };
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const finalPositions = dragCardPositions;

      setActiveId(null);
      setActiveType(null);
      setDragCardPositions(null);
      dragSourceColumnRef.current = null;

      if (!over) return;

      // Column reorder
      if (active.data.current?.type === "column") {
        if (active.id !== over.id) {
          const oldIndex = visibleColumnIds.indexOf(active.id as string);
          const newIndex = visibleColumnIds.indexOf(over.id as string);
          if (oldIndex !== -1 && newIndex !== -1) {
            const allIds = orderedColumns.map((c) => c.id);
            const allOldIndex = allIds.indexOf(active.id as string);
            const allNewIndex = allIds.indexOf(over.id as string);
            if (allOldIndex !== -1 && allNewIndex !== -1) {
              const newOrder = arrayMove(allIds, allOldIndex, allNewIndex);
              onUpdateGroupOrder?.(newOrder);
            }
          }
        }
        return;
      }

      // Card move / reorder — persist final positions
      if (!finalPositions) return;

      const rowId = RowBrandId.parse(active.id as string);

      // Find which column the card ended up in
      let destColId: string | null = null;
      for (const [colId, ids] of Object.entries(finalPositions)) {
        if (ids.includes(rowId)) {
          destColId = colId;
          break;
        }
      }
      if (!destColId) return;

      // Persist cardOrder for affected columns (skip when explicit sorts are active)
      if (!hasSorts) {
        const newCardOrder = { ...(cardOrder ?? {}) };
        for (const [colId, ids] of Object.entries(finalPositions)) {
          const currentIds = (groupedRows[colId] ?? []).map((r) => r.id);
          const changed =
            ids.length !== currentIds.length ||
            ids.some((id, i) => currentIds[i] !== id);
          if (changed) {
            newCardOrder[colId] = ids as RowBrandId[];
          }
        }
        onUpdateView?.({ cardOrder: newCardOrder });
      }

      // If card moved to a different column, update the row's property value
      if (groupByPropId) {
        const row = rows.find((r) => r.id === rowId);
        if (row) {
          const currentValue = row.properties[groupByPropId] ?? null;
          const newValue = destColId === "__none__" ? null : destColId;
          if (currentValue !== newValue) {
            onUpdateRow(row.id, {
              [groupByPropId]: newValue as PropertyValue,
            } as Record<PropertyBrandId, PropertyValue>);
          }
        }
      }
    },
    [
      dragCardPositions,
      groupByPropId,
      rows,
      onUpdateRow,
      onUpdateGroupOrder,
      onUpdateView,
      visibleColumnIds,
      orderedColumns,
      hasSorts,
      cardOrder,
      groupedRows,
    ],
  );

  const handleColumnMenuAction = useCallback(
    (action: ColumnMenuAction) => {
      if (!groupByProp || !groupByPropId) return;

      switch (action.type) {
        case "color": {
          const updatedOptions = (groupByProp.options ?? []).map((opt) =>
            opt.id === action.optionId
              ? { ...opt, color: CssColor.parse(action.colorName) }
              : opt,
          );
          onUpdateProperty?.({
            ...database.properties[groupByPropId]!,
            options: updatedOptions,
          });
          break;
        }
        case "hide": {
          const newHidden = [...hiddenGroups, action.optionId];
          onUpdateView?.({ hiddenGroups: newHidden });
          break;
        }
        case "deletePages": {
          const colRows = groupedRows[action.optionId] ?? [];
          if (colRows.length === 0) return;
          if (onDeleteRows) {
            onDeleteRows(
              colRows.map((r) => r.id),
              colRows.map((r) => r.pageId),
            );
          }
          break;
        }
        case "rename": {
          const updatedOptions = (groupByProp.options ?? []).map((opt) =>
            opt.id === action.optionId
              ? { ...opt, name: DisplayName.parse(action.newName) }
              : opt,
          );
          onUpdateProperty?.({
            ...database.properties[groupByPropId]!,
            options: updatedOptions,
          });
          break;
        }
        case "editGroups": {
          onOpenGroupSettings?.();
          break;
        }
      }
    },
    [
      groupByProp,
      groupByPropId,
      database.properties,
      hiddenGroups,
      groupedRows,
      onUpdateProperty,
      onUpdateView,
      onDeleteRows,
      onOpenGroupSettings,
    ],
  );

  const handleAddGroup = useCallback(() => {
    if (!groupByProp || !groupByPropId) return;
    const randomColor =
      RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]!;
    const newOption: SelectOption = {
      id: SelectOptionBrandId.parse(uuidv4()),
      name: DisplayName.parse("New group"),
      color: CssColor.parse(randomColor),
    };
    const updatedOptions = [...(groupByProp.options ?? []), newOption];
    onUpdateProperty?.({
      ...database.properties[groupByPropId]!,
      options: updatedOptions,
    });
  }, [groupByProp, groupByPropId, database.properties, onUpdateProperty]);

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

          {/* + New group button */}
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
              color: "white",
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
