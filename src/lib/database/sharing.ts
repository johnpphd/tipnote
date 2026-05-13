import {
  pageRef,
  publishedPageRef,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
} from "@/lib/firebase";
import type { ShareRole, UserBrandId, WorkspaceBrandId } from "@/types";
import { ShareToken, PageBrandId } from "@/types";

function generateShareToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function publishPage(
  pageId: PageBrandId | undefined,
  userId: UserBrandId | undefined,
): Promise<ShareToken> {
  if (!pageId || !userId) {
    throw new Error("publishPage: pageId and userId are required");
  }
  const token = generateShareToken();

  const brandedToken = ShareToken.parse(token);

  // Set publish fields on the page document
  await updateDoc(pageRef(pageId), {
    isPublished: true,
    shareToken: brandedToken,
    publishedBy: userId,
    publishedAt: serverTimestamp(),
  });

  // Create lookup document in top-level publishedPages collection
  await setDoc(publishedPageRef(brandedToken), {
    pageId,
    publishedAt: serverTimestamp(),
  });

  return brandedToken;
}

export async function unpublishPage(
  pageId: PageBrandId | undefined,
  shareToken: ShareToken,
): Promise<void> {
  if (!pageId) return;
  // Clear publish fields on the page document
  await updateDoc(pageRef(pageId), {
    isPublished: false,
    shareToken: null,
    publishedBy: null,
    publishedAt: null,
  });

  // Delete the lookup document
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(publishedPageRef(shareToken));
}

export async function lookupShareToken(
  shareToken: ShareToken,
): Promise<{ pageId: PageBrandId } | null> {
  const snap = await getDoc(publishedPageRef(shareToken));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    pageId: PageBrandId.parse(data.pageId),
  };
}

export async function sharePageWithUser(
  pageId: PageBrandId | undefined,
  targetUid: UserBrandId | undefined,
  role: ShareRole,
  addedBy: UserBrandId | undefined,
): Promise<void> {
  if (!pageId || !targetUid || !addedBy) return;
  await updateDoc(pageRef(pageId), {
    [`sharedWith.${targetUid}`]: {
      role,
      addedAt: serverTimestamp(),
      addedBy,
    },
    sharedWithIds: arrayUnion(targetUid),
  });
}

export async function updateShareRole(
  pageId: PageBrandId | undefined,
  targetUid: UserBrandId | undefined,
  newRole: ShareRole,
): Promise<void> {
  if (!pageId || !targetUid) return;
  await updateDoc(pageRef(pageId), {
    [`sharedWith.${targetUid}.role`]: newRole,
  });
}

export async function removePageShare(
  pageId: PageBrandId | undefined,
  targetUid: UserBrandId | undefined,
): Promise<void> {
  if (!pageId || !targetUid) return;
  await updateDoc(pageRef(pageId), {
    [`sharedWith.${targetUid}`]: deleteField(),
    sharedWithIds: arrayRemove(targetUid),
  });
}

export async function transferPageOwnership(
  pageId: PageBrandId | undefined,
  newOwnerId: UserBrandId | undefined,
  newWorkspaceId: WorkspaceBrandId | undefined,
): Promise<void> {
  if (!pageId || !newOwnerId || !newWorkspaceId) return;
  await updateDoc(pageRef(pageId), {
    ownerId: newOwnerId,
    workspaceId: newWorkspaceId,
    updatedAt: serverTimestamp(),
  });
}
