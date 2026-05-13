import { useState } from "react";
import {
  Box,
  Popover,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import { getEmojiKeyword } from "./_emojiData";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  Smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🫡",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "🫥",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "🥸",
    "😎",
    "🤓",
    "🧐",
  ],
  People: [
    "👋",
    "🤚",
    "🖐",
    "✋",
    "🖖",
    "🫱",
    "🫲",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🫰",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "🫵",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "🫶",
    "👐",
    "🤲",
    "🤝",
    "🙏",
  ],
  Nature: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐻‍❄️",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🦅",
    "🦆",
    "🦉",
    "🦇",
    "🐺",
    "🐗",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐜",
    "🪲",
    "🐢",
    "🐍",
    "🦎",
    "🐙",
    "🦑",
    "🐠",
    "🐟",
    "🐬",
    "🐳",
    "🐋",
    "🦈",
  ],
  Food: [
    "🍎",
    "🍐",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🫐",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🥬",
    "🥒",
    "🌶",
    "🫑",
    "🌽",
    "🥕",
    "🫒",
    "🧄",
    "🧅",
    "🥔",
    "🍠",
    "🥐",
    "🥯",
    "🍞",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🧈",
    "🥞",
    "🧇",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
    "🌮",
    "🌯",
    "🫔",
    "🥙",
    "🧆",
    "🥚",
    "🍲",
    "🥘",
    "🫕",
    "🥫",
    "🍝",
    "🍜",
    "🍛",
  ],
  Objects: [
    "📝",
    "📁",
    "📂",
    "📄",
    "📊",
    "📈",
    "📉",
    "💻",
    "🖥",
    "⌨️",
    "🖨",
    "💾",
    "💿",
    "🎮",
    "🕹",
    "🔧",
    "🔨",
    "⚙️",
    "🔩",
    "🗜",
    "⚖️",
    "🔗",
    "⛓",
    "📎",
    "🖇",
    "📐",
    "📏",
    "📌",
    "📍",
    "🏷",
    "🔖",
    "🔑",
    "🗝",
    "🔒",
    "🔓",
    "🔔",
    "🔕",
    "📦",
    "📮",
    "📬",
    "📭",
    "📫",
    "🗳",
    "✏️",
    "✒️",
    "🖊",
    "🖋",
    "🖌",
    "🖍",
    "📎",
    "📐",
    "📏",
  ],
  Symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🤎",
    "🖤",
    "🤍",
    "❤️‍🔥",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "⭐",
    "🌟",
    "✨",
    "⚡",
    "🔥",
    "💥",
    "☀️",
    "🌈",
    "💯",
    "🎯",
    "♻️",
    "✅",
    "❌",
    "❓",
    "❗",
    "⚠️",
    "🚫",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "🟤",
    "⚫",
    "⚪",
  ],
};

interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({
  anchorEl,
  onClose,
  onSelect,
}: EmojiPickerProps) {
  const [search, setSearch] = useState("");

  const displayEmojis = search
    ? Object.values(EMOJI_CATEGORIES)
        .flat()
        .filter((emoji) => {
          const keywords = getEmojiKeyword(emoji);
          return keywords?.toLowerCase().includes(search.toLowerCase());
        })
        .slice(0, 80)
    : null;

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
    setSearch("");
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => {
        onClose();
        setSearch("");
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Box sx={{ width: 320, maxHeight: 360, p: 1.5 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emojis..."
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ mt: 1, maxHeight: 280, overflowY: "auto" }}>
          <IconButton
            size="small"
            aria-label="Remove icon"
            onClick={() => {
              onSelect("");
              onClose();
            }}
            sx={{
              fontSize: "11px",
              color: "text.secondary",
              borderRadius: 1,
              mb: 1,
            }}
          >
            Remove icon
          </IconButton>

          {displayEmojis ? (
            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
              {displayEmojis.map((emoji, i) => (
                <IconButton
                  key={i}
                  size="small"
                  onClick={() => handleSelect(emoji)}
                  sx={{ fontSize: "20px", width: 36, height: 36 }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          ) : (
            Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <Box key={category} sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: FONT_WEIGHT_SEMIBOLD,
                    fontSize: "11px",
                    px: 0.5,
                  }}
                >
                  {category}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                  {emojis.map((emoji, i) => (
                    <IconButton
                      key={i}
                      size="small"
                      onClick={() => handleSelect(emoji)}
                      sx={{ fontSize: "20px", width: 36, height: 36 }}
                    >
                      {emoji}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Popover>
  );
}
