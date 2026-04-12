import { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  ListItemText,
  type SelectChangeEvent,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useDebouncedCallback } from "use-debounce";
import {
  FILTER_OPERATORS,
  defaultOperatorForType,
} from "@/lib/database/filterEngine";
import type {
  Database,
  ViewFilter,
  PropertyType,
  PropertyDefinition,
} from "@/types";
import { PropertyBrandId, FilterOperator } from "@/types";

const compactSx = {
  fontSize: "12px",
  "& .MuiSelect-select": { py: 0.5, px: 1, fontSize: "12px" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
} as const;

const compactInputSx = {
  "& .MuiInputBase-input": { py: 0.5, px: 1, fontSize: "12px" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
} as const;

interface FilterRowProps {
  filter: ViewFilter;
  index: number;
  database: Database;
  onChange: (index: number, updated: ViewFilter) => void;
  onRemove: (index: number) => void;
}

export default function FilterRow({
  filter,
  index,
  database,
  onChange,
  onRemove,
}: FilterRowProps) {
  const propDef = database.properties[filter.propertyId];
  const propType: PropertyType = propDef?.type ?? "text";
  const operators = FILTER_OPERATORS[propType] ?? FILTER_OPERATORS.text;
  const isNoValueOperator = [
    "is_empty",
    "is_not_empty",
    "is_checked",
    "is_unchecked",
  ].includes(filter.operator);

  const handlePropertyChange = (e: SelectChangeEvent<string>) => {
    const newPropId = PropertyBrandId.parse(e.target.value);
    const newPropDef = database.properties[newPropId];
    const newType: PropertyType = newPropDef?.type ?? "text";
    onChange(index, {
      propertyId: newPropId,
      operator: defaultOperatorForType(newType),
      value: "",
    });
  };

  const handleOperatorChange = (e: SelectChangeEvent<string>) => {
    const newOp = FilterOperator.parse(e.target.value);
    const noValue = [
      "is_empty",
      "is_not_empty",
      "is_checked",
      "is_unchecked",
    ].includes(newOp);
    onChange(index, {
      ...filter,
      operator: newOp,
      value: noValue ? "" : filter.value,
    });
  };

  const handleValueChange = (value: unknown) => {
    onChange(index, { ...filter, value });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        py: 0.25,
      }}
    >
      {/* Spacer (drag reordering not yet implemented) */}
      <Box sx={{ width: 14 }} />

      {/* Property selector */}
      <Select
        size="small"
        value={filter.propertyId}
        onChange={handlePropertyChange}
        sx={{ ...compactSx, minWidth: 100, maxWidth: 130 }}
      >
        {database.propertyOrder.map((propId) => {
          const prop = database.properties[propId];
          if (!prop) return null;
          return (
            <MenuItem key={propId} value={propId} sx={{ fontSize: "12px" }}>
              {prop.name}
            </MenuItem>
          );
        })}
      </Select>

      {/* Operator selector */}
      <Select
        size="small"
        value={filter.operator}
        onChange={handleOperatorChange}
        sx={{ ...compactSx, minWidth: 90, maxWidth: 130 }}
      >
        {operators.map((op) => (
          <MenuItem key={op.value} value={op.value} sx={{ fontSize: "12px" }}>
            {op.label}
          </MenuItem>
        ))}
      </Select>

      {/* Value input (type-specific) */}
      {!isNoValueOperator && (
        <ValueInput
          propType={propType}
          propDef={propDef}
          value={filter.value}
          onChange={handleValueChange}
        />
      )}

      {/* Remove button */}
      <IconButton size="small" onClick={() => onRemove(index)} sx={{ p: 0.25 }}>
        <CloseIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      </IconButton>
    </Box>
  );
}

interface ValueInputProps {
  propType: PropertyType;
  propDef: PropertyDefinition | undefined;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ValueInput({ propType, propDef, value, onChange }: ValueInputProps) {
  if (propType === "checkbox") {
    // Checkbox type has no value input -- operator is the value
    return null;
  }

  if (propType === "select" && propDef?.options) {
    return (
      <Select
        size="small"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        sx={{ ...compactSx, minWidth: 100, flex: 1 }}
      >
        <MenuItem value="" sx={{ fontSize: "12px", color: "text.secondary" }}>
          Select...
        </MenuItem>
        {propDef.options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: "12px" }}>
            {opt.name}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (propType === "multiSelect" && propDef?.options) {
    const selected = Array.isArray(value)
      ? (value as string[])
      : typeof value === "string" && value
        ? [value]
        : [];

    const idToName: Record<string, string> = {};
    for (const o of propDef.options ?? []) {
      idToName[o.id] = o.name;
    }

    return (
      <Select
        size="small"
        multiple
        value={selected}
        onChange={(e) => {
          const val = e.target.value;
          onChange(typeof val === "string" ? val.split(",") : val);
        }}
        renderValue={(sel) =>
          (sel as string[]).map((id) => idToName[id] ?? id).join(", ") ||
          "Select..."
        }
        displayEmpty
        sx={{ ...compactSx, minWidth: 100, flex: 1 }}
      >
        {propDef.options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: "12px" }}>
            <Checkbox
              size="small"
              checked={selected.includes(opt.id)}
              sx={{ p: 0, mr: 0.5 }}
            />
            <ListItemText
              primary={opt.name}
              primaryTypographyProps={{ fontSize: "12px" }}
            />
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (propType === "number") {
    return (
      <TextField
        size="small"
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const num = e.target.value === "" ? "" : Number(e.target.value);
          onChange(num);
        }}
        placeholder="Value"
        sx={{ ...compactInputSx, minWidth: 80, flex: 1 }}
      />
    );
  }

  if (propType === "date") {
    return (
      <TextField
        size="small"
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        sx={{ ...compactInputSx, minWidth: 130, flex: 1 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    );
  }

  // Default: text input for text, title, url, person
  return <DebouncedTextInput value={value} onChange={onChange} />;
}

function DebouncedTextInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [local, setLocal] = useState(typeof value === "string" ? value : "");
  const externalValue = typeof value === "string" ? value : "";

  useEffect(() => {
    setLocal(externalValue);
  }, [externalValue]);

  const debouncedOnChange = useDebouncedCallback((v: string) => {
    onChange(v);
  }, 300);

  return (
    <TextField
      size="small"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        debouncedOnChange(e.target.value);
      }}
      placeholder="Value..."
      sx={{ ...compactInputSx, minWidth: 80, flex: 1 }}
    />
  );
}
