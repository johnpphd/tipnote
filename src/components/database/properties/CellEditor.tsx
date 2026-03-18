import { useState, useCallback } from "react";
import {
  TextField,
  Checkbox,
  Chip,
  Box,
  Select,
  MenuItem,
} from "@mui/material";
import type { PropertyDefinition, PropertyValue, NumberFormat } from "@/types";

interface CellEditorProps {
  property: PropertyDefinition;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
}

export default function CellEditor({
  property,
  value,
  onChange,
}: CellEditorProps) {
  switch (property.type) {
    case "title":
    case "text":
    case "url":
    case "person":
      return (
        <TextCellEditor value={(value as string) ?? ""} onChange={onChange} />
      );
    case "number":
      return (
        <NumberCellEditor
          value={value as number | null}
          onChange={onChange}
          numberFormat={property.numberFormat}
        />
      );
    case "checkbox":
      return (
        <CheckboxCellEditor
          value={(value as boolean) ?? false}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectCellEditor
          options={property.options ?? []}
          value={(value as string) ?? ""}
          onChange={onChange}
        />
      );
    case "multiSelect":
      return (
        <MultiSelectCellEditor
          options={property.options ?? []}
          value={(value as string[]) ?? []}
          onChange={onChange}
        />
      );
    case "date":
      return (
        <DateCellEditor value={(value as string) ?? ""} onChange={onChange} />
      );
    default:
      return <span>{String(value ?? "")}</span>;
  }
}

function TextCellEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: PropertyValue) => void;
}) {
  const [local, setLocal] = useState(value);

  const handleBlur = useCallback(() => {
    if (local !== value) onChange(local);
  }, [local, value, onChange]);

  return (
    <TextField
      size="small"
      variant="standard"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      fullWidth
      slotProps={{
        input: {
          disableUnderline: true,
          sx: { fontSize: "13px", py: 0 },
        },
      }}
    />
  );
}

function NumberCellEditor({
  value,
  onChange,
  numberFormat,
}: {
  value: number | null;
  onChange: (v: PropertyValue) => void;
  numberFormat?: NumberFormat;
}) {
  const [local, setLocal] = useState(value != null ? String(value) : "");

  const handleBlur = useCallback(() => {
    if (local === "") {
      if (value !== null) onChange(null);
      return;
    }
    const num = Number(local);
    if (
      !isFinite(num) ||
      (Number.isInteger(num) && !Number.isSafeInteger(num))
    ) {
      setLocal(value != null ? String(value) : "");
      return;
    }
    if (num !== value) onChange(num);
  }, [local, value, onChange]);

  return (
    <TextField
      size="small"
      variant="standard"
      type="number"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      fullWidth
      placeholder={numberFormat === "percent" ? "e.g. 0.53 = 53%" : undefined}
      slotProps={{
        input: {
          disableUnderline: true,
          sx: { fontSize: "13px", py: 0 },
        },
      }}
    />
  );
}

function CheckboxCellEditor({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: PropertyValue) => void;
}) {
  return (
    <Checkbox
      size="small"
      checked={value}
      onChange={(_, checked) => onChange(checked)}
      sx={{ p: 0 }}
    />
  );
}

function SelectCellEditor({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string; color: string }[];
  value: string;
  onChange: (v: PropertyValue) => void;
}) {
  return (
    <Select
      size="small"
      variant="standard"
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
      displayEmpty
      fullWidth
      disableUnderline
      sx={{ fontSize: "13px" }}
    >
      <MenuItem value="">
        <em>Empty</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.id} value={opt.id}>
          <Chip
            label={opt.name}
            size="small"
            sx={{
              bgcolor: opt.color,
              color: "white",
              height: 20,
              fontSize: "11px",
            }}
          />
        </MenuItem>
      ))}
    </Select>
  );
}

function MultiSelectCellEditor({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string; color: string }[];
  value: string[];
  onChange: (v: PropertyValue) => void;
}) {
  const handleToggle = (optId: string) => {
    const newValue = value.includes(optId)
      ? value.filter((v) => v !== optId)
      : [...value, optId];
    onChange(newValue);
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
      {options.map((opt) => (
        <Chip
          key={opt.id}
          label={opt.name}
          size="small"
          onClick={() => handleToggle(opt.id)}
          sx={{
            bgcolor: value.includes(opt.id) ? opt.color : "action.hover",
            color: value.includes(opt.id) ? "white" : "text.primary",
            height: 22,
            fontSize: "11px",
            cursor: "pointer",
          }}
        />
      ))}
    </Box>
  );
}

function DateCellEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: PropertyValue) => void;
}) {
  const [local, setLocal] = useState(value);

  return (
    <TextField
      size="small"
      variant="standard"
      type="date"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
      fullWidth
      slotProps={{
        input: {
          disableUnderline: true,
          sx: { fontSize: "13px", py: 0 },
        },
      }}
    />
  );
}
