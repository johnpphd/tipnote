import { useState, useCallback } from "react";
import type { DatabaseRow } from "@/types";
import type { RowBrandId, PageBrandId } from "@/types";

interface UseRowSelectionArgs {
  rows: DatabaseRow[];
  onDeleteRows?: (rowIds: RowBrandId[], pageIds: PageBrandId[]) => void;
}

export function useRowSelection({ rows, onDeleteRows }: UseRowSelectionArgs) {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  const handleToggleRow = useCallback((rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    setSelectedRowIds((prev) => {
      if (prev.size === rows.length && rows.length > 0) {
        return new Set();
      }
      return new Set(rows.map((r) => r.id));
    });
  }, [rows]);

  const handleDeleteSelected = useCallback(async () => {
    if (!onDeleteRows || selectedRowIds.size === 0) return;
    const selectedRows = rows.filter((r) => selectedRowIds.has(r.id));
    const rowIds = selectedRows.map((r) => r.id);
    const pageIds = selectedRows.map((r) => r.pageId);
    await onDeleteRows(rowIds, pageIds);
    setSelectedRowIds(new Set());
  }, [onDeleteRows, selectedRowIds, rows]);

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  return {
    selectedRowIds,
    handleToggleRow,
    handleToggleAll,
    handleDeleteSelected,
    handleClearSelection,
  };
}
