import { updateDoc, serverTimestamp } from "firebase/firestore";
import { pageRef } from "@/lib/firebase";
import type { JSONContent } from "@tiptap/core";
import type { PageBrandId } from "@/types";

/**
 * Save TipTap editor content to the page document.
 * Stores the full JSON doc as `content` field for simplicity.
 * Can be migrated to per-block documents later for real-time collab.
 */
export async function savePageContent(
  pageId: PageBrandId,
  content: JSONContent,
): Promise<void> {
  await updateDoc(pageRef(pageId), {
    content,
    updatedAt: serverTimestamp(),
  });
}
