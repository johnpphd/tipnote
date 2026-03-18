import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import type { SlashMenuItem } from "./slashItems";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

export interface SlashMenuRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface SlashMenuProps extends SuggestionProps {
  items: SlashMenuItem[];
}

export const SlashMenuList = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Clamp index if items shrunk -- pure derivation, no effect needed
    const safeIndex = items.length > 0 ? selectedIndex % items.length : 0;

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = items[safeIndex];
          if (item) {
            command(item);
          }
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <Paper
        elevation={4}
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          maxHeight: 320,
          overflow: "auto",
          width: 280,
        }}
      >
        <List dense disablePadding>
          {items.map((item, index) => (
            <ListItemButton
              key={item.title}
              selected={index === safeIndex}
              onClick={() => command(item)}
              sx={{
                py: 0.75,
                "&.Mui-selected": { bgcolor: "action.selected" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                secondary={item.description}
                primaryTypographyProps={{
                  variant: "body2",
                  fontWeight: FONT_WEIGHT_MEDIUM,
                }}
                secondaryTypographyProps={{
                  variant: "body2",
                  fontSize: "11px",
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    );
  },
);

SlashMenuList.displayName = "SlashMenuList";
