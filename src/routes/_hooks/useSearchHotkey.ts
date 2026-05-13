import { useCallback, useEffect, useState } from "react";

export function useSearchHotkey() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K to open search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { searchOpen, setSearchOpen };
}
