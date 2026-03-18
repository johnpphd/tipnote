import {
  Title as H1Icon,
  FormatSize as H2Icon,
  TextFields as H3Icon,
  FormatListBulleted as BulletIcon,
  FormatListNumbered as NumberedIcon,
  CheckBox as TodoIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as DividerIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  TableChart as TableIcon,
} from "@mui/icons-material";
import type { Editor } from "@tiptap/core";

export interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

export const SLASH_ITEMS: SlashMenuItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <H1Icon fontSize="small" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <H2Icon fontSize="small" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <H3Icon fontSize="small" />,
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Simple bullet list",
    icon: <BulletIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Numbered list",
    icon: <NumberedIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "To-do List",
    description: "Checklist with checkboxes",
    icon: <TodoIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Block quote",
    icon: <QuoteIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal divider",
    icon: <DividerIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Image",
    description: "Upload or embed image",
    icon: <ImageIcon fontSize="small" />,
    command: (editor) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const event = new CustomEvent("notion-image-upload", {
            detail: { file, editor },
          });
          document.dispatchEvent(event);
        }
      };
      input.click();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: <TableIcon fontSize="small" />,
    command: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: <CodeIcon fontSize="small" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
];

export function filterSlashItems(query: string): SlashMenuItem[] {
  return SLASH_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );
}
