import type { Timestamp } from "firebase/firestore";
import type {
  WorkspaceBrandId,
  UserBrandId,
  DisplayName,
  IconEmoji,
} from "./brand";

export interface Workspace {
  id: WorkspaceBrandId;
  name: DisplayName;
  icon: IconEmoji;
  ownerId: UserBrandId;
  memberIds: UserBrandId[];
  createdAt: Timestamp;
}
