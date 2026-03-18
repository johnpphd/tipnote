import { useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  Popover,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Refresh as ResetIcon,
  TextFields as TextIcon,
  Tag as NumberIcon,
  ArrowDropDownCircle as SelectIcon,
  Checklist as MultiSelectIcon,
  CalendarToday as DateIcon,
  CheckBox as CheckboxIcon,
  Link as UrlIcon,
  Person as PersonIcon,
  Title as TitleIcon,
} from "@mui/icons-material";
import { defaultOperatorForType } from "@/lib/database/filterEngine";
import FilterRow from "./FilterRow";
import type { Database, ViewFilter, PropertyType } from "@/types";
import { type PropertyBrandId } from "@/types";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ReactElement> = {
  title: <TitleIcon sx={{ fontSize: 16 }} />,
  text: <TextIcon sx={{ fontSize: 16 }} />,
  number: <NumberIcon sx={{ fontSize: 16 }} />,
  select: <SelectIcon sx={{ fontSize: 16 }} />,
  multiSelect: <MultiSelectIcon sx={{ fontSize: 16 }} />,
  date: <DateIcon sx={{ fontSize: 16 }} />,
  checkbox: <CheckboxIcon sx={{ fontSize: 16 }} />,
  url: <UrlIcon sx={{ fontSize: 16 }} />,
  person: <PersonIcon sx={{ fontSize: 16 }} />,
};

interface FilterPanelProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  database: Database;
  filters: ViewFilter[];
  onFiltersChange: (filters: ViewFilter[]) => void;
}

export default function FilterPanel({
  anchorEl,
  onClose,
  database,
  filters,
  onFiltersChange,
}: FilterPanelProps) {
  const [showPropertySelector, setShowPropertySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (index: number, updated: ViewFilter) => {
    const next = [...filters];
    next[index] = updated;
    onFiltersChange(next);
  };

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const handleAddFilter = (propertyId: PropertyBrandId) => {
    const propDef = database.properties[propertyId];
    const propType: PropertyType = propDef?.type ?? "text";
    const newFilter: ViewFilter = {
      propertyId,
      operator: defaultOperatorForType(propType),
      value: "",
    };
    onFiltersChange([...filters, newFilter]);
    setShowPropertySelector(false);
    setSearchQuery("");
  };

  const handleReset = () => {
    onFiltersChange([]);
  };

  const filteredProperties = database.propertyOrder.filter((propId) => {
    const prop = database.properties[propId];
    if (!prop) return false;
    if (!searchQuery) return true;
    return prop.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => {
        onClose();
        setShowPropertySelector(false);
        setSearchQuery("");
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ minWidth: { xs: "90vw", sm: 400 }, maxWidth: 520 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Typography
            sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}
          >
            Filters
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </IconButton>
        </Box>

        {/* Filter rows */}
        {filters.length > 0 && (
          <Box sx={{ px: 1.5, py: 0.5 }}>
            {filters.map((filter, i) => (
              <FilterRow
                key={i}
                filter={filter}
                index={i}
                database={database}
                onChange={handleFilterChange}
                onRemove={handleRemoveFilter}
              />
            ))}
          </Box>
        )}

        {filters.length === 0 && !showPropertySelector && (
          <Box sx={{ px: 1.5, py: 1.5 }}>
            <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
              No filters applied. Click &quot;Add filter&quot; to get started.
            </Typography>
          </Box>
        )}

        <Divider sx={{ mx: 1 }} />

        {/* Property selector */}
        {showPropertySelector ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <TextField
              size="small"
              autoFocus
              fullWidth
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                mb: 0.5,
                "& .MuiInputBase-input": { py: 0.5, px: 1, fontSize: "12px" },
              }}
            />
            <List
              dense
              disablePadding
              sx={{ maxHeight: 200, overflow: "auto" }}
            >
              {filteredProperties.map((propId) => {
                const prop = database.properties[propId];
                if (!prop) return null;
                const icon =
                  PROPERTY_TYPE_ICONS[prop.type] ?? PROPERTY_TYPE_ICONS.text;
                return (
                  <ListItemButton
                    key={propId}
                    onClick={() => handleAddFilter(propId)}
                    dense
                    sx={{ borderRadius: 1, py: 0.25 }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>
                    <ListItemText
                      primary={prop.name}
                      primaryTypographyProps={{ fontSize: "12px" }}
                    />
                  </ListItemButton>
                );
              })}
              {filteredProperties.length === 0 && (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "text.secondary",
                    py: 1,
                    textAlign: "center",
                  }}
                >
                  No matching properties
                </Typography>
              )}
            </List>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 0.5,
            }}
          >
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => setShowPropertySelector(true)}
              sx={{
                fontSize: "12px",
                textTransform: "none",
                color: "text.secondary",
              }}
            >
              Add filter
            </Button>
            {filters.length > 0 && (
              <Button
                size="small"
                startIcon={<ResetIcon sx={{ fontSize: 14 }} />}
                onClick={handleReset}
                sx={{
                  fontSize: "12px",
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                Reset
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Popover>
  );
}
