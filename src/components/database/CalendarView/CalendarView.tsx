import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "@mui/icons-material";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import type {
  Database,
  DatabaseRow,
  DatabaseView,
  PropertyValue,
} from "@/types";
import type { RowBrandId, PropertyBrandId } from "@/types";
import type { Timestamp } from "firebase/firestore";
import {
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_BOLD,
} from "@/theme/fontWeights";
import { buildOptionColorMap, getRowColorHex } from "../colorUtils";

type CalendarMode = "month" | "week" | "4day";

interface CalendarViewProps {
  database: Database;
  rows: DatabaseRow[];
  view: DatabaseView;
  onUpdateRow: (
    rowId: RowBrandId,
    properties: Record<PropertyBrandId, PropertyValue>,
  ) => void;
  onAddRow: () => void;
  onRowClick: (row: DatabaseRow) => void;
  initialMode?: string;
  initialDate?: string;
  onStateChange?: (mode: string, date: string) => void;
}

function getDateFromValue(value: PropertyValue): Date | null {
  if (value == null) return null;
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }
  if (typeof value === "object" && "toDate" in (value as Timestamp)) {
    const d = (value as Timestamp).toDate();
    if (isNaN(d.getTime())) return null;
    return d;
  }
  return null;
}

function contrastText(bgColor: string): string {
  const hex = bgColor.replace("#", "");
  if (hex.length !== 6) return "#fff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#fff";
}

function getHeaderLabel(anchor: Date, mode: CalendarMode): string {
  if (mode === "month") return format(anchor, "MMMM yyyy");
  if (mode === "week") {
    const weekStart = startOfWeek(anchor);
    const weekEnd = endOfWeek(anchor);
    const sameMonth = format(weekStart, "MMM") === format(weekEnd, "MMM");
    if (sameMonth) {
      return `${format(weekStart, "MMM d")} \u2013 ${format(weekEnd, "d, yyyy")}`;
    }
    return `${format(weekStart, "MMM d")} \u2013 ${format(weekEnd, "MMM d, yyyy")}`;
  }
  // 4day
  const end = addDays(anchor, 3);
  const sameMonth = format(anchor, "MMM") === format(end, "MMM");
  if (sameMonth) {
    return `${format(anchor, "MMM d")} \u2013 ${format(end, "d, yyyy")}`;
  }
  return `${format(anchor, "MMM d")} \u2013 ${format(end, "MMM d, yyyy")}`;
}

function parseCalMode(s?: string): CalendarMode {
  if (s === "week" || s === "4day") return s;
  return "month";
}

function parseCalDate(s?: string): Date {
  if (s) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export default function CalendarView({
  database,
  rows,
  view: _view,
  onRowClick,
  initialMode,
  initialDate,
  onStateChange,
}: CalendarViewProps) {
  const [anchor, setAnchor] = useState(() => parseCalDate(initialDate));
  const [mode, setMode] = useState<CalendarMode>(() =>
    parseCalMode(initialMode),
  );

  // Sync calendar state to URL search params
  useEffect(() => {
    onStateChange?.(mode, format(anchor, "yyyy-MM-dd"));
  }, [mode, anchor, onStateChange]);

  // Find the date property to place events
  const datePropId = useMemo(() => {
    return database.propertyOrder.find(
      (id) => database.properties[id]?.type === "date",
    );
  }, [database]);

  const titlePropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "title",
  );

  // Use colorBy from view config, falling back to first select property
  const colorPropId = useMemo(() => {
    if (_view.config.colorBy) {
      const prop = database.properties[_view.config.colorBy];
      if (prop && (prop.type === "select" || prop.type === "multiSelect")) {
        return _view.config.colorBy;
      }
    }
    // Fallback: auto-detect first select property
    return database.propertyOrder.find(
      (id) =>
        database.properties[id]?.type === "select" &&
        database.properties[id]?.id !== datePropId,
    );
  }, [database, datePropId, _view.config.colorBy]);

  // Build a lookup from option ID to resolved color
  const optionColorMap = useMemo(
    () => buildOptionColorMap(database, colorPropId),
    [database, colorPropId],
  );

  // Get the resolved color for a row based on its select/multiSelect property value
  const getRowColor = useCallback(
    (row: DatabaseRow): string =>
      getRowColorHex(row, colorPropId, optionColorMap) ?? "",
    [colorPropId, optionColorMap],
  );

  // Generate calendar days based on mode
  const calendarDays = useMemo(() => {
    if (mode === "month") {
      const monthStart = startOfMonth(anchor);
      const monthEnd = endOfMonth(anchor);
      const calStart = startOfWeek(monthStart);
      const calEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calStart, end: calEnd });
    }
    if (mode === "week") {
      const weekStart = startOfWeek(anchor);
      const weekEnd = endOfWeek(anchor);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    // 4day
    return eachDayOfInterval({
      start: anchor,
      end: addDays(anchor, 3),
    });
  }, [anchor, mode]);

  const columnCount = mode === "4day" ? 4 : 7;

  // Group rows by date
  const rowsByDate = useMemo(() => {
    const map = new Map<string, DatabaseRow[]>();
    if (!datePropId) return map;

    for (const row of rows) {
      const date = getDateFromValue(row.properties[datePropId]);
      if (date) {
        const key = format(date, "yyyy-MM-dd");
        const existing = map.get(key) ?? [];
        existing.push(row);
        map.set(key, existing);
      }
    }
    return map;
  }, [rows, datePropId]);

  const handlePrev = useCallback(() => {
    setAnchor((a) => {
      if (mode === "month") return subMonths(a, 1);
      if (mode === "week") return subWeeks(a, 1);
      return subDays(a, 1);
    });
  }, [mode]);

  const handleNext = useCallback(() => {
    setAnchor((a) => {
      if (mode === "month") return addMonths(a, 1);
      if (mode === "week") return addWeeks(a, 1);
      return addDays(a, 1);
    });
  }, [mode]);

  const handleToday = useCallback(() => setAnchor(new Date()), []);

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: CalendarMode | null) => {
      if (newMode) setMode(newMode);
    },
    [],
  );

  const maxEventsPerCell = mode === "month" ? 3 : 15;
  const minCellHeight =
    mode === "month"
      ? { xs: 60, sm: 90 }
      : { xs: 300, sm: "calc(100vh - 280px)" };

  const weekdayHeaders =
    mode === "4day"
      ? calendarDays.map((d) => format(d, "EEE M/d"))
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!datePropId) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Calendar view requires a Date property.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a Date property to this database.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Header: mode toggle + navigation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              px: 1.5,
              py: 0.25,
              fontSize: "12px",
            },
          }}
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="4day">4 Day</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" aria-label="Previous" onClick={handlePrev}>
            <PrevIcon />
          </IconButton>
          <Typography
            variant="body1"
            onClick={handleToday}
            sx={{
              fontWeight: FONT_WEIGHT_SEMIBOLD,
              minWidth: mode === "month" ? 160 : 200,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {getHeaderLabel(anchor, mode)}
          </Typography>
          <IconButton size="small" aria-label="Next" onClick={handleNext}>
            <NextIcon />
          </IconButton>
        </Box>

        {/* Spacer to balance the layout */}
        <Box sx={{ width: mode === "month" ? 160 : 0 }} />
      </Box>

      {/* Weekday headers + Calendar grid */}
      <Box sx={{ overflowX: { xs: "auto", sm: "visible" } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            minWidth: mode === "4day" ? 300 : 500,
          }}
        >
          {weekdayHeaders.map((day) => (
            <Typography
              key={day}
              variant="body2"
              sx={{
                textAlign: "center",
                fontWeight: FONT_WEIGHT_SEMIBOLD,
                fontSize: "12px",
                color: "text.secondary",
                py: 0.5,
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
            minWidth: mode === "4day" ? 300 : 500,
          }}
        >
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayRows = rowsByDate.get(dateKey) ?? [];
            const isCurrentMonth =
              mode === "month" ? isSameMonth(day, anchor) : true;
            const isToday = isSameDay(day, new Date());

            return (
              <Box
                key={dateKey}
                sx={{
                  minHeight: minCellHeight,
                  border: 1,
                  borderColor: "divider",
                  p: 0.5,
                  overflow: mode === "month" ? "hidden" : "auto",
                  minWidth: 0,
                  bgcolor: isCurrentMonth
                    ? "transparent"
                    : "action.disabledBackground",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "12px",
                    fontWeight: isToday
                      ? FONT_WEIGHT_BOLD
                      : FONT_WEIGHT_REGULAR,
                    color: isCurrentMonth ? "text.primary" : "text.disabled",
                    bgcolor: isToday ? "primary.main" : "transparent",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...(isToday && { color: "primary.contrastText" }),
                  }}
                >
                  {format(day, "d")}
                </Typography>
                {dayRows.slice(0, maxEventsPerCell).map((row) => {
                  const chipColor = getRowColor(row);
                  const bg = chipColor || undefined;
                  const fg = chipColor ? contrastText(chipColor) : undefined;
                  const isExpanded = mode !== "month";

                  // Gather detail fields for expanded view
                  const detailLines: string[] = [];
                  if (isExpanded) {
                    for (const propId of database.propertyOrder) {
                      const prop = database.properties[propId];
                      if (
                        !prop ||
                        prop.type === "title" ||
                        prop.type === "date" ||
                        propId === colorPropId
                      )
                        continue;
                      const val = row.properties[propId];
                      if (val == null || val === "") continue;
                      let display = String(val);
                      // Resolve select option IDs to names
                      if (prop.type === "select" && prop.options) {
                        const opt = prop.options.find((o) => o.id === val);
                        if (opt) display = opt.name;
                      }
                      if (display.length > 0) {
                        detailLines.push(`${prop.name}: ${display}`);
                      }
                    }
                  }
                  const maxDetails = mode === "4day" ? 6 : 3;

                  return (
                    <Paper
                      key={row.id}
                      onClick={() => onRowClick(row)}
                      elevation={0}
                      sx={{
                        px: mode === "4day" ? 1 : isExpanded ? 0.75 : 0.5,
                        py: mode === "4day" ? 0.75 : isExpanded ? 0.5 : 0.25,
                        mt: 0.25,
                        bgcolor: bg ?? "primary.main",
                        color: fg ?? "primary.contrastText",
                        borderRadius: 0.5,
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      <Typography
                        variant="caption"
                        noWrap={mode === "month"}
                        sx={{
                          fontSize:
                            mode === "4day"
                              ? "13px"
                              : isExpanded
                                ? "12px"
                                : "10px",
                          fontWeight: isExpanded
                            ? FONT_WEIGHT_SEMIBOLD
                            : FONT_WEIGHT_REGULAR,
                          display: "block",
                          lineHeight: 1.3,
                        }}
                      >
                        {titlePropId
                          ? (row.properties[titlePropId] as string) ||
                            "Untitled"
                          : "Untitled"}
                      </Typography>
                      {isExpanded &&
                        detailLines.slice(0, maxDetails).map((line, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            noWrap={mode !== "4day"}
                            sx={{
                              fontSize: mode === "4day" ? "11px" : "10px",
                              display: "block",
                              opacity: 0.85,
                              lineHeight: 1.3,
                            }}
                          >
                            {line}
                          </Typography>
                        ))}
                    </Paper>
                  );
                })}
                {dayRows.length > maxEventsPerCell && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "10px",
                      color: "text.secondary",
                      display: "block",
                      mt: 0.25,
                    }}
                  >
                    +{dayRows.length - maxEventsPerCell} more
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
