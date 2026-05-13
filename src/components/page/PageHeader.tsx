import { useState, useCallback, useRef } from "react";
import { Box, Typography, IconButton, Button, TextField } from "@mui/material";
import {
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import type { Page } from "@/types";
import { useDatabaseRowByPageId } from "@/hooks/useDatabaseRowByPageId";
import { useDatabase } from "@/hooks/useDatabase";
import { usePageHeaderActions } from "./_hooks/usePageHeaderActions";
import EmojiPicker from "./EmojiPicker";
import { FONT_WEIGHT_BOLD } from "@/theme/fontWeights";

const visuallyHiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

interface PageHeaderProps {
  page: Page;
  isReadOnly?: boolean;
}

function TitleInput({
  initialTitle,
  onSave,
}: {
  initialTitle: string;
  onSave: (title: string) => void;
}) {
  const [title, setTitle] = useState(initialTitle);

  const handleBlur = useCallback(() => {
    const trimmed = title.trim();
    const normalized = trimmed || "Untitled";
    setTitle(normalized);
    onSave(normalized);
  }, [title, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <TextField
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Untitled"
      size="medium"
      fullWidth
      sx={{
        "& .MuiInputBase-input": {
          fontSize: "32px",
          fontWeight: FONT_WEIGHT_BOLD,
          lineHeight: 1.2,
          p: 0,
          color: "text.primary",
        },
        "& .MuiInputBase-root": {
          background: "transparent",
          border: 0,
          boxShadow: "none",
          "&:hover": { background: "transparent" },
        },
        "& fieldset": { border: 0 },
      }}
    />
  );
}

export default function PageHeader({ page, isReadOnly }: PageHeaderProps) {
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [showDescription, setShowDescription] = useState(!!page.description);
  const [description, setDescription] = useState(page.description || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDbRow = page.isDbRow && !!page.parentDatabaseId;
  const { data: dbRow } = useDatabaseRowByPageId(
    isDbRow ? page.id : undefined,
    isDbRow ? page.parentDatabaseId : undefined,
  );
  const { data: database } = useDatabase(
    isDbRow ? page.parentDatabaseId : undefined,
  );

  const titlePropId = database
    ? Object.values(database.properties).find((p) => p.type === "title")?.id
    : undefined;

  const {
    handleSave,
    handleEmojiSelect,
    handleCoverUpload,
    handleRemoveCover,
    handleDescriptionBlur,
  } = usePageHeaderActions({ page, dbRow, titlePropId, description });

  return (
    <Box sx={{ mb: 2, overflow: "hidden" }}>
      {/* Cover image */}
      {page.coverImage && (
        <Box
          sx={{
            position: "relative",
            height: 200,
            mx: { xs: -1, sm: -2, md: -4 },
            mt: { xs: -1, md: -2 },
            mb: 2,
            overflow: "hidden",
            ...(!isReadOnly && {
              "&:hover .cover-actions, &:focus-within .cover-actions": {
                opacity: 1,
              },
            }),
          }}
        >
          <Box
            component="img"
            src={page.coverImage}
            alt="Cover"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {!isReadOnly && (
            <Box
              className="cover-actions"
              sx={{
                position: "absolute",
                bottom: 8,
                right: 8,
                opacity: 0,
                transition: "opacity 150ms",
                display: "flex",
                gap: 0.5,
              }}
            >
              <Button
                size="small"
                variant="contained"
                onClick={() => fileInputRef.current?.click()}
                sx={{ fontSize: "11px", textTransform: "none" }}
              >
                Change cover
              </Button>
              <IconButton
                size="small"
                aria-label="Remove cover"
                onClick={handleRemoveCover}
                sx={{
                  bgcolor: "background.paper",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      {/* Icon + actions row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 0.5,
          ...(!isReadOnly && {
            "& .page-header-actions": {
              opacity: 0,
              transition: "opacity 150ms",
            },
            "&:hover .page-header-actions, &:focus-within .page-header-actions":
              {
                opacity: 1,
              },
          }),
        }}
      >
        {page.icon &&
          (isReadOnly ? (
            <Typography fontSize="32px" sx={{ mr: 1 }}>
              {page.icon}
            </Typography>
          ) : (
            <IconButton
              size="small"
              aria-label="Change icon"
              onClick={(e) => setEmojiAnchor(e.currentTarget)}
            >
              <Typography fontSize="32px">{page.icon}</Typography>
            </IconButton>
          ))}

        {!isReadOnly && (
          <Box
            className="page-header-actions"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {!page.icon && (
              <Button
                size="small"
                startIcon={<EmojiIcon sx={{ fontSize: 14 }} />}
                onClick={(e) => setEmojiAnchor(e.currentTarget)}
                sx={{
                  fontSize: "11px",
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                Add icon
              </Button>
            )}

            {!page.coverImage && (
              <Button
                size="small"
                startIcon={<ImageIcon sx={{ fontSize: 14 }} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  fontSize: "11px",
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                Add cover
              </Button>
            )}
            {!showDescription && (
              <Button
                size="small"
                onClick={() => setShowDescription(true)}
                sx={{
                  fontSize: "11px",
                  textTransform: "none",
                  color: "text.secondary",
                }}
              >
                Add description
              </Button>
            )}
          </Box>
        )}
      </Box>

      {showDescription &&
        (isReadOnly ? (
          page.description && (
            <Typography
              sx={{ fontSize: "14px", color: "text.secondary", mb: 1 }}
            >
              {page.description}
            </Typography>
          )
        ) : (
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            multiline
            size="small"
            fullWidth
            sx={{
              mb: 1,
              "& .MuiInputBase-input": {
                fontSize: "14px",
                color: "text.secondary",
                p: 0,
              },
              "& .MuiInputBase-root": {
                background: "transparent",
                border: 0,
                boxShadow: "none",
                "&:hover": { background: "transparent" },
              },
              "& fieldset": { border: 0 },
            }}
          />
        ))}

      {isReadOnly ? (
        <Typography
          component="h1"
          sx={{
            fontSize: "32px",
            fontWeight: FONT_WEIGHT_BOLD,
            lineHeight: 1.2,
            color: "text.primary",
          }}
        >
          {page.title || "Untitled"}
        </Typography>
      ) : (
        <>
          <EmojiPicker
            anchorEl={emojiAnchor}
            onClose={() => setEmojiAnchor(null)}
            onSelect={handleEmojiSelect}
          />

          <Box component="h1" sx={visuallyHiddenSx}>
            {page.title || "Untitled"}
          </Box>
          <TitleInput
            key={page.id}
            initialTitle={page.title}
            onSave={handleSave}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => void handleCoverUpload(e)}
          />
        </>
      )}
    </Box>
  );
}
