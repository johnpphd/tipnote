import { useState, useRef, useCallback } from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import { ArrowUpward as SendIcon } from "@mui/icons-material";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 0.5,
        p: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        disabled={disabled}
        multiline
        maxRows={4}
        sx={{
          flex: 1,
          fontSize: "13px",
          bgcolor: "action.hover",
          borderRadius: 2,
          px: 1.5,
          py: 1,
          "& .MuiInputBase-input": {
            color: "text.primary",
            "&::placeholder": {
              color: "text.secondary",
              opacity: 1,
            },
          },
        }}
      />
      <IconButton
        size="small"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          width: 28,
          height: 28,
          "&:hover": {
            bgcolor: "primary.dark",
          },
          "&.Mui-disabled": {
            bgcolor: "action.disabledBackground",
            color: "text.disabled",
          },
        }}
      >
        <SendIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
