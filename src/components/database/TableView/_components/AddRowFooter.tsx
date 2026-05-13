import { Box, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

interface AddRowFooterProps {
  onAddRow: () => void;
}

export default function AddRowFooter({ onAddRow }: AddRowFooterProps) {
  return (
    <Box
      component="button"
      role="button"
      tabIndex={0}
      onClick={onAddRow}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAddRow();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        pl: 4.5,
        py: 0.5,
        width: "100%",
        border: 0,
        background: "none",
        borderBottom: 1,
        borderColor: "divider",
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <AddIcon sx={{ fontSize: 14, color: "text.secondary", mr: 0.5 }} />
      <Typography
        variant="body2"
        sx={{ color: "text.secondary", fontSize: "13px" }}
      >
        New page
      </Typography>
    </Box>
  );
}
