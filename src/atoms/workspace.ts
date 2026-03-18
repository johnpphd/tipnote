import { atomWithStorage } from "jotai/utils";
import type { WorkspaceBrandId } from "@/types";

export const workspaceIdAtom = atomWithStorage<WorkspaceBrandId | null>(
  "tipnote-workspace-id",
  null,
);

export const sidebarOpenAtom = atomWithStorage("tipnote-sidebar-open", true);

export const themeModeAtom = atomWithStorage<"light" | "dark">(
  "tipnote-theme-mode",
  "dark",
);
