import { useState, useCallback, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
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
  Typography,
  Checkbox,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import {
  Add as AddIcon,
  TextFields as TitleIcon,
  Notes as TextIcon,
  CalendarToday as DateIcon,
  Tag as SelectIcon,
  CheckBox as CheckboxIcon,
  Numbers as NumberIcon,
  Link as UrlIcon,
  Person as PersonIcon,
  Star as RatingIcon,
  Percent as PercentIcon,
  Tag as TagIcon,
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  NumberFormat,
  PropertyDefinition,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId, PageBrandId } from "@/types";
import CellEditor from "../properties/CellEditor";
import CellDisplay from "../properties/CellDisplay";
import { FONT_WEIGHT_REGULAR, FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";
import { NOTION_COLORS } from "@/theme/notionColors";

function resolveColor(color: string): string {
  return NOTION_COLORS[color] ?? color;
}

/** Convert a hex color to an rgba string at the given opacity */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const borderSubtleSx = { borderBottom: 1, borderColor: "divider" } as const;

const checkboxSx = {
  p: 0,
  color: "text.disabled",
  "&.Mui-checked": { color: "primary.main" },
} as const;

const PROPERTY_TYPE_ICONS: Record<string, React.ReactElement> = {
  title: <TitleIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  text: <TextIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  number: <NumberIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  select: <SelectIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  multiSelect: <SelectIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  date: <DateIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  checkbox: <CheckboxIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  url: <UrlIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  person: <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
  rating: <RatingIcon sx={{ fontSize: 14, color: "text.secondary" }} />,
};

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
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    propId: string;
  } | null>(null);

  const [headerMenu, setHeaderMenu] = useState<{
    anchorEl: HTMLElement;
    property: PropertyDefinition;
  } | null>(null);

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

  // Build color map for row-level background coloring
  const colorByPropId = view.config.colorBy;
  const optionColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!colorByPropId) return map;
    const prop = database.properties[colorByPropId];
    if (prop?.options) {
      for (const opt of prop.options) {
        map.set(opt.id, resolveColor(opt.color));
      }
    }
    return map;
  }, [database, colorByPropId]);

  /** Returns [bgColor, hoverBgColor] or [undefined, undefined] */
  const getRowColors = useCallback(
    (row: DatabaseRow): [string | undefined, string | undefined] => {
      if (!colorByPropId || optionColorMap.size === 0)
        return [undefined, undefined];
      const value = row.properties[colorByPropId];
      let hex: string | undefined;
      if (typeof value === "string" && optionColorMap.has(value)) {
        hex = optionColorMap.get(value)!;
      } else if (Array.isArray(value) && value.length > 0) {
        const firstId = value[0] as string;
        if (optionColorMap.has(firstId)) {
          hex = optionColorMap.get(firstId)!;
        }
      }
      if (!hex) return [undefined, undefined];
      return [hexToRgba(hex, 0.1), hexToRgba(hex, 0.18)];
    },
    [colorByPropId, optionColorMap],
  );

  const handleNumberFormatChange = useCallback(
    (property: PropertyDefinition, format: NumberFormat) => {
      onUpdateProperty?.({ ...property, numberFormat: format });
      setHeaderMenu(null);
    },
    [onUpdateProperty],
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const visibleProperties = useMemo(() => {
    const visible = view.config.visibleProperties;
    return database.propertyOrder
      .filter((id) => visible.includes(id))
      .map((id) => database.properties[id])
      .filter(Boolean);
  }, [database, view.config.visibleProperties]);

  const handleCellChange = useCallback(
    (rowId: RowBrandId, propId: PropertyBrandId, value: PropertyValue) => {
      onUpdateRow(rowId, { [propId]: value } as Record<
        PropertyBrandId,
        PropertyValue
      >);
      setEditingCell(null);
    },
    [onUpdateRow],
  );

  const columns = useMemo<ColumnDef<DatabaseRow>[]>(
    () =>
      visibleProperties.map((prop: PropertyDefinition) => ({
        id: prop.id,
        accessorFn: (row: DatabaseRow) => row.properties[prop.id],
        header: () => (
          <Box
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              if (prop.type === "number") {
                setHeaderMenu({ anchorEl: e.currentTarget, property: prop });
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              cursor: prop.type === "number" ? "pointer" : "default",
              borderRadius: 0.5,
              mx: -0.5,
              px: 0.5,
              ...(prop.type === "number" && {
                "&:hover": { bgcolor: "action.hover" },
              }),
            }}
          >
            {PROPERTY_TYPE_ICONS[prop.type] ?? (
              <TextIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: FONT_WEIGHT_REGULAR,
                fontSize: "13px",
                color: "text.secondary",
              }}
            >
              {prop.name}
            </Typography>
          </Box>
        ),
        cell: ({ row: tableRow }) => {
          const rowData = tableRow.original;
          const value = rowData.properties[prop.id] ?? null;

          if (isReadOnly) {
            return (
              <Box
                sx={{
                  minHeight: 28,
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  minWidth: 0,
                }}
              >
                <CellDisplay property={prop} value={value} />
              </Box>
            );
          }

          const isEditing =
            editingCell?.rowId === rowData.id &&
            editingCell?.propId === prop.id;

          if (isEditing) {
            return (
              <CellEditor
                property={prop}
                value={value}
                onChange={(newValue) =>
                  handleCellChange(rowData.id, prop.id, newValue)
                }
              />
            );
          }

          return (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (prop.type === "title") {
                  onRowClick?.(rowData);
                } else {
                  setEditingCell({ rowId: rowData.id, propId: prop.id });
                }
              }}
              sx={{
                cursor: prop.type === "title" ? "pointer" : "text",
                minHeight: 28,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <CellDisplay property={prop} value={value} />
            </Box>
          );
        },
        size: prop.type === "title" ? 280 : 160,
        minSize: 80,
      })),
    [visibleProperties, editingCell, handleCellChange, onRowClick, isReadOnly],
  );

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
              {/* Add column button */}
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
                sx={{ height: paddingTop, p: 0, border: "none" }}
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
                sx={{ height: paddingBottom, p: 0, border: "none" }}
                colSpan={columns.length + 1 + (isReadOnly ? 0 : 1)}
              />
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Column header format menu */}
      <Popover
        open={Boolean(headerMenu)}
        anchorEl={headerMenu?.anchorEl}
        onClose={() => setHeaderMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {headerMenu?.property.type === "number" && (
          <Box sx={{ p: 0.5, minWidth: 180 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.5,
                color: "text.secondary",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Number format
            </Typography>
            <List dense disablePadding>
              <ListItemButton
                dense
                selected={
                  !headerMenu.property.numberFormat ||
                  headerMenu.property.numberFormat === "number"
                }
                onClick={() =>
                  handleNumberFormatChange(headerMenu.property, "number")
                }
                sx={{ borderRadius: 1, py: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <TagIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Number"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontSize: "13px",
                  }}
                />
              </ListItemButton>
              <ListItemButton
                dense
                selected={headerMenu.property.numberFormat === "percent"}
                onClick={() =>
                  handleNumberFormatChange(headerMenu.property, "percent")
                }
                sx={{ borderRadius: 1, py: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <PercentIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Percent"
                  primaryTypographyProps={{
                    variant: "body2",
                    fontSize: "13px",
                  }}
                />
              </ListItemButton>
            </List>
          </Box>
        )}
      </Popover>

      {/* Bulk action toolbar */}
      {selectedRowIds.size > 0 && !isReadOnly && (
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: "primary.main",
            borderRadius: "12px",
            mx: 2,
            mb: 1,
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            zIndex: 10,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "white",
              fontWeight: FONT_WEIGHT_MEDIUM,
              fontSize: "13px",
            }}
          >
            {selectedRowIds.size} selected
          </Typography>
          <Button
            size="small"
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={handleDeleteSelected}
            sx={{
              color: "white",
              textTransform: "none",
              fontSize: "13px",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            Delete
          </Button>
          <Box sx={{ flex: 1 }} />
          <IconButton
            size="small"
            onClick={handleClearSelection}
            aria-label="Clear selection"
            sx={{ color: "white", p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* Add row button - matches Notion's "New page" row */}
      {!isReadOnly && (
        <Box
          component="button"
          role="button"
          tabIndex={0}
          onClick={onAddRow}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onAddRow();
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            pl: 4.5,
            py: 0.5,
            width: "100%",
            border: "none",
            background: "none",
            ...borderSubtleSx,
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <AddIcon sx={{ fontSize: 14, color: "text.secondary", mr: 0.5 }} />
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "13px" }}
          >
            New page
          </Typography>
        </Box>
      )}
    </Box>
  );
}
