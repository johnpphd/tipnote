import { useEffect, useRef } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Close as CloseIcon,
  DeleteOutline as ClearIcon,
} from "@mui/icons-material";
import { useAtom, useAtomValue } from "jotai";
import { chatOpenAtom } from "@/atoms/chat";
import { workspaceIdAtom } from "@/atoms/workspace";
import { useChat } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useMatch } from "@tanstack/react-router";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { WorkspaceBrandId, PageBrandId } from "@/types";

const DRAWER_WIDTH = 380;

export default function ChatPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useAtom(chatOpenAtom);
  const workspaceId = useAtomValue(workspaceIdAtom);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Try to get current page context from route
  const pageMatch = useMatch({ from: "/w/$pageId", shouldThrow: false });
  const currentPageId = pageMatch?.params?.pageId;

  const { messages, sendMessage, clearMessages, isLoading } = useChat({
    workspaceId: WorkspaceBrandId.parse(workspaceId || ""),
    currentPageId: currentPageId ? PageBrandId.parse(currentPageId) : undefined,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: isMobile ? "100vw" : DRAWER_WIDTH,
        maxWidth: "100vw",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 44,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: FONT_WEIGHT_SEMIBOLD,
            fontSize: "13px",
            color: "text.primary",
          }}
        >
          AI Assistant
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <IconButton
            size="small"
            onClick={clearMessages}
            aria-label="Clear chat"
            disabled={isLoading || messages.length === 0}
            sx={{ p: 0.5 }}
          >
            <ClearIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            sx={{ p: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          py: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              px: 3,
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "13px",
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              Ask me to create pages, databases, search your workspace, or
              manage content.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "12px",
                color: "text.disabled",
                textAlign: "center",
              }}
            >
              Try: &quot;Create a page called Meeting Notes&quot;
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: { bgcolor: "background.paper" },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  if (!open) return null;

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        borderLeft: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        height: "100%",
      }}
    >
      {drawerContent}
    </Box>
  );
}
