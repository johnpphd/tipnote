import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import type { DatabaseView, ViewType } from "@/types";
import { VIEW_TYPES, VIEW_TYPE_ICONS, capitalize } from "../toolbarConstants";
import { SubPanelHeader } from "../toolbarItems";
import type { SettingsSection } from "../../_hooks/useToolbarUIState";

interface LayoutSectionProps {
  activeView: DatabaseView | undefined;
  setSettingsSection: (s: SettingsSection) => void;
  onChangeLayout: (type: ViewType) => void;
}

export default function LayoutSection({
  activeView,
  setSettingsSection,
  onChangeLayout,
}: LayoutSectionProps) {
  return (
    <>
      <SubPanelHeader
        title="Layout"
        onBack={() => setSettingsSection("main")}
      />
      <List dense disablePadding sx={{ py: 0.5 }}>
        {VIEW_TYPES.map((type) => (
          <ListItemButton
            key={type}
            onClick={() => {
              onChangeLayout(type);
              setSettingsSection("main");
            }}
            selected={activeView?.type === type}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 0,
              "&.Mui-selected": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              {VIEW_TYPE_ICONS[type]}
            </ListItemIcon>
            <ListItemText
              primary={capitalize(type)}
              slotProps={{
                primary: { sx: { fontSize: "13px" } },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </>
  );
}
