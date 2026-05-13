import {
  Box,
  Popover,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { ViewType } from "@/types";
import { VIEW_TYPES, VIEW_TYPE_ICONS, capitalize } from "./toolbarConstants";

interface AddViewPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAddView: (type: ViewType) => void;
}

export default function AddViewPopover({
  anchorEl,
  onClose,
  onAddView,
}: AddViewPopoverProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Box sx={{ p: 1.5, minWidth: 200 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
        >
          Add View
        </Typography>
        {VIEW_TYPES.map((type) => (
          <ListItemButton
            key={type}
            onClick={() => {
              onAddView(type);
              onClose();
            }}
            dense
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {VIEW_TYPE_ICONS[type]}
            </ListItemIcon>
            <ListItemText
              primary={capitalize(type)}
              slotProps={{
                primary: { variant: "body2" },
              }}
            />
          </ListItemButton>
        ))}
      </Box>
    </Popover>
  );
}
