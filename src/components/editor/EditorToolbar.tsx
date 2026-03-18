import { IconButton, Divider, Paper } from "@mui/material";
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  StrikethroughS as StrikeIcon,
  Code as CodeIcon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberedIcon,
  CheckBox as TodoIcon,
  FormatQuote as QuoteIcon,
} from "@mui/icons-material";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

interface EditorToolbarProps {
  editor: Editor;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

function ToolbarButton({ icon, label, onClick, isActive }: ToolbarButtonProps) {
  return (
    <IconButton
      size="small"
      aria-label={label}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        bgcolor: isActive ? "action.selected" : "transparent",
        color: isActive ? "text.primary" : "text.secondary",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {icon}
    </IconButton>
  );
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          p: 0.5,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
        }}
      >
        <ToolbarButton
          label="Bold"
          icon={<BoldIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          label="Italic"
          icon={<ItalicIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          label="Strikethrough"
          icon={<StrikeIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        />
        <ToolbarButton
          label="Code"
          icon={<CodeIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <ToolbarButton
          label="Bullet list"
          icon={<BulletIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          label="Numbered list"
          icon={<NumberedIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        />
        <ToolbarButton
          label="Todo list"
          icon={<TodoIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <ToolbarButton
          label="Blockquote"
          icon={<QuoteIcon fontSize="small" />}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        />
      </Paper>
    </BubbleMenu>
  );
}
