import { Box, Typography, Button, IconButton } from "@mui/material";
import {
  DeleteOutline as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";
import { ON_CHIP_COLOR } from "@/theme/notionColors";

const BULK_BAR_SHADOW = "0 2px 12px rgba(0,0,0,0.4)";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onDelete,
  onClear,
}: BulkActionsBarProps) {
  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "primary.main",
        borderRadius: "12px",
        mx: 2,
        mb: 1,
        boxShadow: BULK_BAR_SHADOW,
        zIndex: 10,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: ON_CHIP_COLOR,
          fontWeight: FONT_WEIGHT_MEDIUM,
          fontSize: "13px",
        }}
      >
        {selectedCount} selected
      </Typography>
      <Button
        size="small"
        startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
        onClick={onDelete}
        sx={{
          color: ON_CHIP_COLOR,
          textTransform: "none",
          fontSize: "13px",
          "&:hover": { bgcolor: "action.selected" },
        }}
      >
        Delete
      </Button>
      <Box sx={{ flex: 1 }} />
      <IconButton
        size="small"
        onClick={onClear}
        aria-label="Clear selection"
        sx={{ color: ON_CHIP_COLOR, p: 0.5 }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
