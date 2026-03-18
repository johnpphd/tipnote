import { Box, Typography } from "@mui/material";
import {
  SmartToy as AssistantIcon,
  Person as UserIcon,
} from "@mui/icons-material";
import ChatToolResult from "./ChatToolResult";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <Box sx={{ display: "flex", gap: 1, px: 1.5, py: 1 }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isUser ? "primary.main" : "action.selected",
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {isUser ? (
          <UserIcon sx={{ fontSize: 14, color: "primary.contrastText" }} />
        ) : (
          <AssistantIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: FONT_WEIGHT_MEDIUM,
            fontSize: "12px",
            color: "text.secondary",
            mb: 0.25,
          }}
        >
          {isUser ? "You" : "AI Assistant"}
        </Typography>

        {/* Tool results */}
        {message.toolResults?.map((tool, i) => (
          <ChatToolResult key={i} result={tool} />
        ))}

        {/* Message text */}
        {message.content && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "13px",
              color: "text.primary",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message.content}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
