import { useState } from "react";
import {
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import {
  TextFields as TextIcon,
  Tag as NumberIcon,
  ArrowDropDownCircle as SelectIcon,
  Checklist as MultiSelectIcon,
  CalendarToday as DateIcon,
  CheckBox as CheckboxIcon,
  Link as UrlIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { addProperty, updatePropertyOrder } from "@/lib/database/databases";
import type { Database, PropertyType } from "@/types";
import { PropertyBrandId, DisplayName } from "@/types";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

const PROPERTY_TYPES: {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "text", label: "Text", icon: <TextIcon fontSize="small" /> },
  { type: "number", label: "Number", icon: <NumberIcon fontSize="small" /> },
  { type: "select", label: "Select", icon: <SelectIcon fontSize="small" /> },
  {
    type: "multiSelect",
    label: "Multi-select",
    icon: <MultiSelectIcon fontSize="small" />,
  },
  { type: "date", label: "Date", icon: <DateIcon fontSize="small" /> },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: <CheckboxIcon fontSize="small" />,
  },
  { type: "url", label: "URL", icon: <UrlIcon fontSize="small" /> },
  { type: "person", label: "Person", icon: <PersonIcon fontSize="small" /> },
];

interface AddPropertyMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  database: Database;
}

export default function AddPropertyMenu({
  anchorEl,
  onClose,
  database,
}: AddPropertyMenuProps) {
  const [step, setStep] = useState<"type" | "name">("type");
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSelectType = (type: PropertyType) => {
    setSelectedType(type);
    setName("");
    setStep("name");
  };

  const handleCreate = async () => {
    if (!selectedType || !name.trim()) return;

    const propId = PropertyBrandId.parse(uuidv4());
    try {
      setError("");
      await addProperty(database.id, {
        id: propId,
        name: DisplayName.parse(name.trim()),
        type: selectedType,
        ...(selectedType === "select" || selectedType === "multiSelect"
          ? { options: [] }
          : {}),
      });
      await updatePropertyOrder(database.id, [
        ...database.propertyOrder,
        propId,
      ]);
      handleReset();
    } catch {
      setError("Failed to create property. Please try again.");
    }
  };

  const handleReset = () => {
    setStep("type");
    setSelectedType(null);
    setName("");
    setError("");
    onClose();
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleReset}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Box sx={{ p: 1.5, minWidth: 200 }}>
        {step === "type" && (
          <>
            <Typography
              variant="body2"
              sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
            >
              Property Type
            </Typography>
            <List dense disablePadding>
              {PROPERTY_TYPES.map(({ type, label, icon }) => (
                <ListItemButton
                  key={type}
                  onClick={() => handleSelectType(type)}
                  dense
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>{icon}</ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {step === "name" && (
          <>
            <Typography
              variant="body2"
              sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
            >
              Property Name
            </Typography>
            <TextField
              size="small"
              autoFocus
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
              placeholder={`New ${selectedType} property`}
              sx={{ mb: 1 }}
            />
            {error && (
              <Typography
                variant="body2"
                sx={{ color: "error.main", fontSize: "12px", mb: 0.5 }}
              >
                {error}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
              <Typography
                variant="body2"
                onClick={() => setStep("type")}
                sx={{
                  cursor: "pointer",
                  color: "text.secondary",
                  "&:hover": { textDecoration: "underline" },
                  mr: 1,
                  lineHeight: "32px",
                }}
              >
                Back
              </Typography>
              <Typography
                variant="body2"
                onClick={() => void handleCreate()}
                sx={{
                  cursor: "pointer",
                  color: "primary.main",
                  fontWeight: FONT_WEIGHT_SEMIBOLD,
                  "&:hover": { textDecoration: "underline" },
                  lineHeight: "32px",
                }}
              >
                Create
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Popover>
  );
}
