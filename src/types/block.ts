import type { Timestamp } from "firebase/firestore";
import type { BlockBrandId, PageBrandId } from "./brand";

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "todo"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "divider"
  | "image"
  | "code"
  | "database";

export interface Block {
  id: BlockBrandId;
  pageId: PageBrandId;
  parentBlockId: BlockBrandId | null;
  position: number;
  type: BlockType;
  content: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
