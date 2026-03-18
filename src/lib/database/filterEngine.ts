import type {
  DatabaseRow,
  PropertyDefinition,
  PropertyType,
  ViewFilter,
} from "@/types";
import { FilterOperator, type PropertyBrandId } from "@/types";
import type { Timestamp } from "firebase/firestore";

type FilterOp =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "greater_than"
  | "less_than"
  | "greater_equal"
  | "less_equal"
  | "is_checked"
  | "is_unchecked";

export const FILTER_OPERATORS: Record<
  string,
  { label: string; value: FilterOp }[]
> = {
  text: [
    { label: "equals", value: "equals" },
    { label: "does not equal", value: "not_equals" },
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "not_contains" },
    { label: "starts with", value: "starts_with" },
    { label: "ends with", value: "ends_with" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  title: [
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "not_contains" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  number: [
    { label: "=", value: "equals" },
    { label: "\u2260", value: "not_equals" },
    { label: ">", value: "greater_than" },
    { label: "<", value: "less_than" },
    { label: "\u2265", value: "greater_equal" },
    { label: "\u2264", value: "less_equal" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  select: [
    { label: "is", value: "equals" },
    { label: "is not", value: "not_equals" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  multiSelect: [
    { label: "contains", value: "contains" },
    { label: "does not contain", value: "not_contains" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  date: [
    { label: "is", value: "equals" },
    { label: "is before", value: "less_than" },
    { label: "is after", value: "greater_than" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  checkbox: [
    { label: "is checked", value: "is_checked" },
    { label: "is unchecked", value: "is_unchecked" },
  ],
  url: [
    { label: "equals", value: "equals" },
    { label: "contains", value: "contains" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
  person: [
    { label: "is", value: "equals" },
    { label: "is not", value: "not_equals" },
    { label: "is empty", value: "is_empty" },
    { label: "is not empty", value: "is_not_empty" },
  ],
};

function getStringValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return String(value);
}

function getNumericValue(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

function getTimestampMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "object" && "toMillis" in (value as Timestamp)) {
    return (value as Timestamp).toMillis();
  }
  return null;
}

function matchesFilter(
  rowValue: unknown,
  filter: ViewFilter,
  propDef: PropertyDefinition | undefined,
): boolean {
  const operator = filter.operator as unknown as FilterOp;
  const filterValue = filter.value;

  // Handle empty/not-empty checks universally
  if (operator === "is_empty") {
    return (
      rowValue == null ||
      rowValue === "" ||
      (Array.isArray(rowValue) && rowValue.length === 0)
    );
  }
  if (operator === "is_not_empty") {
    return (
      rowValue != null &&
      rowValue !== "" &&
      !(Array.isArray(rowValue) && rowValue.length === 0)
    );
  }

  // Checkbox shortcuts
  if (operator === "is_checked") return rowValue === true;
  if (operator === "is_unchecked") return rowValue !== true;

  const type = propDef?.type ?? "text";

  if (type === "number") {
    const numRow = getNumericValue(rowValue);
    const numFilter = getNumericValue(filterValue);
    if (numRow == null || numFilter == null) return false;
    switch (operator) {
      case "equals":
        return numRow === numFilter;
      case "not_equals":
        return numRow !== numFilter;
      case "greater_than":
        return numRow > numFilter;
      case "less_than":
        return numRow < numFilter;
      case "greater_equal":
        return numRow >= numFilter;
      case "less_equal":
        return numRow <= numFilter;
      default:
        return true;
    }
  }

  if (type === "date") {
    const rowMs = getTimestampMs(rowValue);
    const filterMs =
      typeof filterValue === "string" ? new Date(filterValue).getTime() : null;
    if (rowMs == null || filterMs == null) return false;
    switch (operator) {
      case "equals":
        return Math.abs(rowMs - filterMs) < 86400000; // same day
      case "greater_than":
        return rowMs > filterMs;
      case "less_than":
        return rowMs < filterMs;
      default:
        return true;
    }
  }

  if (type === "multiSelect") {
    const arr = Array.isArray(rowValue) ? rowValue : [];
    const filterStr = getStringValue(filterValue).toLowerCase();
    switch (operator) {
      case "contains":
        return arr.some((v) => getStringValue(v).toLowerCase() === filterStr);
      case "not_contains":
        return !arr.some((v) => getStringValue(v).toLowerCase() === filterStr);
      default:
        return true;
    }
  }

  // String-based operators for text, title, select, url, person
  const strRow = getStringValue(rowValue).toLowerCase();
  const strFilter = getStringValue(filterValue).toLowerCase();

  switch (operator) {
    case "equals":
      return strRow === strFilter;
    case "not_equals":
      return strRow !== strFilter;
    case "contains":
      return strRow.includes(strFilter);
    case "not_contains":
      return !strRow.includes(strFilter);
    case "starts_with":
      return strRow.startsWith(strFilter);
    case "ends_with":
      return strRow.endsWith(strFilter);
    default:
      return true;
  }
}

export function applyFilters(
  rows: DatabaseRow[],
  filters: ViewFilter[],
  properties: Record<PropertyBrandId, PropertyDefinition>,
): DatabaseRow[] {
  if (filters.length === 0) return rows;

  return rows.filter((row) =>
    filters.every((filter) => {
      const rowValue = row.properties[filter.propertyId];
      const propDef = properties[filter.propertyId];
      return matchesFilter(rowValue, filter, propDef);
    }),
  );
}

/** Returns the default operator for a property type */
export function defaultOperatorForType(type: PropertyType): FilterOperator {
  const ops = FILTER_OPERATORS[type];
  return FilterOperator.parse(ops?.[0]?.value ?? "contains");
}
