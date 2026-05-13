import { useMemo } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Box,
  IconButton,
  ListItemIcon,
  Button,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Tune as SettingsIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";
import type {
  Database,
  DatabaseView,
  PropertyDefinition,
  ViewType,
  ViewFilter,
  ViewSort,
} from "@/types";
import { ViewBrandId, PropertyBrandId } from "@/types";
import {
  updateDatabaseView,
  createDatabaseView,
  deleteDatabaseView,
  updateViewOrder,
} from "@/lib/database/databases";
import FilterPanel from "./FilterPanel";
import { useToolbarUIState } from "./_hooks/useToolbarUIState";
import { useToolbarSensors } from "./_hooks/useToolbarSensors";
import { capitalize, toolbarButtonSx } from "./_components/toolbarConstants";
import { SortableViewTab } from "./_components/toolbarItems";
import FilterChips from "./_components/FilterChips";
import AddViewPopover from "./_components/AddViewPopover";
import SortPopover from "./_components/SortPopover";
import ViewSettingsPopover from "./_components/ViewSettingsPopover";
import ToolbarSearch from "./_components/ToolbarSearch";

interface DatabaseToolbarProps {
  database: Database;
  views: DatabaseView[];
  activeViewId: ViewBrandId;
  onViewChange: (viewId: ViewBrandId) => void;
  onViewOrderChange?: (viewOrder: ViewBrandId[]) => void;
  filters: ViewFilter[];
  sorts: ViewSort[];
  onFiltersChange: (filters: ViewFilter[]) => void;
  onSortsChange: (sorts: ViewSort[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddRow?: () => void;
  onUpdateProperty?: (property: PropertyDefinition) => void;
  onUpdateViewConfig?: (config: Partial<DatabaseView["config"]>) => void;
  openGroupSettings?: boolean;
  onGroupSettingsOpened?: () => void;
  isReadOnly?: boolean;
}

export default function DatabaseToolbar({
  database,
  views,
  activeViewId,
  onViewChange,
  onViewOrderChange,
  filters,
  sorts,
  onFiltersChange,
  onSortsChange,
  searchQuery,
  onSearchChange,
  onAddRow,
  onUpdateProperty,
  onUpdateViewConfig,
  openGroupSettings,
  onGroupSettingsOpened,
  isReadOnly,
}: DatabaseToolbarProps) {
  const {
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
  } = useToolbarUIState({ openGroupSettings, onGroupSettingsOpened });

  const { propertySensors, viewTabSensors, viewIds } = useToolbarSensors(views);

  const activeView = views.find((v) => v.id === activeViewId);
  const visibleProps = useMemo(
    () => activeView?.config.visibleProperties ?? [],
    [activeView?.config.visibleProperties],
  );

  const handleToggleColumn = (propId: PropertyBrandId | undefined) => {
    if (!activeView || !propId) return;
    const newVisible = visibleProps.includes(propId)
      ? visibleProps.filter((id) => id !== propId)
      : [...visibleProps, propId];
    void updateDatabaseView(activeViewId, { visibleProperties: newVisible });
  };

  const handleReorderViews = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onViewOrderChange) return;
    const oldIndex = viewIds.indexOf(ViewBrandId.parse(active.id as string));
    const newIndex = viewIds.indexOf(ViewBrandId.parse(over.id as string));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(viewIds, oldIndex, newIndex);
    onViewOrderChange(reordered);
  };

  const handleReorderProperties = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeView) return;
    const oldIndex = visibleProps.indexOf(
      PropertyBrandId.parse(active.id as string),
    );
    const newIndex = visibleProps.indexOf(
      PropertyBrandId.parse(over.id as string),
    );
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(visibleProps, oldIndex, newIndex);
    void updateDatabaseView(activeViewId, { visibleProperties: reordered });
  };

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const handleAddSort = () => {
    const firstProp = database.propertyOrder[0];
    if (!firstProp) return;
    onSortsChange([...sorts, { propertyId: firstProp, direction: "asc" }]);
  };

  const handleRemoveSort = (index: number) => {
    onSortsChange(sorts.filter((_, i) => i !== index));
  };

  const handleToggleSortDirection = (index: number) => {
    onSortsChange(
      sorts.map((s, i) =>
        i === index
          ? {
              ...s,
              direction:
                s.direction === "asc" ? ("desc" as const) : ("asc" as const),
            }
          : s,
      ),
    );
  };

  const handleChangeSortProperty = (
    index: number,
    propId: PropertyBrandId | undefined,
  ) => {
    if (!propId) return;
    onSortsChange(
      sorts.map((s, i) => (i === index ? { ...s, propertyId: propId } : s)),
    );
  };

  const handleChangeLayout = (type: ViewType) => {
    if (!activeView) return;
    const updates: Parameters<typeof updateDatabaseView>[1] = { type };
    if (type === "board" && !activeView.config.groupBy) {
      const selectProp = database.propertyOrder.find(
        (id) => database.properties[id]?.type === "select",
      );
      if (selectProp) updates.groupBy = selectProp;
    }
    void updateDatabaseView(activeViewId, updates);
  };

  const handleChangeGroupBy = (propId: PropertyBrandId | undefined) => {
    void updateDatabaseView(activeViewId, { groupBy: propId });
  };

  const handleChangeColorBy = (propId: PropertyBrandId | null) => {
    void updateDatabaseView(activeViewId, { colorBy: propId });
  };

  const handleAddView = async (type: ViewType) => {
    const name = `${capitalize(type)} View`;
    const viewId = await createDatabaseView(
      database.workspaceId,
      database.id,
      name,
      type,
      database.propertyOrder,
    );
    const newOrder = [
      ...(database.viewOrder ?? views.map((v) => v.id)),
      viewId,
    ];
    await updateViewOrder(database.id, newOrder, newOrder[0]);
    onViewChange(viewId);
  };

  const handleRenameView = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === activeView?.name) {
      setEditingViewName(false);
      return;
    }
    void updateDatabaseView(activeViewId, { name: trimmed });
    setEditingViewName(false);
  };

  const handleContextMenu = (
    event: React.MouseEvent,
    viewId: ViewBrandId | undefined,
  ) => {
    if (!viewId) return;
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, viewId });
  };

  const handleDeleteView = async (viewId: ViewBrandId | undefined) => {
    if (!viewId) return;
    if (views.length <= 1) return;
    const fallbackId = await deleteDatabaseView(
      database.id,
      viewId,
      database.defaultViewId,
      views.map((v) => v.id),
      database.viewOrder,
    );
    if (viewId === activeViewId) {
      const nextId = fallbackId ?? views.find((v) => v.id !== viewId)?.id;
      if (nextId) onViewChange(nextId);
    }
    setContextMenu(null);
    setSettingsAnchor(null);
    setSettingsSection("main");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0,
        py: 0.5,
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      <DndContext
        sensors={viewTabSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleReorderViews}
      >
        <SortableContext
          items={viewIds}
          strategy={horizontalListSortingStrategy}
        >
          <Box
            role="tablist"
            sx={{
              display: "flex",
              alignItems: "center",
              minHeight: 32,
              gap: 0,
            }}
          >
            {views.map((view) => (
              <SortableViewTab
                key={view.id}
                view={view}
                isActive={view.id === activeViewId}
                onClick={() => onViewChange(view.id)}
                onContextMenu={(e) => handleContextMenu(e, view.id)}
                disabled={isReadOnly}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>

      {!isReadOnly && (
        <IconButton
          size="small"
          aria-label="Add view"
          onClick={(e) => setColumnsAnchor(e.currentTarget)}
          sx={{ p: 0.5 }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}

      <Box sx={{ flex: 1 }} />

      <FilterChips
        database={database}
        filters={filters}
        isReadOnly={isReadOnly}
        onChipClick={(el) => setFilterAnchor(el)}
        onRemove={handleRemoveFilter}
      />

      {sorts.length > 0 && (
        <Chip
          label={`${sorts.length} sort${sorts.length > 1 ? "s" : ""}`}
          size="small"
          onDelete={isReadOnly ? undefined : () => onSortsChange([])}
        />
      )}

      {!isReadOnly && (
        <>
          <Button
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 14 }} />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{
              ...toolbarButtonSx,
              "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.5 } },
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              Filter
            </Box>
          </Button>

          <Button
            size="small"
            startIcon={<SortIcon sx={{ fontSize: 14 }} />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
            sx={{
              ...toolbarButtonSx,
              "& .MuiButton-startIcon": { mr: { xs: 0, sm: 0.5 } },
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              Sort
            </Box>
          </Button>
        </>
      )}

      <ToolbarSearch
        showSearch={showSearch}
        searchQuery={searchQuery}
        searchInputRef={searchInputRef}
        onToggleSearch={() => {
          const wasOpen = showSearch;
          if (wasOpen) onSearchChange("");
          setShowSearch(!wasOpen);
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }}
        onSearchChange={onSearchChange}
        onCloseSearch={() => {
          onSearchChange("");
          setShowSearch(false);
        }}
      />

      {!isReadOnly && (
        <IconButton
          ref={settingsButtonRef}
          size="small"
          aria-label="View settings"
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
          sx={{ p: 0.5 }}
        >
          <SettingsIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}

      {onAddRow && (
        <Button
          variant="contained"
          size="small"
          onClick={() => onAddRow()}
          sx={{
            bgcolor: "primary.main",
            color: "common.white",
            fontSize: "13px",
            fontWeight: FONT_WEIGHT_MEDIUM,
            px: 1.5,
            py: 0.25,
            minHeight: 28,
            borderRadius: "4px",
            boxShadow: "none",
            "&:hover": { bgcolor: "primary.dark", boxShadow: "none" },
          }}
        >
          New
        </Button>
      )}

      <AddViewPopover
        anchorEl={columnsAnchor}
        onClose={() => setColumnsAnchor(null)}
        onAddView={(type) => void handleAddView(type)}
      />

      <ViewSettingsPopover
        anchorEl={settingsAnchor}
        onClose={() => {
          setSettingsAnchor(null);
          setSettingsSection("main");
          setEditingViewName(false);
        }}
        database={database}
        views={views}
        activeView={activeView}
        activeViewId={activeViewId}
        visibleProps={visibleProps}
        settingsSection={settingsSection}
        setSettingsSection={setSettingsSection}
        setSettingsAnchor={setSettingsAnchor}
        setFilterAnchor={setFilterAnchor}
        setSortAnchor={setSortAnchor}
        editingViewName={editingViewName}
        setEditingViewName={setEditingViewName}
        viewNameDraft={viewNameDraft}
        setViewNameDraft={setViewNameDraft}
        propertySensors={propertySensors}
        onRenameView={handleRenameView}
        onChangeLayout={handleChangeLayout}
        onReorderProperties={handleReorderProperties}
        onToggleColumn={handleToggleColumn}
        onChangeGroupBy={handleChangeGroupBy}
        onChangeColorBy={handleChangeColorBy}
        onUpdateViewConfig={onUpdateViewConfig}
        onUpdateProperty={onUpdateProperty}
        onDeleteView={(id) => void handleDeleteView(id)}
      />

      <FilterPanel
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        database={database}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <SortPopover
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        database={database}
        sorts={sorts}
        onChangeSortProperty={handleChangeSortProperty}
        onToggleSortDirection={handleToggleSortDirection}
        onRemoveSort={handleRemoveSort}
        onAddSort={handleAddSort}
      />

      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          disabled={views.length <= 1}
          onClick={() => {
            if (contextMenu) void handleDeleteView(contextMenu.viewId);
          }}
          sx={{ fontSize: "13px", color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteIcon sx={{ fontSize: 16, color: "error.main" }} />
          </ListItemIcon>
          Delete view
        </MenuItem>
      </Menu>
    </Box>
  );
}
