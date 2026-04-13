import { v4 as uuidv4 } from "uuid";
import {
  pagesCollection,
  pageRef,
  databasesCollection,
  databaseRef,
  dbRowsCollection,
  dbRowRef,
  dbViewsCollection,
  dbViewRef,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "@/lib/firebase";
import type {
  DatabaseView,
  PropertyDefinition,
  PropertyValue,
  ViewFilter,
  ViewSort,
  ViewType,
} from "@/types";
import {
  PageBrandId,
  DatabaseBrandId,
  ViewBrandId,
  PropertyBrandId,
  RowBrandId,
  type WorkspaceBrandId,
  type UserBrandId,
} from "@/types";

export async function createDatabase(
  workspaceId: WorkspaceBrandId,
  userId: UserBrandId,
  title: string,
): Promise<{
  databaseId: DatabaseBrandId;
  pageId: PageBrandId;
  viewId: ViewBrandId;
}> {
  const titlePropId = PropertyBrandId.parse(uuidv4());

  // Create the page for the database
  const pageDocRef = await addDoc(pagesCollection(), {
    title: title || "Untitled Database",
    icon: "",
    coverImage: "",
    parentId: null,
    childOrder: [],
    type: "database",
    databaseId: null, // will update after creating database
    isDbRow: false,
    parentDatabaseId: null,
    workspaceId,
    ownerId: userId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });

  // Create the database document
  const dbDocRef = await addDoc(databasesCollection(), {
    pageId: pageDocRef.id,
    workspaceId,
    properties: {
      [titlePropId]: {
        id: titlePropId,
        name: "Name",
        type: "title",
      },
    },
    propertyOrder: [titlePropId],
    defaultViewId: null, // will update after creating view
  });

  // Create default table view
  const viewDocRef = await addDoc(dbViewsCollection(), {
    databaseId: dbDocRef.id,
    workspaceId,
    name: "Table View",
    type: "table",
    config: {
      visibleProperties: [titlePropId],
      sorts: [],
      filters: [],
    },
  });

  // Link page -> database and database -> default view
  await updateDoc(pageRef(PageBrandId.parse(pageDocRef.id)), {
    databaseId: dbDocRef.id,
  });
  await updateDoc(databaseRef(DatabaseBrandId.parse(dbDocRef.id)), {
    defaultViewId: viewDocRef.id,
    viewOrder: [viewDocRef.id],
  });

  return {
    databaseId: DatabaseBrandId.parse(dbDocRef.id),
    pageId: PageBrandId.parse(pageDocRef.id),
    viewId: ViewBrandId.parse(viewDocRef.id),
  };
}

export async function addProperty(
  databaseId: DatabaseBrandId,
  property: PropertyDefinition,
): Promise<void> {
  await updateDoc(databaseRef(databaseId), {
    [`properties.${property.id}`]: property,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProperty(
  databaseId: DatabaseBrandId,
  property: PropertyDefinition,
): Promise<void> {
  await updateDoc(databaseRef(databaseId), {
    [`properties.${property.id}`]: property,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePropertyOrder(
  databaseId: DatabaseBrandId,
  propertyOrder: PropertyBrandId[],
): Promise<void> {
  await updateDoc(databaseRef(databaseId), { propertyOrder });
}

export async function deleteProperty(
  databaseId: DatabaseBrandId,
  propertyId: PropertyBrandId,
): Promise<void> {
  const { deleteField } = await import("firebase/firestore");
  await updateDoc(databaseRef(databaseId), {
    [`properties.${propertyId}`]: deleteField(),
  });
}

export async function createDatabaseRow(
  workspaceId: WorkspaceBrandId,
  userId: UserBrandId,
  databaseId: DatabaseBrandId,
  properties: Record<PropertyBrandId, PropertyValue> = {} as Record<
    PropertyBrandId,
    PropertyValue
  >,
  titlePropertyId?: PropertyBrandId,
): Promise<PageBrandId> {
  const pageTitle =
    titlePropertyId && typeof properties[titlePropertyId] === "string"
      ? (properties[titlePropertyId] as string)
      : "";

  // Create a page for the row
  const pageDocRef = await addDoc(pagesCollection(), {
    title: pageTitle,
    icon: "",
    coverImage: "",
    parentId: null,
    childOrder: [],
    type: "page",
    databaseId: null,
    isDbRow: true,
    parentDatabaseId: databaseId,
    workspaceId,
    ownerId: userId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });

  // Dual-write: ensure title is in properties so table view shows it immediately
  const rowProperties = titlePropertyId
    ? { ...properties, [titlePropertyId]: pageTitle }
    : properties;

  // Create the row document
  await addDoc(dbRowsCollection(), {
    databaseId,
    pageId: pageDocRef.id,
    workspaceId,
    properties: rowProperties,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return PageBrandId.parse(pageDocRef.id);
}

export async function updateDatabaseRow(
  rowId: RowBrandId,
  properties: Record<PropertyBrandId, PropertyValue>,
): Promise<void> {
  // Merge individual property fields so we don't overwrite the whole object
  const updates: Record<string, PropertyValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    updates[`properties.${key}`] = value;
  }
  await updateDoc(dbRowRef(rowId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDatabaseRow(
  rowId: RowBrandId,
  pageId: PageBrandId,
): Promise<void> {
  // Soft-delete the page
  await updateDoc(pageRef(pageId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
  // Delete the row document
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(dbRowRef(rowId));
}

export async function createDatabaseView(
  workspaceId: WorkspaceBrandId,
  databaseId: DatabaseBrandId,
  name: string,
  type: ViewType,
  visibleProperties: PropertyBrandId[],
): Promise<ViewBrandId> {
  const viewDocRef = await addDoc(dbViewsCollection(), {
    databaseId,
    workspaceId,
    name,
    type,
    config: {
      visibleProperties,
      sorts: [],
      filters: [],
    },
  });
  return ViewBrandId.parse(viewDocRef.id);
}

export async function updateDatabaseView(
  viewId: ViewBrandId,
  updates: {
    name?: string;
    type?: ViewType;
    visibleProperties?: PropertyBrandId[];
    sorts?: ViewSort[];
    filters?: ViewFilter[];
    groupBy?: PropertyBrandId;
    groupOrder?: string[];
    hiddenGroups?: string[];
    hideEmptyGroups?: boolean;
    groupSortOrder?: "manual" | "alphabetical";
    cardOrder?: Record<string, RowBrandId[]>;
    colorBy?: PropertyBrandId | null;
  },
): Promise<void> {
  const configUpdates: Record<string, unknown> = {};
  if (updates.visibleProperties !== undefined) {
    configUpdates["config.visibleProperties"] = updates.visibleProperties;
  }
  if (updates.sorts !== undefined) {
    configUpdates["config.sorts"] = updates.sorts;
  }
  if (updates.filters !== undefined) {
    configUpdates["config.filters"] = updates.filters;
  }
  if (updates.groupBy !== undefined) {
    configUpdates["config.groupBy"] = updates.groupBy;
  }
  if (updates.groupOrder !== undefined) {
    configUpdates["config.groupOrder"] = updates.groupOrder;
  }
  if (updates.hiddenGroups !== undefined) {
    configUpdates["config.hiddenGroups"] = updates.hiddenGroups;
  }
  if (updates.hideEmptyGroups !== undefined) {
    configUpdates["config.hideEmptyGroups"] = updates.hideEmptyGroups;
  }
  if (updates.groupSortOrder !== undefined) {
    configUpdates["config.groupSortOrder"] = updates.groupSortOrder;
  }
  if (updates.cardOrder !== undefined) {
    configUpdates["config.cardOrder"] = updates.cardOrder;
  }
  if (updates.colorBy !== undefined) {
    configUpdates["config.colorBy"] = updates.colorBy;
  }

  const docUpdates: Record<string, unknown> = { ...configUpdates };
  if (updates.name !== undefined) docUpdates.name = updates.name;
  if (updates.type !== undefined) docUpdates.type = updates.type;

  await updateDoc(dbViewRef(viewId), docUpdates);
}

export async function deleteDatabaseView(
  databaseId: DatabaseBrandId,
  viewId: ViewBrandId,
  currentDefaultViewId: ViewBrandId,
  allViewIds: ViewBrandId[],
  viewOrder?: ViewBrandId[],
): Promise<ViewBrandId | null> {
  // Cannot delete the last view
  if (allViewIds.length <= 1) return null;

  const newViewOrder = (viewOrder ?? allViewIds).filter((id) => id !== viewId);

  let fallbackViewId: ViewBrandId | null = null;

  // If deleting the default view, pick the first in the new order
  if (viewId === currentDefaultViewId) {
    fallbackViewId = newViewOrder[0] ?? allViewIds.find((id) => id !== viewId)!;
    await updateDoc(databaseRef(databaseId), {
      defaultViewId: fallbackViewId,
      viewOrder: newViewOrder,
    });
  } else {
    await updateDoc(databaseRef(databaseId), { viewOrder: newViewOrder });
  }

  // Delete the view document
  const { deleteDoc: deleteDocFn } = await import("firebase/firestore");
  await deleteDocFn(dbViewRef(viewId));

  return fallbackViewId;
}

export async function updateViewOrder(
  databaseId: DatabaseBrandId,
  viewOrder: ViewBrandId[],
  defaultViewId: ViewBrandId,
): Promise<void> {
  await updateDoc(databaseRef(databaseId), { viewOrder, defaultViewId });
}

export function sortViewsByOrder(
  views: DatabaseView[],
  viewOrder?: ViewBrandId[],
): DatabaseView[] {
  if (!viewOrder || viewOrder.length === 0) return views;
  const orderMap = new Map(viewOrder.map((id, i) => [id, i]));
  return [...views].sort((a, b) => {
    const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}
