import { useEffect, useRef, useState } from "react";
import type { ViewBrandId } from "@/types";

export type SettingsSection =
  | "main"
  | "layout"
  | "properties"
  | "group"
  | "color";

export interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  viewId: ViewBrandId;
}

interface UseToolbarUIStateArgs {
  openGroupSettings?: boolean;
  onGroupSettingsOpened?: () => void;
}

export function useToolbarUIState({
  openGroupSettings,
  onGroupSettingsOpened,
}: UseToolbarUIStateArgs) {
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection>("main");
  const [showSearch, setShowSearch] = useState(false);
  const [editingViewName, setEditingViewName] = useState(false);
  const [viewNameDraft, setViewNameDraft] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (openGroupSettings && settingsButtonRef.current) {
      setSettingsAnchor(settingsButtonRef.current);
      setSettingsSection("group");
      onGroupSettingsOpened?.();
    }
  }, [openGroupSettings, onGroupSettingsOpened]);

  return {
    columnsAnchor,
    setColumnsAnchor,
    filterAnchor,
    setFilterAnchor,
    sortAnchor,
    setSortAnchor,
    settingsAnchor,
    setSettingsAnchor,
    settingsSection,
    setSettingsSection,
    showSearch,
    setShowSearch,
    editingViewName,
    setEditingViewName,
    viewNameDraft,
    setViewNameDraft,
    contextMenu,
    setContextMenu,
    searchInputRef,
    settingsButtonRef,
  };
}
