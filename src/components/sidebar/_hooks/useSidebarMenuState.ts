import { useState } from "react";

export function useSidebarMenuState() {
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  return { addMenuAnchor, setAddMenuAnchor, showTrash, setShowTrash };
}
