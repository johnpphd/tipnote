import {
  Box,
  Checkbox,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Database } from "@/types";
import type { PropertyBrandId } from "@/types";
import { SubPanelHeader, SortablePropertyItem } from "../toolbarItems";
import type { SettingsSection } from "../../_hooks/useToolbarUIState";

interface PropertiesSectionProps {
  database: Database;
  visibleProps: PropertyBrandId[];
  propertySensors: unknown;
  setSettingsSection: (s: SettingsSection) => void;
  onReorderProperties: (e: DragEndEvent) => void;
  onToggleColumn: (propId: PropertyBrandId | undefined) => void;
}

export default function PropertiesSection({
  database,
  visibleProps,
  propertySensors,
  setSettingsSection,
  onReorderProperties,
  onToggleColumn,
}: PropertiesSectionProps) {
  const hiddenIds = database.propertyOrder.filter(
    (id) => !visibleProps.includes(id) && database.properties[id],
  );

  return (
    <>
      <SubPanelHeader
        title="Property visibility"
        onBack={() => setSettingsSection("main")}
      />

      <DndContext
        sensors={propertySensors as never}
        collisionDetection={closestCenter}
        onDragEnd={onReorderProperties}
      >
        <SortableContext
          items={visibleProps}
          strategy={verticalListSortingStrategy}
        >
          <Box sx={{ py: 0.5 }}>
            {visibleProps.map((propId) => {
              const prop = database.properties[propId];
              if (!prop) return null;
              return (
                <SortablePropertyItem
                  key={propId}
                  propId={propId}
                  name={prop.name}
                  checked
                  onToggle={() => onToggleColumn(propId)}
                />
              );
            })}
          </Box>
        </SortableContext>
      </DndContext>

      {hiddenIds.length > 0 && (
        <>
          <Divider sx={{ mx: 1.5 }} />
          <List dense disablePadding sx={{ py: 0.5 }}>
            {hiddenIds.map((propId) => {
              const prop = database.properties[propId];
              if (!prop) return null;
              return (
                <ListItemButton
                  key={propId}
                  onClick={() => onToggleColumn(propId)}
                  dense
                  sx={{ px: 1.5, py: 0.25, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox size="small" checked={false} sx={{ p: 0 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={prop.name}
                    primaryTypographyProps={{
                      sx: { fontSize: "13px", color: "text.secondary" },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </>
      )}
    </>
  );
}
