import { Chip } from "@mui/material";
import type { Database, PropertyType, ViewFilter } from "@/types";
import {
  PROPERTY_TYPE_ICONS,
  FILTER_CHIP_BG,
  FILTER_CHIP_FG,
  FILTER_CHIP_FG_MUTED,
  getOperatorLabel,
} from "./toolbarConstants";

interface FilterChipsProps {
  database: Database;
  filters: ViewFilter[];
  isReadOnly?: boolean;
  onChipClick: (anchor: HTMLElement) => void;
  onRemove: (index: number) => void;
}

export default function FilterChips({
  database,
  filters,
  isReadOnly,
  onChipClick,
  onRemove,
}: FilterChipsProps) {
  return (
    <>
      {filters.map((filter, i) => {
        const propDef = database.properties[filter.propertyId];
        const propName = propDef?.name ?? "Unknown";
        const propType: PropertyType = propDef?.type ?? "text";
        const operatorLabel = getOperatorLabel(propType, filter.operator);
        const resolveDisplayValue = (val: string): string => {
          if (
            (propType === "select" || propType === "multiSelect") &&
            propDef?.options
          ) {
            const opt = propDef.options.find((o) => o.id === val);
            if (opt) return opt.name;
          }
          return val;
        };
        const valueStr =
          filter.value == null || filter.value === ""
            ? ""
            : Array.isArray(filter.value)
              ? (filter.value as string[]).map(resolveDisplayValue).join(", ")
              : resolveDisplayValue(String(filter.value));
        const chipLabel = valueStr
          ? `${propName} ${operatorLabel} ${valueStr}`
          : `${propName} ${operatorLabel}`;
        return (
          <Chip
            key={i}
            icon={PROPERTY_TYPE_ICONS[propType]}
            label={chipLabel}
            size="small"
            onClick={
              isReadOnly ? undefined : (e) => onChipClick(e.currentTarget)
            }
            onDelete={isReadOnly ? undefined : () => onRemove(i)}
            sx={{
              maxWidth: { xs: 150, sm: 220 },
              fontSize: "12px",
              bgcolor: FILTER_CHIP_BG,
              color: FILTER_CHIP_FG,
              borderRadius: "3px",
              height: 24,
              "& .MuiChip-icon": {
                color: FILTER_CHIP_FG,
                ml: 0.5,
              },
              "& .MuiChip-deleteIcon": {
                color: FILTER_CHIP_FG_MUTED,
                fontSize: 16,
                "&:hover": {
                  color: FILTER_CHIP_FG,
                },
              },
            }}
          />
        );
      })}
    </>
  );
}
