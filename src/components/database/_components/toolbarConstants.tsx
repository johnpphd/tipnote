import {
  TableChart as TableIcon,
  ViewKanban as BoardIcon,
  ViewList as ListIcon,
  CalendarMonth as CalendarIcon,
  GridView as GalleryIcon,
  Tag as SelectIcon,
  TextFields as TextIcon,
  ArrowDropDownCircle as DropdownIcon,
  Checklist as MultiSelectIcon,
  CalendarToday as DateIcon,
  CheckBox as CheckboxIcon,
  Link as UrlIcon,
  Person as PersonIcon,
  Title as TitleIcon,
} from "@mui/icons-material";
import type { PropertyType, ViewType } from "@/types";
import { FILTER_OPERATORS } from "@/lib/database/filterEngine";

export const FILTER_CHIP_BG = "rgba(35, 131, 226, 0.14)";
export const FILTER_CHIP_FG = "rgb(35, 131, 226)";
export const FILTER_CHIP_FG_MUTED = "rgba(35, 131, 226, 0.5)";

export const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ReactElement> = {
  title: <TitleIcon sx={{ fontSize: 14 }} />,
  text: <TextIcon sx={{ fontSize: 14 }} />,
  number: <SelectIcon sx={{ fontSize: 14 }} />,
  select: <DropdownIcon sx={{ fontSize: 14 }} />,
  multiSelect: <MultiSelectIcon sx={{ fontSize: 14 }} />,
  date: <DateIcon sx={{ fontSize: 14 }} />,
  checkbox: <CheckboxIcon sx={{ fontSize: 14 }} />,
  url: <UrlIcon sx={{ fontSize: 14 }} />,
  person: <PersonIcon sx={{ fontSize: 14 }} />,
};

export const VIEW_TYPES: ViewType[] = [
  "table",
  "board",
  "list",
  "calendar",
  "gallery",
];

export const VIEW_TYPE_ICONS: Record<ViewType, React.ReactElement> = {
  table: <TableIcon sx={{ fontSize: 16 }} />,
  board: <BoardIcon sx={{ fontSize: 16 }} />,
  list: <ListIcon sx={{ fontSize: 16 }} />,
  calendar: <CalendarIcon sx={{ fontSize: 16 }} />,
  gallery: <GalleryIcon sx={{ fontSize: 16 }} />,
};

export const RANDOM_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "red",
  "yellow",
  "brown",
];

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const toolbarButtonSx = {
  fontSize: "13px",
  color: "text.secondary",
  textTransform: "none",
  minWidth: "auto",
  px: 1,
  py: 0.25,
  minHeight: 28,
} as const;

export function getOperatorLabel(
  propType: PropertyType,
  operator: string,
): string {
  const ops = FILTER_OPERATORS[propType] ?? FILTER_OPERATORS.text;
  const match = ops.find((op) => op.value === operator);
  return match?.label ?? operator.replace(/_/g, " ");
}
