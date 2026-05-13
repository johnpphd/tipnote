import {
  Box,
  Popover,
  Typography,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { Database, ViewSort } from "@/types";
import { PropertyBrandId } from "@/types";

interface SortPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  database: Database;
  sorts: ViewSort[];
  onChangeSortProperty: (
    index: number,
    propId: PropertyBrandId | undefined,
  ) => void;
  onToggleSortDirection: (index: number) => void;
  onRemoveSort: (index: number) => void;
  onAddSort: () => void;
}

export default function SortPopover({
  anchorEl,
  onClose,
  database,
  sorts,
  onChangeSortProperty,
  onToggleSortDirection,
  onRemoveSort,
  onAddSort,
}: SortPopoverProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ p: 1.5, minWidth: 250 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
        >
          Sorts
        </Typography>
        {sorts.map((sort, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <Select
              value={sort.propertyId}
              onChange={(e) =>
                onChangeSortProperty(
                  i,
                  PropertyBrandId.parse(e.target.value as string),
                )
              }
              size="small"
              sx={{
                fontSize: "13px",
                height: 28,
                minWidth: 100,
                "& .MuiSelect-select": { py: 0.25, px: 1 },
              }}
            >
              {database.propertyOrder.map((propId) => {
                const prop = database.properties[propId];
                if (!prop) return null;
                return (
                  <MenuItem
                    key={propId}
                    value={propId}
                    sx={{ fontSize: "13px" }}
                  >
                    {prop.name}
                  </MenuItem>
                );
              })}
            </Select>
            <Chip
              label={sort.direction === "asc" ? "Ascending" : "Descending"}
              size="small"
              variant="outlined"
              onClick={() => onToggleSortDirection(i)}
              sx={{ cursor: "pointer" }}
            />
            <IconButton
              size="small"
              aria-label="Remove sort"
              onClick={() => onRemoveSort(i)}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={onAddSort}>
          Add sort
        </Button>
      </Box>
    </Popover>
  );
}
