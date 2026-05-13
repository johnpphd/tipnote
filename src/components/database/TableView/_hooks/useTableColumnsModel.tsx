import { useState, useCallback, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import type { ColumnDef } from "@tanstack/react-table";
import {
  TextFields as TitleIcon,
  Notes as TextIcon,
  CalendarToday as DateIcon,
  Tag as SelectIcon,
  CheckBox as CheckboxIcon,
  Numbers as NumberIcon,
  Link as UrlIcon,
  Person as PersonIcon,
  Star as RatingIcon,
} from "@mui/icons-material";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  NumberFormat,
  PropertyDefinition,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId } from "@/types";
import CellEditor from "../../properties/CellEditor";
import CellDisplay from "../../properties/CellDisplay";
import { FONT_WEIGHT_REGULAR } from "@/theme/fontWeights";
import { buildOptionColorMap, getRowColorHex } from "../../colorUtils";

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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type HeaderMenuState = {
  anchorEl: HTMLElement;
  property: PropertyDefinition;
} | null;

interface UseTableColumnsModelArgs {
  database: Database;
  view: DatabaseView;
  isReadOnly?: boolean;
  onRowClick?: (row: DatabaseRow) => void;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
}

export function useTableColumnsModel({
  database,
  view,
  isReadOnly,
  onRowClick,
  onUpdateRow,
  onUpdateProperty,
}: UseTableColumnsModelArgs) {
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    propId: string;
  } | null>(null);
  const [headerMenu, setHeaderMenu] = useState<HeaderMenuState>(null);

  const colorByPropId = view.config.colorBy;
  const optionColorMap = useMemo(
    () => buildOptionColorMap(database, colorByPropId),
    [database, colorByPropId],
  );

  const getRowColors = useCallback(
    (row: DatabaseRow): [string | undefined, string | undefined] => {
      const hex = getRowColorHex(row, colorByPropId, optionColorMap);
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

  const visibleProperties = useMemo(() => {
    const visible = view.config.visibleProperties;
    return database.propertyOrder
      .filter((id) => visible.includes(id))
      .map((id) => database.properties[id])
      .filter(Boolean);
  }, [database, view.config.visibleProperties]);

  const handleCellChange = useCallback(
    (
      rowId: RowBrandId | undefined,
      propId: PropertyBrandId | undefined,
      value: PropertyValue,
    ) => {
      if (!rowId || !propId) return;
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

  return {
    columns,
    visibleProperties,
    getRowColors,
    headerMenu,
    setHeaderMenu,
    handleNumberFormatChange,
  };
}
