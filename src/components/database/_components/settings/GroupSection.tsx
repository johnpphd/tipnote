import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Switch,
  Divider,
  List,
  Button,
} from "@mui/material";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Add as AddIcon,
  SortByAlpha as SortByAlphaIcon,
} from "@mui/icons-material";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type {
  Database,
  DatabaseView,
  PropertyDefinition,
  SelectOption,
} from "@/types";
import {
  PropertyBrandId,
  SelectOptionBrandId,
  DisplayName,
  CssColor,
} from "@/types";
import { RANDOM_COLORS } from "../toolbarConstants";
import { SubPanelHeader, SortableGroupItem } from "../toolbarItems";
import type { SettingsSection } from "../../_hooks/useToolbarUIState";

interface GroupSectionProps {
  database: Database;
  activeView: DatabaseView;
  propertySensors: unknown;
  setSettingsSection: (s: SettingsSection) => void;
  onChangeGroupBy: (propId: PropertyBrandId | undefined) => void;
  onUpdateViewConfig?: (config: Partial<DatabaseView["config"]>) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
}

export default function GroupSection({
  database,
  activeView,
  propertySensors,
  setSettingsSection,
  onChangeGroupBy,
  onUpdateViewConfig,
  onUpdateProperty,
}: GroupSectionProps) {
  return (
    <>
      <SubPanelHeader title="Group" onBack={() => setSettingsSection("main")} />

      <Box sx={{ px: 1.5, py: 0.75 }}>
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: FONT_WEIGHT_SEMIBOLD,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            mb: 0.5,
          }}
        >
          Group by
        </Typography>
        <Select
          value={activeView?.config.groupBy ?? ""}
          onChange={(e) => {
            onChangeGroupBy(PropertyBrandId.parse(e.target.value as string));
          }}
          size="small"
          fullWidth
          displayEmpty
          sx={{
            fontSize: "13px",
            height: 28,
            "& .MuiSelect-select": { py: 0.25, px: 1 },
          }}
        >
          {database.propertyOrder
            .filter((id) => database.properties[id]?.type === "select")
            .map((id) => (
              <MenuItem key={id} value={id} sx={{ fontSize: "13px" }}>
                {database.properties[id]?.name}
              </MenuItem>
            ))}
        </Select>
      </Box>

      {activeView?.config.groupBy && (
        <GroupConfigBody
          activeView={activeView}
          database={database}
          propertySensors={propertySensors}
          onUpdateViewConfig={onUpdateViewConfig}
          onUpdateProperty={onUpdateProperty}
        />
      )}

      {!activeView?.config.groupBy && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
            Select a property to group by.
          </Typography>
        </Box>
      )}
    </>
  );
}

interface GroupConfigBodyProps {
  activeView: DatabaseView;
  database: Database;
  propertySensors: unknown;
  onUpdateViewConfig?: (config: Partial<DatabaseView["config"]>) => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
}

function GroupConfigBody({
  activeView,
  database,
  propertySensors,
  onUpdateViewConfig,
  onUpdateProperty,
}: GroupConfigBodyProps) {
  const groupByProp = database.properties[activeView.config.groupBy!];
  const rawOptions = groupByProp?.options ?? [];
  const hiddenGroups = activeView.config.hiddenGroups ?? [];

  let options = rawOptions;
  if (activeView.config.groupSortOrder === "alphabetical") {
    options = [...rawOptions].sort((a, b) => a.name.localeCompare(b.name));
  } else if (
    activeView.config.groupOrder &&
    activeView.config.groupOrder.length > 0
  ) {
    const orderMap = new Map(
      activeView.config.groupOrder.map((id, i) => [id, i]),
    );
    options = [...rawOptions].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity;
      const bi = orderMap.get(b.id) ?? Infinity;
      return ai - bi;
    });
  }

  const optionIds = options.map((opt) => opt.id);
  const isAlphabetical = activeView.config.groupSortOrder === "alphabetical";

  const handleReorderGroups = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = optionIds.indexOf(
      SelectOptionBrandId.parse(active.id as string),
    );
    const newIndex = optionIds.indexOf(
      SelectOptionBrandId.parse(over.id as string),
    );
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(optionIds, oldIndex, newIndex);
    onUpdateViewConfig?.({
      groupOrder: reordered,
      groupSortOrder: "manual",
    });
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.25,
        }}
      >
        <Typography sx={{ fontSize: "13px" }}>Hide empty groups</Typography>
        <Switch
          size="small"
          checked={activeView.config.hideEmptyGroups ?? false}
          onChange={(_, checked) => {
            onUpdateViewConfig?.({ hideEmptyGroups: checked });
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <SortByAlphaIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "13px" }}>Sort alphabetically</Typography>
        </Box>
        <Switch
          size="small"
          checked={activeView.config.groupSortOrder === "alphabetical"}
          onChange={(_, checked) => {
            onUpdateViewConfig?.({
              groupSortOrder: checked ? "alphabetical" : "manual",
            });
          }}
        />
      </Box>

      <Divider sx={{ mx: 1.5, my: 0.5 }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          pb: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: FONT_WEIGHT_SEMIBOLD,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Visible groups
        </Typography>
      </Box>

      <DndContext
        sensors={propertySensors as never}
        collisionDetection={closestCenter}
        onDragEnd={handleReorderGroups}
      >
        <SortableContext
          items={optionIds}
          strategy={verticalListSortingStrategy}
        >
          <List dense disablePadding sx={{ py: 0 }}>
            {options.map((opt) => (
              <SortableGroupItem
                key={opt.id}
                option={opt}
                isHidden={hiddenGroups.includes(opt.id)}
                onToggleVisibility={() => {
                  const isHidden = hiddenGroups.includes(opt.id);
                  const newHidden = isHidden
                    ? hiddenGroups.filter((id) => id !== opt.id)
                    : [...hiddenGroups, opt.id];
                  onUpdateViewConfig?.({ hiddenGroups: newHidden });
                }}
                onRename={(optionId, newName) => {
                  if (!groupByProp) return;
                  const updatedOptions = options.map((o) =>
                    o.id === optionId
                      ? { ...o, name: DisplayName.parse(newName) }
                      : o,
                  );
                  onUpdateProperty?.({
                    ...groupByProp,
                    options: updatedOptions,
                  });
                }}
                disabled={isAlphabetical}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>

      {options.length === 0 && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
            No options defined for this property.
          </Typography>
        </Box>
      )}

      <Box sx={{ px: 1.5, py: 0.5 }}>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={() => {
            if (!groupByProp || !activeView.config.groupBy) return;
            const randomColor =
              RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]!;
            const newOption: SelectOption = {
              id: SelectOptionBrandId.parse(uuidv4()),
              name: DisplayName.parse("New group"),
              color: CssColor.parse(randomColor),
            };
            const updatedOptions = [...options, newOption];
            onUpdateProperty?.({
              ...groupByProp,
              options: updatedOptions,
            });
          }}
          sx={{
            fontSize: "12px",
            textTransform: "none",
            color: "text.secondary",
            px: 0.5,
            minHeight: 24,
          }}
        >
          New group
        </Button>
      </Box>
    </>
  );
}
