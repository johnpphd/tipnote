import {
  doc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Workspace } from "@/types";
import { WorkspaceBrandId, parseWorkspace, type UserBrandId } from "@/types";

export async function createWorkspace(
  userId: UserBrandId | undefined,
  name: string,
): Promise<WorkspaceBrandId> {
  if (!userId) throw new Error("createWorkspace: userId is required");
  const ref = doc(collection(db, "workspaces"));
  await setDoc(ref, {
    name,
    icon: "",
    ownerId: userId,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  });
  return WorkspaceBrandId.parse(ref.id);
}

export async function getOrCreateWorkspace(
  userId: UserBrandId | undefined,
  name: string,
): Promise<WorkspaceBrandId> {
  if (!userId) throw new Error("getOrCreateWorkspace: userId is required");
  const q = query(
    collection(db, "workspaces"),
    where("memberIds", "array-contains", userId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return WorkspaceBrandId.parse(snap.docs[0].id);
  }
  return createWorkspace(userId, name);
}

export function subscribeToWorkspace(
  workspaceId: WorkspaceBrandId | undefined,
  callback: (workspace: Workspace | null) => void,
) {
  if (!workspaceId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, "workspaces", workspaceId), (snap) => {
    if (snap.exists()) {
      callback(parseWorkspace(snap.id, snap.data()!));
    } else {
      callback(null);
    }
  });
}
