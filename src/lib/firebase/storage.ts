import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import type { WorkspaceBrandId, PageBrandId } from "@/types";

export async function uploadImage(
  workspaceId: WorkspaceBrandId,
  pageId: PageBrandId,
  file: File,
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `workspaces/${workspaceId}/pages/${pageId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
