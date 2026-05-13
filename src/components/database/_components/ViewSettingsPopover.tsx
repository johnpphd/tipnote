import { Box, Popover } from "@mui/material";
import type { DragEndEvent } from "@dnd-kit/core";
import type {
  Database,
  DatabaseView,
  PropertyDefinition,
  ViewBrandId,
  ViewType,
} from "@/types";
import type { PropertyBrandId } from "@/types";
import type { SettingsSection } from "../_hooks/useToolbarUIState";
import MainSection from "./settings/MainSection";
import LayoutSection from "./settings/LayoutSection";
import PropertiesSection from "./settings/PropertiesSection";
import GroupSection from "./settings/GroupSection";
import ColorSection from "./settings/ColorSection";

interface ViewSettingsPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  database: Database;
  views: DatabaseView[];
  activeView: DatabaseView | undefined;
  activeViewId: ViewBrandId;
  visibleProps: PropertyBrandId[];
  settingsSection: SettingsSection;
  setSettingsSection: (s: SettingsSection) => void;
  setSettingsAnchor: (el: HTMLElement | null) => void;
  setFilterAnchor: (el: HTMLElement | null) => void;
  setSortAnchor: (el: HTMLElement | null) => void;
  editingViewName: boolean;
  setEditingViewName: (v: boolean) => void;
  viewNameDraft: string;
  setViewNameDraft: (v: string) => void;
  propertySensors: unknown;
  onRenameView: (name: string) => void;
  onChangeLayout: (type: ViewType) => void;
  onReorderProperties: (e: DragEndEvent) => void;
  onToggleColumn: (propId: PropertyBrandId | undefined) => void;
  onChangeGroupBy: (propId: PropertyBrandId | undefined) => void;
  onChangeColorBy: (propId: PropertyBrandId | null) => void;
  onUpdateViewConfig?: (config: Partial<DatabaseView["config"]>) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
  onDeleteView: (viewId: ViewBrandId) => void;
}

export default function ViewSettingsPopover(props: ViewSettingsPopoverProps) {
  const { anchorEl, onClose, settingsSection } = props;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Box sx={{ width: 280 }}>
        {settingsSection === "main" && (
          <MainSection
            activeView={props.activeView}
            activeViewId={props.activeViewId}
            visibleProps={props.visibleProps}
            views={props.views}
            database={props.database}
            setSettingsSection={props.setSettingsSection}
            setSettingsAnchor={props.setSettingsAnchor}
            setFilterAnchor={props.setFilterAnchor}
            setSortAnchor={props.setSortAnchor}
            editingViewName={props.editingViewName}
            setEditingViewName={props.setEditingViewName}
            viewNameDraft={props.viewNameDraft}
            setViewNameDraft={props.setViewNameDraft}
            onRenameView={props.onRenameView}
            onDeleteView={props.onDeleteView}
          />
        )}

        {settingsSection === "layout" && (
          <LayoutSection
            activeView={props.activeView}
            setSettingsSection={props.setSettingsSection}
            onChangeLayout={props.onChangeLayout}
          />
        )}

        {settingsSection === "properties" && (
          <PropertiesSection
            database={props.database}
            visibleProps={props.visibleProps}
            propertySensors={props.propertySensors}
            setSettingsSection={props.setSettingsSection}
            onReorderProperties={props.onReorderProperties}
            onToggleColumn={props.onToggleColumn}
          />
        )}

        {settingsSection === "group" && props.activeView && (
          <GroupSection
            database={props.database}
            activeView={props.activeView}
            propertySensors={props.propertySensors}
            setSettingsSection={props.setSettingsSection}
            onChangeGroupBy={props.onChangeGroupBy}
            onUpdateViewConfig={props.onUpdateViewConfig}
            onUpdateProperty={props.onUpdateProperty}
          />
        )}

        {settingsSection === "color" && (
          <ColorSection
            database={props.database}
            activeView={props.activeView}
            setSettingsSection={props.setSettingsSection}
            onChangeColorBy={props.onChangeColorBy}
          />
        )}
      </Box>
    </Popover>
  );
}
