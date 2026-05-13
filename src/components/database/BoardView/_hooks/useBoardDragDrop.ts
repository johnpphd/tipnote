import { useCallback, useMemo, useRef, useState } from "react";
import {
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DatabaseRow, DatabaseView, PropertyValue } from "@/types";
import { RowBrandId, type PropertyBrandId } from "@/types";
import type { BoardColumnInfo } from "./useBoardColumns";

type Positions = Record<string, string[]>;

function applyCardDragOver(
  prev: Positions,
  activeCardId: string,
  overId: string,
  overType: "card" | "column",
  targetColId: string,
): Positions {
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
    sourceColId === targetColId ? sourceIds : [...(prev[targetColId] ?? [])];

  const activeIndex = sourceIds.indexOf(activeCardId);
  if (activeIndex === -1) return prev;

  if (sourceColId === targetColId) {
    if (overType === "card") {
      const overIndex = sourceIds.indexOf(overId);
      if (overIndex === -1 || activeIndex === overIndex) return prev;
      return {
        ...prev,
        [sourceColId]: arrayMove(sourceIds, activeIndex, overIndex),
      };
    }
    return prev;
  }

  sourceIds.splice(activeIndex, 1);
  if (overType === "card") {
    const overIndex = targetIds.indexOf(overId);
    if (overIndex === -1) {
      targetIds.push(activeCardId);
    } else {
      targetIds.splice(overIndex, 0, activeCardId);
    }
  } else {
    targetIds.push(activeCardId);
  }

  return {
    ...prev,
    [sourceColId]: sourceIds,
    [targetColId]: targetIds,
  };
}

function computeColumnReorder(
  visibleColumnIds: string[],
  orderedColumnIds: string[],
  activeId: string,
  overId: string,
): string[] | null {
  if (activeId === overId) return null;
  const oldIndex = visibleColumnIds.indexOf(activeId);
  const newIndex = visibleColumnIds.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return null;
  const allOldIndex = orderedColumnIds.indexOf(activeId);
  const allNewIndex = orderedColumnIds.indexOf(overId);
  if (allOldIndex === -1 || allNewIndex === -1) return null;
  return arrayMove(orderedColumnIds, allOldIndex, allNewIndex);
}

interface UseBoardDragDropArgs {
  orderedColumns: BoardColumnInfo[];
  groupedRows: Record<string, DatabaseRow[]>;
  visibleColumnIds: string[];
  groupByPropId: PropertyBrandId | undefined;
  rows: DatabaseRow[];
  hasSorts: boolean;
  cardOrder: DatabaseView["config"]["cardOrder"];
  isReadOnly?: boolean;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onUpdateGroupOrder?: (order: string[]) => void;
  onUpdateView?: (config: Partial<DatabaseView["config"]>) => void;
}

export function useBoardDragDrop({
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
}: UseBoardDragDropArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [dragCardPositions, setDragCardPositions] = useState<Record<
    string,
    string[]
  > | null>(null);
  const dragSourceColumnRef = useRef<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const sensors = useSensors(isReadOnly ? undefined : pointerSensor);

  const sortedRowIdsPerColumn = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (dragCardPositions) {
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const type = (event.active.data.current?.type as string) ?? "card";
      setActiveId(event.active.id as string);
      setActiveType(type as "card" | "column");

      if (type === "card") {
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

    const overType = over.data.current?.type as string | undefined;
    const overColumnId = over.data.current?.columnId as string | undefined;
    if (overType !== "card" && overType !== "column") return;
    if (!overColumnId) return;

    setDragCardPositions((prev) =>
      prev
        ? applyCardDragOver(
            prev,
            active.id as string,
            over.id as string,
            overType,
            overColumnId,
          )
        : prev,
    );
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

      if (active.data.current?.type === "column") {
        const newOrder = computeColumnReorder(
          visibleColumnIds,
          orderedColumns.map((c) => c.id),
          active.id as string,
          over.id as string,
        );
        if (newOrder) onUpdateGroupOrder?.(newOrder);
        return;
      }

      if (!finalPositions) return;

      const rowId = RowBrandId.parse(active.id as string);

      let destColId: string | null = null;
      for (const [colId, ids] of Object.entries(finalPositions)) {
        if (ids.includes(rowId)) {
          destColId = colId;
          break;
        }
      }
      if (!destColId) return;

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

  return {
    activeId,
    activeType,
    sensors,
    sortedRowIdsPerColumn,
    getColumnRows,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
