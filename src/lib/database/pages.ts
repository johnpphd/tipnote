import {
  pagesCollection,
  pageRef,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "@/lib/firebase";
import type { PageCreate } from "@/types";
import {
  PageBrandId,
  type Title,
  type IconEmoji,
  type ImageUrl,
  type WorkspaceBrandId,
  type UserBrandId,
} from "@/types";

export async function createPage(
  workspaceId: WorkspaceBrandId | undefined,
  userId: UserBrandId | undefined,
  data: PageCreate,
): Promise<PageBrandId> {
  if (!workspaceId || !userId) {
    throw new Error("createPage: workspaceId and userId are required");
  }
  const docRef = await addDoc(pagesCollection(), {
    title: data.title || "Untitled",
    icon: data.icon || "",
    coverImage: "",
    description: "",
    parentId: data.parentId || null,
    childOrder: [],
    type: data.type || "page",
    databaseId: data.databaseId || null,
    isDbRow: false,
    parentDatabaseId: null,
    workspaceId,
    ownerId: userId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });
  return PageBrandId.parse(docRef.id);
}

export async function updatePage(
  pageId: PageBrandId | undefined,
  data: Partial<{
    title: Title;
    icon: IconEmoji;
    coverImage: ImageUrl;
    description: Title;
  }>,
): Promise<void> {
  if (!pageId) return;
  await updateDoc(pageRef(pageId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeletePage(
  pageId: PageBrandId | undefined,
): Promise<void> {
  if (!pageId) return;
  await updateDoc(pageRef(pageId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restorePage(
  pageId: PageBrandId | undefined,
): Promise<void> {
  if (!pageId) return;
  await updateDoc(pageRef(pageId), {
    isDeleted: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentDeletePage(
  pageId: PageBrandId | undefined,
): Promise<void> {
  if (!pageId) return;
  await deleteDoc(pageRef(pageId));
}
