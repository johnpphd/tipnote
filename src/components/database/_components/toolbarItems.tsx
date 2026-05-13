import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  IconButton,
  Typography,
  Checkbox,
  Chip,
  TextField,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { resolveColor, ON_CHIP_COLOR } from "@/theme/notionColors";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { DatabaseView, SelectOption } from "@/types";
import { VIEW_TYPE_ICONS } from "./toolbarConstants";

export function SubPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1.5,
        pt: 1.5,
        pb: 0.5,
      }}
    >
      <IconButton size="small" onClick={onBack} sx={{ p: 0.25, mr: 0.5 }}>
        <ChevronRightIcon
          sx={{
            fontSize: 16,
            color: "text.secondary",
            transform: "rotate(180deg)",
          }}
        />
      </IconButton>
      <Typography sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}>
        {title}
      </Typography>
    </Box>
  );
}

export function SortablePropertyItem({
  propId,
  name,
  checked,
  onToggle,
}: {
  propId: string;
  name: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: propId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1,
        py: 0.5,
        cursor: "grab",
        "&:hover": { bgcolor: "action.hover" },
      }}
      {...attributes}
      {...listeners}
    >
      <DragIcon
        sx={{ fontSize: 16, color: "text.disabled", mr: 0.5, flexShrink: 0 }}
      />
      <Checkbox
        size="small"
        checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        sx={{ p: 0, mr: 1 }}
      />
      <Typography sx={{ fontSize: "13px" }}>{name}</Typography>
    </Box>
  );
}

export function SortableGroupItem({
  option,
  isHidden,
  onToggleVisibility,
  onRename,
  disabled,
}: {
  option: SelectOption;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onRename?: (optionId: string, newName: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === option.name) {
      setIsEditing(false);
      return;
    }
    onRename?.(option.id, trimmed);
    setIsEditing(false);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1,
        py: 0.25,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {!disabled && (
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: isDragging ? "grabbing" : "grab",
            mr: 0.5,
            flexShrink: 0,
          }}
        >
          <DragIcon sx={{ fontSize: 16, color: "text.disabled" }} />
        </Box>
      )}
      {isEditing ? (
        <TextField
          autoFocus
          size="small"
          variant="standard"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveName();
            if (e.key === "Escape") setIsEditing(false);
          }}
          sx={{
            maxWidth: 140,
            "& .MuiInputBase-input": {
              fontSize: "12px",
              fontWeight: FONT_WEIGHT_MEDIUM,
              py: 0,
            },
            "& .MuiInput-underline:before": {
              borderBottomColor: "divider",
            },
          }}
        />
      ) : (
        <Chip
          label={option.name}
          size="small"
          onDoubleClick={
            onRename
              ? () => {
                  setNameDraft(option.name);
                  setIsEditing(true);
                }
              : undefined
          }
          sx={{
            bgcolor: resolveColor(option.color),
            color: ON_CHIP_COLOR,
            fontWeight: FONT_WEIGHT_MEDIUM,
            fontSize: "12px",
            height: 22,
            opacity: isHidden ? 0.5 : 1,
          }}
        />
      )}
      <Box sx={{ flex: 1 }} />
      <IconButton
        size="small"
        sx={{ p: 0.25 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isHidden ? (
          <VisibilityOffIcon sx={{ fontSize: 16, color: "text.disabled" }} />
        ) : (
          <VisibilityIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        )}
      </IconButton>
    </Box>
  );
}

export function SortableViewTab({
  view,
  isActive,
  onClick,
  onContextMenu,
  disabled,
}: {
  view: DatabaseView;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: view.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        minHeight: 28,
        py: 0.25,
        px: 1.5,
        fontSize: "13px",
        textTransform: "none",
        color: isActive ? "text.primary" : "text.secondary",
        bgcolor: isActive ? "action.selected" : "transparent",
        borderRadius: "4px",
        cursor: disabled ? "default" : "grab",
        userSelect: "none",
        whiteSpace: "nowrap",
        "&:hover": {
          bgcolor: isActive ? "action.selected" : "action.hover",
        },
      }}
    >
      {VIEW_TYPE_ICONS[view.type]}
      {view.name}
    </Box>
  );
}
