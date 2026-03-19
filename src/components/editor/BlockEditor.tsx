import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { common, createLowlight } from "lowlight";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { Box } from "@mui/material";
import { useSnackbar } from "notistack";
import { useDebouncedCallback } from "use-debounce";
import slashSuggestion from "./slashSuggestion";
import EditorToolbar from "./EditorToolbar";
import { uploadImage } from "@/lib/firebase/storage";
import type { JSONContent, Editor } from "@tiptap/core";
import {
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_BOLD,
} from "@/theme/fontWeights";
import { FONT_MONO } from "@/theme/createTipnoteTheme";
import type { WorkspaceBrandId, PageBrandId } from "@/types";

const lowlight = createLowlight(common);

// Slash command extension using the Suggestion plugin
const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: { from: number; to: number };
          props: { command: (editor: Editor) => void };
        }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
        ...slashSuggestion,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

/**
 * Normalize content from the simplified MCP format to TipTap's expected format.
 * MCP stores: { type: "paragraph", text: "Hello" }
 * TipTap needs: { type: "paragraph", content: [{ type: "text", text: "Hello" }] }
 */
function normalizeTipTapNode(node: JSONContent): JSONContent {
  const { type, text, content, attrs, ...rest } = node;
  const result: JSONContent = { type, ...rest };

  if (attrs) result.attrs = attrs;

  // Already has a content array -- recurse into children
  if (Array.isArray(content)) {
    result.content = content.map(normalizeTipTapNode);
    return result;
  }

  // Text shorthand at block level -- convert to proper content array
  if (typeof text === "string" && text.length > 0) {
    if (type === "blockquote") {
      result.content = [
        { type: "paragraph", content: [{ type: "text", text }] },
      ];
    } else if (type === "text") {
      // Already a text node, keep as-is
      result.text = text;
    } else {
      result.content = [{ type: "text", text }];
    }
    return result;
  }

  // Text node without content array -- preserve text field
  if (type === "text" && typeof text === "string") {
    result.text = text;
  }

  return result;
}

function normalizeContent(content: JSONContent): JSONContent {
  if (content.type === "doc" && Array.isArray(content.content)) {
    return {
      ...content,
      content: content.content.map(normalizeTipTapNode),
    };
  }
  return normalizeTipTapNode(content);
}

interface BlockEditorProps {
  content: JSONContent | null;
  onUpdate: (content: JSONContent) => void;
  workspaceId: WorkspaceBrandId;
  pageId: PageBrandId;
  editable?: boolean;
}

export default function BlockEditor({
  content,
  onUpdate,
  workspaceId: wsId,
  pageId,
  editable = true,
}: BlockEditorProps) {
  const { enqueueSnackbar } = useSnackbar();
  const debouncedUpdate = useDebouncedCallback((json: JSONContent) => {
    onUpdate(json);
  }, 300);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: 'Type "/" for commands...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({
        HTMLAttributes: { class: "editor-image" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      SlashCommands,
    ],
    content: content
      ? normalizeContent(content)
      : { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    onUpdate: ({ editor: ed }) => {
      debouncedUpdate(ed.getJSON());
    },
    immediatelyRender: false,
  });

  // Flush pending debounced content on unmount to prevent data loss
  useEffect(() => () => debouncedUpdate.flush(), [debouncedUpdate]);

  // Handle image uploads via custom event from SlashMenu
  const handleImageUpload = useCallback(
    async (e: Event) => {
      const customEvent = e as CustomEvent<{
        file: File;
        editor: typeof editor;
      }>;
      const { file } = customEvent.detail;
      if (!editor || !file) return;

      try {
        const url = await uploadImage(wsId, pageId, file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        enqueueSnackbar("Failed to upload image", { variant: "error" });
      }
    },
    [editor, wsId, pageId, enqueueSnackbar],
  );

  useEffect(() => {
    document.addEventListener("notion-image-upload", handleImageUpload);
    return () => {
      document.removeEventListener("notion-image-upload", handleImageUpload);
    };
  }, [handleImageUpload]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        "& .tiptap": {
          outline: "none",
          minHeight: 200,
          "& p.is-editor-empty:first-child::before": {
            content: "attr(data-placeholder)",
            float: "left",
            color: "text.secondary",
            opacity: 0.5,
            pointerEvents: "none",
            height: 0,
          },
          "& h1": {
            fontSize: "32px",
            fontWeight: FONT_WEIGHT_BOLD,
            mt: 3,
            mb: 1,
          },
          "& h2": {
            fontSize: "24px",
            fontWeight: FONT_WEIGHT_SEMIBOLD,
            mt: 2.5,
            mb: 0.75,
          },
          "& h3": {
            fontSize: "20px",
            fontWeight: FONT_WEIGHT_MEDIUM,
            mt: 2,
            mb: 0.5,
          },
          "& p": { my: 0.5, lineHeight: 1.7 },
          "& ul, & ol": { pl: 3 },
          "& blockquote": {
            borderLeft: 3,
            borderLeftStyle: "solid",
            borderLeftColor: "divider",
            pl: 2,
            ml: 0,
            color: "text.secondary",
            fontStyle: "italic",
          },
          "& hr": {
            border: "none",
            borderTop: 1,
            borderColor: "divider",
            my: 2,
          },
          "& pre": {
            bgcolor: "action.hover",
            borderRadius: 2,
            p: 2,
            overflow: "auto",
            "& code": {
              fontFamily: FONT_MONO,
              fontSize: "13px",
            },
          },
          "& code": {
            bgcolor: "action.hover",
            borderRadius: 0.5,
            px: 0.5,
            fontFamily: FONT_MONO,
            fontSize: "13px",
          },
          "& img.editor-image": {
            maxWidth: "100%",
            borderRadius: 2,
            my: 1,
          },
          "& ul[data-type='taskList']": {
            listStyle: "none",
            pl: 0,
            "& li": {
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              "& > label": { mt: 0.25 },
              "& > div": { flex: 1 },
            },
          },
          "& table": {
            borderCollapse: "collapse",
            tableLayout: "fixed",
            width: "100%",
            my: 1.5,
            overflow: "hidden",
            "& td, & th": {
              border: 1,
              borderColor: "divider",
              px: 1.5,
              py: 1,
              verticalAlign: "top",
              position: "relative",
              minWidth: 80,
            },
            "& th": {
              fontWeight: FONT_WEIGHT_SEMIBOLD,
              bgcolor: "action.hover",
              textAlign: "left",
            },
            "& .selectedCell": {
              bgcolor: "rgba(100,150,255,0.15)",
            },
            "& .column-resize-handle": {
              position: "absolute",
              right: -2,
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: "primary.main",
              pointerEvents: "none",
            },
          },
          "&.resize-cursor": {
            cursor: "col-resize",
          },
        },
      }}
    >
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </Box>
  );
}
