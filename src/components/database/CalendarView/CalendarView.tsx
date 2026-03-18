import { useState, useMemo, useCallback } from "react";
import { Box, Typography, IconButton, Paper } from "@mui/material";
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
}

function getDateFromValue(value: PropertyValue): Date | null {
  if (value == null) return null;
  if (typeof value === "string" && value) return new Date(value);
  if (typeof value === "object" && "toDate" in (value as Timestamp)) {
    return (value as Timestamp).toDate();
  }
  return null;
}

export default function CalendarView({
  database,
  rows,
  view: _view,
  onRowClick,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Find the date property to place events
  const datePropId = useMemo(() => {
    return database.propertyOrder.find(
      (id) => database.properties[id]?.type === "date",
    );
  }, [database]);

  const titlePropId = database.propertyOrder.find(
    (id) => database.properties[id]?.type === "title",
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

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

  const handlePrevMonth = useCallback(
    () => setCurrentMonth((m) => subMonths(m, 1)),
    [],
  );
  const handleNextMonth = useCallback(
    () => setCurrentMonth((m) => addMonths(m, 1)),
    [],
  );

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      {/* Month navigation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mb: 1.5,
        }}
      >
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={handlePrevMonth}
        >
          <PrevIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            fontWeight: FONT_WEIGHT_SEMIBOLD,
            minWidth: 180,
            textAlign: "center",
          }}
        >
          {format(currentMonth, "MMMM yyyy")}
        </Typography>
        <IconButton
          size="small"
          aria-label="Next month"
          onClick={handleNextMonth}
        >
          <NextIcon />
        </IconButton>
      </Box>

      {/* Weekday headers + Calendar grid wrapper for horizontal scroll on mobile */}
      <Box sx={{ overflowX: { xs: "auto", sm: "visible" } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            minWidth: 500,
          }}
        >
          {weekdays.map((day) => (
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
            gridTemplateColumns: "repeat(7, 1fr)",
            minWidth: 500,
          }}
        >
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayRows = rowsByDate.get(dateKey) ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <Box
                key={dateKey}
                sx={{
                  minHeight: { xs: 60, sm: 90 },
                  border: 1,
                  borderColor: "divider",
                  p: 0.5,
                  overflow: "hidden",
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
                {dayRows.slice(0, 3).map((row) => (
                  <Paper
                    key={row.id}
                    onClick={() => onRowClick(row)}
                    elevation={0}
                    sx={{
                      px: 0.5,
                      py: 0.25,
                      mt: 0.25,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderRadius: 0.5,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                  >
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ fontSize: "10px", display: "block" }}
                    >
                      {titlePropId
                        ? (row.properties[titlePropId] as string) || "Untitled"
                        : "Untitled"}
                    </Typography>
                  </Paper>
                ))}
                {dayRows.length > 3 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "10px",
                      color: "text.secondary",
                      display: "block",
                      mt: 0.25,
                    }}
                  >
                    +{dayRows.length - 3} more
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
