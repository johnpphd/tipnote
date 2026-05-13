import { useState, useEffect, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";

export type CalendarMode = "month" | "week" | "4day";

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

interface UseCalendarNavigationArgs {
  initialMode?: string;
  initialDate?: string;
  onStateChange?: (mode: string, date: string) => void;
}

export function useCalendarNavigation({
  initialMode,
  initialDate,
  onStateChange,
}: UseCalendarNavigationArgs) {
  const [anchor, setAnchor] = useState(() => parseCalDate(initialDate));
  const [mode, setMode] = useState<CalendarMode>(() =>
    parseCalMode(initialMode),
  );

  useEffect(() => {
    onStateChange?.(mode, format(anchor, "yyyy-MM-dd"));
  }, [mode, anchor, onStateChange]);

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

  return {
    anchor,
    mode,
    handlePrev,
    handleNext,
    handleToday,
    handleModeChange,
  };
}
