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
  type WorkspaceBrandId,
  type UserBrandId,
  type Title,
  type IconEmoji,
  type ImageUrl,
} from "@/types";

export async function createPage(
  workspaceId: WorkspaceBrandId,
  userId: UserBrandId,
  data: PageCreate,
): Promise<PageBrandId> {
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
  pageId: PageBrandId,
  data: Partial<{
    title: Title;
    icon: IconEmoji;
    coverImage: ImageUrl;
    description: Title;
  }>,
): Promise<void> {
  await updateDoc(pageRef(pageId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeletePage(pageId: PageBrandId): Promise<void> {
  await updateDoc(pageRef(pageId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}

export async function restorePage(pageId: PageBrandId): Promise<void> {
  await updateDoc(pageRef(pageId), {
    isDeleted: false,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentDeletePage(pageId: PageBrandId): Promise<void> {
  await deleteDoc(pageRef(pageId));
}
