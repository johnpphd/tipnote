import type { Page } from "./page";
import type { Block } from "./block";
import type {
  Database,
  DatabaseView,
  DatabaseRow,
  PropertyType,
  NumberFormat,
  PropertyValue,
} from "./database";
import type { Workspace } from "./workspace";
import type { UserProfile, PageShareEntry } from "./userProfile";
import {
  PageBrandId,
  BlockBrandId,
  DatabaseBrandId,
  ViewBrandId,
  WorkspaceBrandId,
  UserBrandId,
  PropertyBrandId,
  RowBrandId,
  SelectOptionBrandId,
  Title,
  IconEmoji,
  ImageUrl,
  ShareToken,
  Email,
  DisplayName,
  CssColor,
  FilterOperator,
} from "./brand";

export function parsePage(id: string, data: Record<string, unknown>): Page {
  return {
    id: PageBrandId.parse(id),
    title: Title.parse(data.title ?? ""),
    icon: IconEmoji.parse(data.icon ?? ""),
    coverImage: ImageUrl.parse(data.coverImage ?? ""),
    description: Title.parse(data.description ?? ""),
    parentId: data.parentId ? PageBrandId.parse(data.parentId) : null,
    childOrder: ((data.childOrder as string[]) ?? []).map((s) =>
      PageBrandId.parse(s),
    ),
    type: data.type as Page["type"],
    ...(data.databaseId != null
      ? { databaseId: DatabaseBrandId.parse(data.databaseId) }
      : {}),
    isDbRow: (data.isDbRow as boolean) ?? false,
    ...(data.parentDatabaseId != null
      ? { parentDatabaseId: DatabaseBrandId.parse(data.parentDatabaseId) }
      : {}),
    workspaceId: WorkspaceBrandId.parse(data.workspaceId),
    ...(data.ownerId != null
      ? { ownerId: UserBrandId.parse(data.ownerId) }
      : {}),
    createdBy: UserBrandId.parse(data.createdBy),
    createdAt: data.createdAt as Page["createdAt"],
    updatedAt: data.updatedAt as Page["updatedAt"],
    isDeleted: (data.isDeleted as boolean) ?? false,
    ...(data.isPublished != null
      ? { isPublished: data.isPublished as boolean }
      : {}),
    ...(data.shareToken != null
      ? { shareToken: ShareToken.parse(data.shareToken) }
      : {}),
    ...(data.publishedBy != null
      ? { publishedBy: UserBrandId.parse(data.publishedBy) }
      : {}),
    ...(data.publishedAt !== undefined
      ? { publishedAt: data.publishedAt as Page["publishedAt"] }
      : {}),
    ...(data.sharedWith != null
      ? {
          sharedWith: Object.fromEntries(
            Object.entries(data.sharedWith as Record<string, unknown>).map(
              ([uid, entry]) => [
                UserBrandId.parse(uid),
                entry as PageShareEntry,
              ],
            ),
          ) as Record<UserBrandId, PageShareEntry>,
        }
      : {}),
    ...(data.sharedWithIds != null
      ? {
          sharedWithIds: ((data.sharedWithIds as string[]) ?? []).map((s) =>
            UserBrandId.parse(s),
          ),
        }
      : {}),
  };
}

export function parseBlock(id: string, data: Record<string, unknown>): Block {
  return {
    id: BlockBrandId.parse(id),
    pageId: PageBrandId.parse(data.pageId),
    parentBlockId: data.parentBlockId
      ? BlockBrandId.parse(data.parentBlockId)
      : null,
    position: data.position as number,
    type: data.type as Block["type"],
    content: data.content as Record<string, unknown>,
    createdAt: data.createdAt as Block["createdAt"],
    updatedAt: data.updatedAt as Block["updatedAt"],
  };
}

export function parseDatabase(
  id: string,
  data: Record<string, unknown>,
): Database {
  const rawProps = (data.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const properties: Database["properties"] = {} as Database["properties"];
  for (const [key, val] of Object.entries(rawProps)) {
    const propId = PropertyBrandId.parse(key);
    properties[propId] = {
      id: PropertyBrandId.parse(val.id),
      name: DisplayName.parse(val.name),
      type: val.type as PropertyType,
      ...(val.options != null
        ? {
            options: (val.options as Array<Record<string, unknown>>).map(
              (opt) => ({
                id: SelectOptionBrandId.parse(opt.id),
                name: DisplayName.parse(opt.name),
                color: CssColor.parse(opt.color),
              }),
            ),
          }
        : {}),
      ...(val.numberFormat != null
        ? { numberFormat: val.numberFormat as NumberFormat }
        : {}),
    };
  }

  return {
    id: DatabaseBrandId.parse(id),
    pageId: PageBrandId.parse(data.pageId),
    workspaceId: WorkspaceBrandId.parse(data.workspaceId),
    properties,
    propertyOrder: ((data.propertyOrder as string[]) ?? []).map((s) =>
      PropertyBrandId.parse(s),
    ),
    ...(data.viewOrder != null
      ? {
          viewOrder: ((data.viewOrder as string[]) ?? []).map((s) =>
            ViewBrandId.parse(s),
          ),
        }
      : {}),
    defaultViewId: ViewBrandId.parse(data.defaultViewId),
  };
}

export function parseDatabaseView(
  id: string,
  data: Record<string, unknown>,
): DatabaseView {
  const config = (data.config ?? {}) as Record<string, unknown>;
  return {
    id: ViewBrandId.parse(id),
    databaseId: DatabaseBrandId.parse(data.databaseId),
    name: DisplayName.parse(data.name),
    type: data.type as DatabaseView["type"],
    config: {
      visibleProperties: ((config.visibleProperties as string[]) ?? []).map(
        (s) => PropertyBrandId.parse(s),
      ),
      sorts: ((config.sorts as Array<Record<string, unknown>>) ?? []).map(
        (s) => ({
          propertyId: PropertyBrandId.parse(s.propertyId),
          direction: s.direction as "asc" | "desc",
        }),
      ),
      filters: ((config.filters as Array<Record<string, unknown>>) ?? []).map(
        (f) => ({
          propertyId: PropertyBrandId.parse(f.propertyId),
          operator: FilterOperator.parse(f.operator),
          value: f.value,
        }),
      ),
      ...(config.groupBy != null
        ? { groupBy: PropertyBrandId.parse(config.groupBy) }
        : {}),
      ...(config.groupOrder != null
        ? { groupOrder: config.groupOrder as string[] }
        : {}),
      ...(config.hiddenGroups != null
        ? { hiddenGroups: config.hiddenGroups as string[] }
        : {}),
      ...(config.hideEmptyGroups != null
        ? { hideEmptyGroups: config.hideEmptyGroups as boolean }
        : {}),
      ...(config.groupSortOrder != null
        ? {
            groupSortOrder: config.groupSortOrder as "manual" | "alphabetical",
          }
        : {}),
      ...(config.cardOrder != null
        ? {
            cardOrder: Object.fromEntries(
              Object.entries(config.cardOrder as Record<string, string[]>).map(
                ([k, v]) => [k, v.map((s) => RowBrandId.parse(s))],
              ),
            ),
          }
        : {}),
    },
  };
}

export function parseDatabaseRow(
  id: string,
  data: Record<string, unknown>,
): DatabaseRow {
  const rawProps = (data.properties ?? {}) as Record<string, unknown>;
  const properties: DatabaseRow["properties"] = {} as DatabaseRow["properties"];
  for (const [key, val] of Object.entries(rawProps)) {
    properties[PropertyBrandId.parse(key)] = val as PropertyValue;
  }
  return {
    id: RowBrandId.parse(id),
    databaseId: DatabaseBrandId.parse(data.databaseId),
    pageId: PageBrandId.parse(data.pageId),
    properties,
    createdBy: UserBrandId.parse(data.createdBy),
    createdAt: data.createdAt as DatabaseRow["createdAt"],
    updatedAt: data.updatedAt as DatabaseRow["updatedAt"],
  };
}

export function parseWorkspace(
  id: string,
  data: Record<string, unknown>,
): Workspace {
  return {
    id: WorkspaceBrandId.parse(id),
    name: DisplayName.parse(data.name),
    icon: IconEmoji.parse(data.icon ?? ""),
    ownerId: UserBrandId.parse(data.ownerId),
    memberIds: ((data.memberIds as string[]) ?? []).map((s) =>
      UserBrandId.parse(s),
    ),
    createdAt: data.createdAt as Workspace["createdAt"],
  };
}

export function parseUserProfile(data: Record<string, unknown>): UserProfile {
  return {
    uid: UserBrandId.parse(data.uid),
    email: Email.parse(data.email ?? ""),
    displayName: DisplayName.parse(data.displayName ?? ""),
    photoURL: ImageUrl.parse(data.photoURL ?? ""),
    updatedAt: data.updatedAt as UserProfile["updatedAt"],
  };
}
