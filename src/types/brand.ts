import { z } from "zod";

// --- Identity brands ---
export const PageBrandId = z.string().brand("PageId");
export type PageBrandId = z.infer<typeof PageBrandId>;

export const BlockBrandId = z.string().brand("BlockId");
export type BlockBrandId = z.infer<typeof BlockBrandId>;

export const DatabaseBrandId = z.string().brand("DatabaseId");
export type DatabaseBrandId = z.infer<typeof DatabaseBrandId>;

export const ViewBrandId = z.string().brand("ViewId");
export type ViewBrandId = z.infer<typeof ViewBrandId>;

export const WorkspaceBrandId = z.string().brand("WorkspaceId");
export type WorkspaceBrandId = z.infer<typeof WorkspaceBrandId>;

export const UserBrandId = z.string().brand("UserId");
export type UserBrandId = z.infer<typeof UserBrandId>;

export const PropertyBrandId = z.string().brand("PropertyId");
export type PropertyBrandId = z.infer<typeof PropertyBrandId>;

export const RowBrandId = z.string().brand("RowId");
export type RowBrandId = z.infer<typeof RowBrandId>;

export const SelectOptionBrandId = z.string().brand("SelectOptionId");
export type SelectOptionBrandId = z.infer<typeof SelectOptionBrandId>;

// --- Semantic string brands ---
export const Title = z.string().brand("Title");
export type Title = z.infer<typeof Title>;

export const IconEmoji = z.string().brand("IconEmoji");
export type IconEmoji = z.infer<typeof IconEmoji>;

export const ImageUrl = z.string().brand("ImageUrl");
export type ImageUrl = z.infer<typeof ImageUrl>;

export const ShareToken = z.string().brand("ShareToken");
export type ShareToken = z.infer<typeof ShareToken>;

export const Email = z.string().brand("Email");
export type Email = z.infer<typeof Email>;

export const DisplayName = z.string().brand("DisplayName");
export type DisplayName = z.infer<typeof DisplayName>;

export const CssColor = z.string().brand("CssColor");
export type CssColor = z.infer<typeof CssColor>;

export const FilterOperator = z.string().brand("FilterOperator");
export type FilterOperator = z.infer<typeof FilterOperator>;
