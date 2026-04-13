import type { Database, DatabaseRow } from "@/types";
import type { PropertyBrandId } from "@/types";
import { resolveColor } from "@/theme/notionColors";

/**
 * Build a map from select/multiSelect option ID to resolved hex color.
 * Returns an empty map when colorByPropId is undefined or the property has no options.
 */
export function buildOptionColorMap(
  database: Database,
  colorByPropId: PropertyBrandId | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!colorByPropId) return map;
  const prop = database.properties[colorByPropId];
  if (prop?.options) {
    for (const opt of prop.options) {
      map.set(opt.id, resolveColor(opt.color));
    }
  }
  return map;
}

/**
 * Look up the resolved hex color for a row based on its select/multiSelect property value.
 * For multiSelect, returns the first selected option's color.
 * Returns undefined when no color applies.
 */
export function getRowColorHex(
  row: DatabaseRow,
  colorByPropId: PropertyBrandId | undefined,
  optionColorMap: Map<string, string>,
): string | undefined {
  if (!colorByPropId || optionColorMap.size === 0) return undefined;
  const value = row.properties[colorByPropId];
  if (typeof value === "string" && optionColorMap.has(value)) {
    return optionColorMap.get(value)!;
  }
  if (Array.isArray(value) && value.length > 0) {
    const firstId = value[0] as string;
    if (optionColorMap.has(firstId)) {
      return optionColorMap.get(firstId)!;
    }
  }
  return undefined;
}
