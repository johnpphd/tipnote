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
import type { ShareRole } from "@/types";
import {
  ShareToken,
  PageBrandId,
  type UserBrandId,
  type WorkspaceBrandId,
} from "@/types";

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
  pageId: PageBrandId,
  userId: UserBrandId,
): Promise<ShareToken> {
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
  pageId: PageBrandId,
  shareToken: ShareToken,
): Promise<void> {
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
  pageId: PageBrandId,
  targetUid: UserBrandId,
  role: ShareRole,
  addedBy: UserBrandId,
): Promise<void> {
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
  pageId: PageBrandId,
  targetUid: UserBrandId,
  newRole: ShareRole,
): Promise<void> {
  await updateDoc(pageRef(pageId), {
    [`sharedWith.${targetUid}.role`]: newRole,
  });
}

export async function removePageShare(
  pageId: PageBrandId,
  targetUid: UserBrandId,
): Promise<void> {
  await updateDoc(pageRef(pageId), {
    [`sharedWith.${targetUid}`]: deleteField(),
    sharedWithIds: arrayRemove(targetUid),
  });
}

export async function transferPageOwnership(
  pageId: PageBrandId,
  newOwnerId: UserBrandId,
  newWorkspaceId: WorkspaceBrandId,
): Promise<void> {
  await updateDoc(pageRef(pageId), {
    ownerId: newOwnerId,
    workspaceId: newWorkspaceId,
    updatedAt: serverTimestamp(),
  });
}
