import { Box, Typography } from "@mui/material";
import {
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Build as ToolIcon,
} from "@mui/icons-material";
import type { ToolResult } from "@/lib/chat/types";

const toolLabels: Record<string, string> = {
  create_page: "Created page",
  update_page: "Updated page",
  delete_page: "Deleted page",
  create_database: "Created database",
  add_database_property: "Added property",
  create_database_row: "Added row",
  search_pages: "Searched pages",
  list_pages: "Listed pages",
  get_page_content: "Read page",
  navigate_to_page: "Navigating",
};

interface ChatToolResultProps {
  result: ToolResult;
}

export default function ChatToolResult({ result }: ChatToolResultProps) {
  const label = toolLabels[result.name] || result.name;
  const title = result.data?.title as string | undefined;
  const displayText = title ? `${label}: ${title}` : label;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        py: 0.5,
        px: 1,
        my: 0.5,
        borderRadius: 1,
        bgcolor: "action.hover",
        border: 1,
        borderColor: "divider",
      }}
    >
      {result.error ? (
        <ErrorIcon sx={{ fontSize: 14, color: "error.main" }} />
      ) : result.data ? (
        <SuccessIcon sx={{ fontSize: 14, color: "success.main" }} />
      ) : (
        <ToolIcon
          sx={{
            fontSize: 14,
            color: "text.secondary",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      )}
      <Typography
        variant="body2"
        sx={{ fontSize: "12px", color: "text.secondary" }}
      >
        {result.error ? `Failed: ${result.error}` : displayText}
      </Typography>
    </Box>
  );
}
