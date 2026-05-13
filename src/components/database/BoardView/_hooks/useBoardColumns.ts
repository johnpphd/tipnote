import { useMemo } from "react";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  SelectOption,
} from "@/types";
import { resolveColor } from "@/theme/notionColors";

export interface BoardColumnInfo {
  id: string;
  label: string;
  color: string;
}

interface UseBoardColumnsArgs {
  database: Database;
  view: DatabaseView;
  rows: DatabaseRow[];
}

export function useBoardColumns({ database, view, rows }: UseBoardColumnsArgs) {
  const groupByPropId = view.config.groupBy;
  const groupByProp = groupByPropId ? database.properties[groupByPropId] : null;

  const columns = useMemo<BoardColumnInfo[]>(() => {
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

  const orderedColumns = useMemo(() => {
    if (view.config.groupSortOrder === "alphabetical") {
      const none = columns.find((c) => c.id === "__none__");
      const rest = columns
        .filter((c) => c.id !== "__none__")
        .sort((a, b) => a.label.localeCompare(b.label));
      return none ? [none, ...rest] : rest;
    }

    const savedOrder = view.config.groupOrder;
    if (!savedOrder || savedOrder.length === 0) return columns;

    const columnMap = new Map(columns.map((col) => [col.id, col]));
    const ordered: BoardColumnInfo[] = [];

    for (const id of savedOrder) {
      const col = columnMap.get(id);
      if (col) {
        ordered.push(col);
        columnMap.delete(id);
      }
    }

    for (const col of columnMap.values()) {
      ordered.push(col);
    }

    return ordered;
  }, [columns, view.config.groupOrder, view.config.groupSortOrder]);

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

  const hasSorts = view.config.sorts.length > 0;
  const cardOrder = view.config.cardOrder;

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

  const hiddenGroups = useMemo(
    () => view.config.hiddenGroups ?? [],
    [view.config.hiddenGroups],
  );
  const hideEmptyGroups = view.config.hideEmptyGroups ?? false;

  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter((col) => {
        if (hiddenGroups.includes(col.id)) return false;
        if (
          hideEmptyGroups &&
          col.id !== "__none__" &&
          (groupedRows[col.id]?.length ?? 0) === 0
        )
          return false;
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

  return {
    groupByPropId,
    groupByProp,
    orderedColumns,
    groupedRows,
    hasSorts,
    cardOrder,
    hiddenGroups,
    visibleColumns,
    visibleColumnIds,
  };
}
