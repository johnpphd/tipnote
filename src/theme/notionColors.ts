/**
 * Notion-style select/multi-select tag colors.
 * Used as runtime values for dynamic color lookups in database views.
 */
export const NOTION_COLORS: Record<string, string> = {
  default: "#505050",
  gray: "#505050",
  brown: "#8b6544",
  orange: "#c06c0e",
  yellow: "#c0920e",
  green: "#2e7e5a",
  blue: "#2e6dba",
  purple: "#6940a5",
  pink: "#ae3b82",
  red: "#c44747",
};

/** Resolve a Notion color name to its hex value, passing through raw hex/CSS colors. */
export function resolveColor(color: string): string {
  return NOTION_COLORS[color] ?? color;
}
