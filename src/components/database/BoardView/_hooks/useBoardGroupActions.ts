import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyDefinition,
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
import type { ColumnMenuAction } from "../BoardColumn";

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

interface UseBoardGroupActionsArgs {
  database: Database;
  groupByProp: PropertyDefinition | null;
  groupByPropId: PropertyBrandId | undefined;
  hiddenGroups: string[];
  groupedRows: Record<string, DatabaseRow[]>;
  onUpdateProperty?: (property: PropertyDefinition) => void;
  onUpdateView?: (config: Partial<DatabaseView["config"]>) => void;
  onDeleteRows?: (rowIds: RowBrandId[], pageIds: PageBrandId[]) => void;
  onOpenGroupSettings?: () => void;
}

export function useBoardGroupActions({
  database,
  groupByProp,
  groupByPropId,
  hiddenGroups,
  groupedRows,
  onUpdateProperty,
  onUpdateView,
  onDeleteRows,
  onOpenGroupSettings,
}: UseBoardGroupActionsArgs) {
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

  return { handleColumnMenuAction, handleAddGroup };
}
