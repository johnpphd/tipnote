import type { Timestamp } from "firebase/firestore";
import type { PageShareEntry } from "./userProfile";
import type {
  PageBrandId,
  DatabaseBrandId,
  WorkspaceBrandId,
  UserBrandId,
  Title,
  IconEmoji,
  ImageUrl,
  ShareToken,
} from "./brand";

export type PageType = "page" | "database";

export interface Page {
  id: PageBrandId;
  title: Title;
  icon: IconEmoji;
  coverImage: ImageUrl;
  description: Title;
  parentId: PageBrandId | null;
  childOrder: PageBrandId[];
  type: PageType;
  databaseId?: DatabaseBrandId;
  isDbRow: boolean;
  parentDatabaseId?: DatabaseBrandId;
  workspaceId: WorkspaceBrandId;
  ownerId?: UserBrandId;
  createdBy: UserBrandId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  isPublished?: boolean;
  shareToken?: ShareToken;
  publishedBy?: UserBrandId;
  publishedAt?: Timestamp | null;
  sharedWith?: Record<UserBrandId, PageShareEntry>;
  sharedWithIds?: UserBrandId[];
}

export type PageCreate = Pick<Page, "title" | "type"> &
  Partial<Pick<Page, "parentId" | "icon" | "databaseId">>;
