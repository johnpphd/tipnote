import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "notion-sidebar-split-ratio";
const DEFAULT_RATIO = 0.6;
const MIN_RATIO = 0.15;
const MAX_RATIO = 0.85;

function clampRatio(ratio: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
}

function loadRatio(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return clampRatio(parsed);
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_RATIO;
}

function saveRatio(ratio: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(ratio));
  } catch {
    // localStorage unavailable
  }
}

interface UseDragResizeResult {
  /** Ratio of the top section (0..1) */
  ratio: number;
  /** Whether user is currently dragging */
  isDragging: boolean;
  /** Attach to the container element to measure available height */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Mouse down handler for the divider */
  onDividerMouseDown: (e: React.MouseEvent) => void;
}

export function useDragResize(): UseDragResizeResult {
  const [ratio, setRatio] = useState(loadRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const newRatio = clampRatio(relativeY / rect.height);
      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Save on release
      setRatio((current) => {
        saveRatio(current);
        return current;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  return { ratio, isDragging, containerRef, onDividerMouseDown };
}
