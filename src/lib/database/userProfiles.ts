import type { User } from "firebase/auth";
import {
  userProfileRef,
  userProfilesCollection,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "@/lib/firebase";
import type { UserProfile } from "@/types";
import {
  parseUserProfile,
  UserBrandId,
  Email,
  DisplayName,
  ImageUrl,
} from "@/types";

export async function syncUserProfile(user: User): Promise<void> {
  await setDoc(
    userProfileRef(UserBrandId.parse(user.uid)),
    {
      uid: UserBrandId.parse(user.uid),
      email: Email.parse(user.email ?? ""),
      displayName: DisplayName.parse(user.displayName ?? ""),
      photoURL: ImageUrl.parse(user.photoURL ?? ""),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function findUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  const q = query(userProfilesCollection(), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return parseUserProfile(snapshot.docs[0].data() as Record<string, unknown>);
}
