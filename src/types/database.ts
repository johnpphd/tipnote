import type { Timestamp } from "firebase/firestore";
import type {
  DatabaseBrandId,
  PageBrandId,
  WorkspaceBrandId,
  ViewBrandId,
  PropertyBrandId,
  RowBrandId,
  UserBrandId,
  SelectOptionBrandId,
  DisplayName,
  CssColor,
  FilterOperator,
} from "./brand";

export type PropertyType =
  | "title"
  | "text"
  | "number"
  | "select"
  | "multiSelect"
  | "date"
  | "checkbox"
  | "url"
  | "person";

export interface SelectOption {
  id: SelectOptionBrandId;
  name: DisplayName;
  color: CssColor;
}

export type NumberFormat = "number" | "percent";

export interface PropertyDefinition {
  id: PropertyBrandId;
  name: DisplayName;
  type: PropertyType;
  options?: SelectOption[];
  numberFormat?: NumberFormat;
}

export interface Database {
  id: DatabaseBrandId;
  pageId: PageBrandId;
  workspaceId: WorkspaceBrandId;
  properties: Record<PropertyBrandId, PropertyDefinition>;
  propertyOrder: PropertyBrandId[];
  viewOrder?: ViewBrandId[];
  defaultViewId: ViewBrandId;
}

export type ViewType = "table" | "board" | "list" | "calendar" | "gallery";

export interface ViewFilter {
  propertyId: PropertyBrandId;
  operator: FilterOperator;
  value: unknown;
}

export interface ViewSort {
  propertyId: PropertyBrandId;
  direction: "asc" | "desc";
}

export interface DatabaseView {
  id: ViewBrandId;
  databaseId: DatabaseBrandId;
  name: DisplayName;
  type: ViewType;
  config: {
    visibleProperties: PropertyBrandId[];
    sorts: ViewSort[];
    filters: ViewFilter[];
    groupBy?: PropertyBrandId;
    groupOrder?: string[];
    hiddenGroups?: string[];
    hideEmptyGroups?: boolean;
    groupSortOrder?: "manual" | "alphabetical";
    cardOrder?: Record<string, RowBrandId[]>;
    colorBy?: PropertyBrandId;
  };
}

export type PropertyValue =
  | string
  | number
  | boolean
  | string[]
  | Timestamp
  | null;

export interface DatabaseRow {
  id: RowBrandId;
  databaseId: DatabaseBrandId;
  pageId: PageBrandId;
  properties: Record<PropertyBrandId, PropertyValue>;
  createdBy: UserBrandId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
