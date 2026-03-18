import type { Timestamp } from "firebase/firestore";
import type { UserBrandId, Email, DisplayName, ImageUrl } from "./brand";

export type ShareRole = "editor" | "viewer";

export interface PageShareEntry {
  role: ShareRole;
  addedAt: Timestamp;
  addedBy: UserBrandId;
}

export interface UserProfile {
  uid: UserBrandId;
  email: Email;
  displayName: DisplayName;
  photoURL: ImageUrl;
  updatedAt: Timestamp;
}
