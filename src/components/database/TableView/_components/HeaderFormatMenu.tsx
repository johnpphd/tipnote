import {
  Box,
  Typography,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Tag as TagIcon, Percent as PercentIcon } from "@mui/icons-material";
import type { NumberFormat, PropertyDefinition } from "@/types";
import type { HeaderMenuState } from "../_hooks/useTableColumnsModel";

interface HeaderFormatMenuProps {
  headerMenu: HeaderMenuState;
  onClose: () => void;
  onNumberFormatChange: (
    property: PropertyDefinition,
    format: NumberFormat,
  ) => void;
}

export default function HeaderFormatMenu({
  headerMenu,
  onClose,
  onNumberFormatChange,
}: HeaderFormatMenuProps) {
  return (
    <Popover
      open={Boolean(headerMenu)}
      anchorEl={headerMenu?.anchorEl}
      onClose={onClose}
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
                onNumberFormatChange(headerMenu.property, "number")
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
                onNumberFormatChange(headerMenu.property, "percent")
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
  );
}
