import { useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Checkbox,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyDefinition,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId, PageBrandId } from "@/types";
import { useRowSelection } from "./_hooks/useRowSelection";
import { useTableColumnsModel } from "./_hooks/useTableColumnsModel";
import BulkActionsBar from "./_components/BulkActionsBar";
import HeaderFormatMenu from "./_components/HeaderFormatMenu";
import AddRowFooter from "./_components/AddRowFooter";

const borderSubtleSx = { borderBottom: 1, borderColor: "divider" } as const;

const checkboxSx = {
  p: 0,
  color: "text.disabled",
  "&.Mui-checked": { color: "primary.main" },
} as const;

interface TableViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onAddRow: () => void;
  onRowClick?: (row: DatabaseRow) => void;
  onAddProperty?: (anchor: HTMLElement) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
  onDeleteRows?: (rowIds: RowBrandId[], pageIds: PageBrandId[]) => void;
  isReadOnly?: boolean;
}

export default function TableView({
  database,
  rows,
  view,
  onUpdateRow,
  onAddRow,
  onRowClick,
  onAddProperty,
  onUpdateProperty,
  onDeleteRows,
  isReadOnly,
}: TableViewProps) {
  const {
    selectedRowIds,
    handleToggleRow,
    handleToggleAll,
    handleDeleteSelected,
    handleClearSelection,
  } = useRowSelection({ rows, onDeleteRows });

  const {
    columns,
    getRowColors,
    headerMenu,
    setHeaderMenu,
    handleNumberFormatChange,
  } = useTableColumnsModel({
    database,
    view,
    isReadOnly,
    onRowClick,
    onUpdateRow,
    onUpdateProperty,
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
  });

  const { rows: tableRows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
        virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <Box
      ref={tableContainerRef}
      sx={{
        overflow: "auto",
        maxHeight: "calc(100vh - 200px)",
        position: "relative",
        scrollbarGutter: "stable",
      }}
    >
      <Table
        size="small"
        sx={{
          tableLayout: "fixed",
          width: table.getTotalSize(),
          minWidth: "100%",
        }}
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              <TableCell
                sx={{
                  width: 32,
                  minWidth: 32,
                  maxWidth: 32,
                  p: 0,
                  pl: 0.5,
                  ...borderSubtleSx,
                  bgcolor: "background.default",
                }}
              >
                <Checkbox
                  size="small"
                  aria-label="Select all rows"
                  checked={
                    rows.length > 0 && selectedRowIds.size === rows.length
                  }
                  indeterminate={
                    selectedRowIds.size > 0 && selectedRowIds.size < rows.length
                  }
                  onChange={handleToggleAll}
                  sx={{
                    p: 0,
                    color: "text.disabled",
                    "&.Mui-checked": { color: "primary.main" },
                    "&.MuiCheckbox-indeterminate": { color: "primary.main" },
                  }}
                />
              </TableCell>
              {headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    width: header.getSize(),
                    position: "relative",
                    ...borderSubtleSx,
                    py: 0.75,
                    px: 1.5,
                    bgcolor: "background.default",
                    userSelect: "none",
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  <Box
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      height: "100%",
                      width: 4,
                      cursor: "col-resize",
                      opacity: 0,
                      "&:hover": {
                        opacity: 1,
                        bgcolor: "primary.main",
                      },
                    }}
                  />
                </TableCell>
              ))}
              {!isReadOnly && (
                <TableCell
                  sx={{
                    width: 32,
                    minWidth: 32,
                    p: 0,
                    ...borderSubtleSx,
                    bgcolor: "background.default",
                  }}
                >
                  <IconButton
                    size="small"
                    aria-label="Add column"
                    onClick={(e) => onAddProperty?.(e.currentTarget)}
                    sx={{ p: 0.5 }}
                  >
                    <AddIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {virtualItems.length > 0 && paddingTop > 0 && (
            <TableRow>
              <TableCell
                sx={{ height: paddingTop, p: 0, border: 0 }}
                colSpan={columns.length + 1 + (isReadOnly ? 0 : 1)}
              />
            </TableRow>
          )}
          {virtualItems.map((virtualRow) => {
            const row = tableRows[virtualRow.index];
            const [rowBg, rowBgHover] = getRowColors(row.original);
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => rowVirtualizer.measureElement(node)}
                sx={{
                  ...(rowBg ? { bgcolor: rowBg } : {}),
                  "&:hover": { bgcolor: rowBgHover ?? "action.hover" },
                }}
              >
                <TableCell
                  sx={{
                    width: 32,
                    minWidth: 32,
                    maxWidth: 32,
                    p: 0,
                    pl: 0.5,
                    ...borderSubtleSx,
                  }}
                >
                  <Checkbox
                    size="small"
                    aria-label="Select row"
                    checked={selectedRowIds.has(row.original.id)}
                    onChange={() => handleToggleRow(row.original.id)}
                    sx={checkboxSx}
                  />
                </TableCell>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    sx={{
                      width: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                      py: 0.5,
                      px: 1.5,
                      ...borderSubtleSx,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {virtualItems.length > 0 && paddingBottom > 0 && (
            <TableRow>
              <TableCell
                sx={{ height: paddingBottom, p: 0, border: 0 }}
                colSpan={columns.length + 1 + (isReadOnly ? 0 : 1)}
              />
            </TableRow>
          )}
        </TableBody>
      </Table>

      <HeaderFormatMenu
        headerMenu={headerMenu}
        onClose={() => setHeaderMenu(null)}
        onNumberFormatChange={handleNumberFormatChange}
      />

      {selectedRowIds.size > 0 && !isReadOnly && (
        <BulkActionsBar
          selectedCount={selectedRowIds.size}
          onDelete={handleDeleteSelected}
          onClear={handleClearSelection}
        />
      )}

      {!isReadOnly && <AddRowFooter onAddRow={onAddRow} />}
    </Box>
  );
}
