import type { DatabaseRow, PropertyDefinition, ViewSort } from "@/types";
import type { PropertyBrandId } from "@/types";
import type { Timestamp } from "firebase/firestore";

function getCompareValue(value: unknown, type: string): string | number | null {
  if (value == null) return null;

  switch (type) {
    case "number": {
      if (typeof value === "number") return value;
      const parsed = Number(value);
      return isNaN(parsed) ? null : parsed;
    }
    case "checkbox":
      return value === true ? 1 : 0;
    case "date": {
      if (typeof value === "object" && "toMillis" in (value as Timestamp)) {
        return (value as Timestamp).toMillis();
      }
      if (typeof value === "object" && "toDate" in (value as Timestamp)) {
        return (value as Timestamp).toDate().getTime();
      }
      if (typeof value === "string") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d.getTime();
      }
      return null;
    }
    default:
      return typeof value === "string"
        ? value.toLowerCase()
        : String(value).toLowerCase();
  }
}

export function applySorts(
  rows: DatabaseRow[],
  sorts: ViewSort[],
  properties: Record<PropertyBrandId, PropertyDefinition>,
): DatabaseRow[] {
  if (sorts.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const propDef = properties[sort.propertyId];
      const type = propDef?.type ?? "text";

      const aVal = getCompareValue(a.properties[sort.propertyId], type);
      const bVal = getCompareValue(b.properties[sort.propertyId], type);

      // Nulls go to end regardless of direction
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));

      if (comparison !== 0) {
        return sort.direction === "desc" ? -comparison : comparison;
      }
    }
    return 0;
  });
}
