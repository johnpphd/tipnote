import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Divider,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Menu,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  TableChart as TableIcon,
  ViewKanban as BoardIcon,
  ViewList as ListIcon,
  CalendarMonth as CalendarIcon,
  GridView as GalleryIcon,
  Search as SearchIcon,
  Tune as SettingsIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  Apps as GroupIcon,
  Tag as SelectIcon,
  TextFields as TextIcon,
  ArrowDropDownCircle as DropdownIcon,
  Checklist as MultiSelectIcon,
  CalendarToday as DateIcon,
  CheckBox as CheckboxIcon,
  Link as UrlIcon,
  Person as PersonIcon,
  Title as TitleIcon,
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  VisibilityOff as VisibilityOffIcon,
  SortByAlpha as SortByAlphaIcon,
} from "@mui/icons-material";
import { NOTION_COLORS } from "@/theme/notionColors";
import { FONT_WEIGHT_MEDIUM, FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type {
  Database,
  DatabaseView,
  PropertyDefinition,
  SelectOption,
  ViewType,
  ViewFilter,
  ViewSort,
  PropertyType,
} from "@/types";
import {
  ViewBrandId,
  PropertyBrandId,
  SelectOptionBrandId,
  DisplayName,
  CssColor,
} from "@/types";
import {
  updateDatabaseView,
  createDatabaseView,
  deleteDatabaseView,
  updateViewOrder,
} from "@/lib/database/databases";
import { FILTER_OPERATORS } from "@/lib/database/filterEngine";
import { v4 as uuidv4 } from "uuid";
import FilterPanel from "./FilterPanel";

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ReactElement> = {
  title: <TitleIcon sx={{ fontSize: 14 }} />,
  text: <TextIcon sx={{ fontSize: 14 }} />,
  number: <SelectIcon sx={{ fontSize: 14 }} />,
  select: <DropdownIcon sx={{ fontSize: 14 }} />,
  multiSelect: <MultiSelectIcon sx={{ fontSize: 14 }} />,
  date: <DateIcon sx={{ fontSize: 14 }} />,
  checkbox: <CheckboxIcon sx={{ fontSize: 14 }} />,
  url: <UrlIcon sx={{ fontSize: 14 }} />,
  person: <PersonIcon sx={{ fontSize: 14 }} />,
};

/** Get the human-readable operator label for a filter */
function getOperatorLabel(propType: PropertyType, operator: string): string {
  const ops = FILTER_OPERATORS[propType] ?? FILTER_OPERATORS.text;
  const match = ops.find((op) => op.value === operator);
  return match?.label ?? operator.replace(/_/g, " ");
}

const VIEW_TYPES: ViewType[] = [
  "table",
  "board",
  "list",
  "calendar",
  "gallery",
];

const VIEW_TYPE_ICONS: Record<ViewType, React.ReactElement> = {
  table: <TableIcon sx={{ fontSize: 16 }} />,
  board: <BoardIcon sx={{ fontSize: 16 }} />,
  list: <ListIcon sx={{ fontSize: 16 }} />,
  calendar: <CalendarIcon sx={{ fontSize: 16 }} />,
  gallery: <GalleryIcon sx={{ fontSize: 16 }} />,
};

function resolveColor(color: string): string {
  return NOTION_COLORS[color] ?? color;
}

const RANDOM_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "red",
  "yellow",
  "brown",
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const toolbarButtonSx = {
  fontSize: "13px",
  color: "text.secondary",
  textTransform: "none",
  minWidth: "auto",
  px: 1,
  py: 0.25,
  minHeight: 28,
} as const;

function SubPanelHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1.5,
        pt: 1.5,
        pb: 0.5,
      }}
    >
      <IconButton size="small" onClick={onBack} sx={{ p: 0.25, mr: 0.5 }}>
        <ChevronRightIcon
          sx={{
            fontSize: 16,
            color: "text.secondary",
            transform: "rotate(180deg)",
          }}
        />
      </IconButton>
      <Typography sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}>
        {title}
      </Typography>
    </Box>
  );
}

function SortablePropertyItem({
  propId,
  name,
  checked,
  onToggle,
}: {
  propId: string;
  name: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: propId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1,
        py: 0.5,
        cursor: "grab",
        "&:hover": { bgcolor: "action.hover" },
      }}
      {...attributes}
      {...listeners}
    >
      <DragIcon
        sx={{ fontSize: 16, color: "text.disabled", mr: 0.5, flexShrink: 0 }}
      />
      <Checkbox
        size="small"
        checked={checked}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        sx={{ p: 0, mr: 1 }}
      />
      <Typography sx={{ fontSize: "13px" }}>{name}</Typography>
    </Box>
  );
}

function SortableGroupItem({
  option,
  isHidden,
  onToggleVisibility,
  onRename,
  disabled,
}: {
  option: SelectOption;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onRename?: (optionId: string, newName: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === option.name) {
      setIsEditing(false);
      return;
    }
    onRename?.(option.id, trimmed);
    setIsEditing(false);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1,
        py: 0.25,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {!disabled && (
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: isDragging ? "grabbing" : "grab",
            mr: 0.5,
            flexShrink: 0,
          }}
        >
          <DragIcon sx={{ fontSize: 16, color: "text.disabled" }} />
        </Box>
      )}
      {isEditing ? (
        <TextField
          autoFocus
          size="small"
          variant="standard"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveName();
            if (e.key === "Escape") setIsEditing(false);
          }}
          sx={{
            maxWidth: 140,
            "& .MuiInputBase-input": {
              fontSize: "12px",
              fontWeight: FONT_WEIGHT_MEDIUM,
              py: 0,
            },
            "& .MuiInput-underline:before": {
              borderBottomColor: "divider",
            },
          }}
        />
      ) : (
        <Chip
          label={option.name}
          size="small"
          onDoubleClick={
            onRename
              ? () => {
                  setNameDraft(option.name);
                  setIsEditing(true);
                }
              : undefined
          }
          sx={{
            bgcolor: resolveColor(option.color),
            color: "white",
            fontWeight: FONT_WEIGHT_MEDIUM,
            fontSize: "12px",
            height: 22,
            opacity: isHidden ? 0.5 : 1,
          }}
        />
      )}
      <Box sx={{ flex: 1 }} />
      <IconButton
        size="small"
        sx={{ p: 0.25 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isHidden ? (
          <VisibilityOffIcon sx={{ fontSize: 16, color: "text.disabled" }} />
        ) : (
          <VisibilityIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        )}
      </IconButton>
    </Box>
  );
}

function SortableViewTab({
  view,
  isActive,
  onClick,
  onContextMenu,
  disabled,
}: {
  view: DatabaseView;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: view.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        minHeight: 28,
        py: 0.25,
        px: 1.5,
        fontSize: "13px",
        textTransform: "none",
        color: isActive ? "text.primary" : "text.secondary",
        bgcolor: isActive ? "action.selected" : "transparent",
        borderRadius: "4px",
        cursor: disabled ? "default" : "grab",
        userSelect: "none",
        whiteSpace: "nowrap",
        "&:hover": {
          bgcolor: isActive ? "action.selected" : "action.hover",
        },
      }}
    >
      {VIEW_TYPE_ICONS[view.type]}
      {view.name}
    </Box>
  );
}

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
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [settingsSection, setSettingsSection] = useState<
    "main" | "layout" | "properties" | "group"
  >("main");
  const [showSearch, setShowSearch] = useState(false);
  const [editingViewName, setEditingViewName] = useState(false);
  const [viewNameDraft, setViewNameDraft] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    viewId: ViewBrandId;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Handle external request to open group settings (from column menu "Edit groups")
  useEffect(() => {
    if (openGroupSettings && settingsButtonRef.current) {
      setSettingsAnchor(settingsButtonRef.current);
      setSettingsSection("group");
      onGroupSettingsOpened?.();
    }
  }, [openGroupSettings, onGroupSettingsOpened]);

  const activeView = views.find((v) => v.id === activeViewId);
  const visibleProps = useMemo(
    () => activeView?.config.visibleProperties ?? [],
    [activeView?.config.visibleProperties],
  );

  const handleToggleColumn = async (propId: PropertyBrandId) => {
    if (!activeView) return;
    const newVisible = visibleProps.includes(propId)
      ? visibleProps.filter((id) => id !== propId)
      : [...visibleProps, propId];
    await updateDatabaseView(activeViewId, {
      visibleProperties: newVisible,
    });
  };

  const propertySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const viewTabSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const viewIds = useMemo(() => views.map((v) => v.id), [views]);

  const handleReorderViews = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onViewOrderChange) return;
    const oldIndex = viewIds.indexOf(ViewBrandId.parse(active.id as string));
    const newIndex = viewIds.indexOf(ViewBrandId.parse(over.id as string));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(viewIds, oldIndex, newIndex);
    onViewOrderChange(reordered);
  };

  const handleReorderProperties = async (event: DragEndEvent) => {
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
    await updateDatabaseView(activeViewId, {
      visibleProperties: reordered,
    });
  };

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const handleAddSort = () => {
    const firstProp = database.propertyOrder[0];
    if (!firstProp) return;
    const newSort: ViewSort = {
      propertyId: firstProp,
      direction: "asc",
    };
    onSortsChange([...sorts, newSort]);
  };

  const handleRemoveSort = (index: number) => {
    onSortsChange(sorts.filter((_, i) => i !== index));
  };

  const handleToggleSortDirection = (index: number) => {
    const newSorts = sorts.map((s, i) =>
      i === index
        ? {
            ...s,
            direction:
              s.direction === "asc" ? ("desc" as const) : ("asc" as const),
          }
        : s,
    );
    onSortsChange(newSorts);
  };

  const handleChangeSortProperty = (index: number, propId: PropertyBrandId) => {
    const newSorts = sorts.map((s, i) =>
      i === index ? { ...s, propertyId: propId } : s,
    );
    onSortsChange(newSorts);
  };

  const handleChangeLayout = async (type: ViewType) => {
    if (!activeView) return;
    const updates: Parameters<typeof updateDatabaseView>[1] = { type };
    // When switching to board, auto-set groupBy to first select property if not set
    if (type === "board" && !activeView.config.groupBy) {
      const selectProp = database.propertyOrder.find(
        (id) => database.properties[id]?.type === "select",
      );
      if (selectProp) updates.groupBy = selectProp;
    }
    await updateDatabaseView(activeViewId, updates);
  };

  const handleChangeGroupBy = async (propId: PropertyBrandId) => {
    await updateDatabaseView(activeViewId, { groupBy: propId });
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
    // Append to viewOrder
    const newOrder = [
      ...(database.viewOrder ?? views.map((v) => v.id)),
      viewId,
    ];
    await updateViewOrder(database.id, newOrder, newOrder[0]);
    onViewChange(viewId);
  };

  const handleRenameView = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === activeView?.name) {
      setEditingViewName(false);
      return;
    }
    await updateDatabaseView(activeViewId, { name: trimmed });
    setEditingViewName(false);
  };

  const handleContextMenu = (event: React.MouseEvent, viewId: ViewBrandId) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, viewId });
  };

  const handleDeleteView = async (viewId: ViewBrandId) => {
    if (views.length <= 1) return;
    const fallbackId = await deleteDatabaseView(
      database.id,
      viewId,
      database.defaultViewId,
      views.map((v) => v.id),
      database.viewOrder,
    );
    // If we deleted the active view, navigate to the fallback
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
      {/* View tabs */}
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

      {/* Add view button */}
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

      {/* Individual filter chips (display-only in read-only mode) */}
      {filters.map((filter, i) => {
        const propDef = database.properties[filter.propertyId];
        const propName = propDef?.name ?? "Unknown";
        const propType: PropertyType = propDef?.type ?? "text";
        const operatorLabel = getOperatorLabel(propType, filter.operator);
        const resolveDisplayValue = (val: string): string => {
          if (
            (propType === "select" || propType === "multiSelect") &&
            propDef?.options
          ) {
            const opt = propDef.options.find((o) => o.id === val);
            if (opt) return opt.name;
          }
          return val;
        };
        const valueStr =
          filter.value == null || filter.value === ""
            ? ""
            : Array.isArray(filter.value)
              ? (filter.value as string[])
                  .map(resolveDisplayValue)
                  .join(", ")
              : resolveDisplayValue(String(filter.value));
        const chipLabel = valueStr
          ? `${propName} ${operatorLabel} ${valueStr}`
          : `${propName} ${operatorLabel}`;
        return (
          <Chip
            key={i}
            icon={PROPERTY_TYPE_ICONS[propType]}
            label={chipLabel}
            size="small"
            onClick={
              isReadOnly ? undefined : (e) => setFilterAnchor(e.currentTarget)
            }
            onDelete={isReadOnly ? undefined : () => handleRemoveFilter(i)}
            sx={{
              maxWidth: { xs: 150, sm: 220 },
              fontSize: "12px",
              bgcolor: "rgba(35, 131, 226, 0.14)",
              color: "rgb(35, 131, 226)",
              borderRadius: "3px",
              height: 24,
              "& .MuiChip-icon": {
                color: "rgb(35, 131, 226)",
                ml: 0.5,
              },
              "& .MuiChip-deleteIcon": {
                color: "rgba(35, 131, 226, 0.5)",
                fontSize: 16,
                "&:hover": {
                  color: "rgb(35, 131, 226)",
                },
              },
            }}
          />
        );
      })}

      {/* Sort indicator */}
      {sorts.length > 0 && (
        <Chip
          label={`${sorts.length} sort${sorts.length > 1 ? "s" : ""}`}
          size="small"
          onDelete={isReadOnly ? undefined : () => onSortsChange([])}
        />
      )}

      {!isReadOnly && (
        <>
          {/* Filter button */}
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

          {/* Sort button */}
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

      {/* Search */}
      <IconButton
        size="small"
        aria-label="Search"
        onClick={() => {
          setShowSearch((prev) => {
            if (prev) {
              onSearchChange("");
            }
            return !prev;
          });
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }}
        sx={{ p: 0.5 }}
      >
        <SearchIcon sx={{ fontSize: 16 }} />
      </IconButton>
      {showSearch && (
        <TextField
          inputRef={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          size="small"
          variant="outlined"
          sx={{
            width: { xs: 120, sm: 180 },
            "& .MuiOutlinedInput-root": {
              height: 28,
              fontSize: "13px",
            },
            "& .MuiOutlinedInput-input": {
              py: 0.25,
              px: 1,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Close search"
                  onClick={() => {
                    onSearchChange("");
                    setShowSearch(false);
                  }}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}

      {/* Settings */}
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

      {/* New button */}
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
            "&:hover": {
              bgcolor: "primary.dark",
              boxShadow: "none",
            },
          }}
        >
          New
        </Button>
      )}

      {/* Add View Popover */}
      <Popover
        open={Boolean(columnsAnchor)}
        anchorEl={columnsAnchor}
        onClose={() => setColumnsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 1.5, minWidth: 200 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
          >
            Add View
          </Typography>
          {VIEW_TYPES.map((type) => (
            <ListItemButton
              key={type}
              onClick={() => {
                void handleAddView(type);
                setColumnsAnchor(null);
              }}
              dense
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {VIEW_TYPE_ICONS[type]}
              </ListItemIcon>
              <ListItemText
                primary={capitalize(type)}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItemButton>
          ))}
        </Box>
      </Popover>

      {/* View Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => {
          setSettingsAnchor(null);
          setSettingsSection("main");
          setEditingViewName(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 280 }}>
          {settingsSection === "main" && (
            <>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  pt: 1.5,
                  pb: 0.5,
                }}
              >
                <Typography
                  sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}
                >
                  View settings
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSettingsAnchor(null);
                    setSettingsSection("main");
                  }}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </IconButton>
              </Box>

              {/* View name (click to rename) */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                }}
              >
                {activeView && VIEW_TYPE_ICONS[activeView.type]}
                {editingViewName ? (
                  <TextField
                    autoFocus
                    size="small"
                    value={viewNameDraft}
                    onChange={(e) => setViewNameDraft(e.target.value)}
                    onBlur={() => void handleRenameView(viewNameDraft)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        void handleRenameView(viewNameDraft);
                      if (e.key === "Escape") setEditingViewName(false);
                    }}
                    variant="standard"
                    sx={{ flex: 1 }}
                    inputProps={{ sx: { fontSize: "13px", py: 0 } }}
                  />
                ) : (
                  <Typography
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setViewNameDraft(activeView?.name ?? "");
                      setEditingViewName(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setViewNameDraft(activeView?.name ?? "");
                        setEditingViewName(true);
                      }
                    }}
                    sx={{
                      fontSize: "13px",
                      cursor: "pointer",
                      borderRadius: "3px",
                      px: 0.5,
                      mx: -0.5,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    {activeView?.name ?? "Default view"}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mx: 1 }} />

              {/* Menu items */}
              <List dense disablePadding sx={{ py: 0.5 }}>
                {/* Layout */}
                <ListItemButton
                  onClick={() => setSettingsSection("layout")}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <TableIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Layout"
                    primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                  />
                  <Typography
                    sx={{ fontSize: "13px", color: "text.secondary", mr: 0.5 }}
                  >
                    {activeView?.type ? capitalize(activeView.type) : "Table"}
                  </Typography>
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemButton>

                {/* Property visibility */}
                <ListItemButton
                  onClick={() => setSettingsSection("properties")}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <VisibilityIcon
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Property visibility"
                    primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                  />
                  <Typography
                    sx={{ fontSize: "13px", color: "text.secondary", mr: 0.5 }}
                  >
                    {visibleProps.length}
                  </Typography>
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemButton>

                {/* Filter */}
                <ListItemButton
                  onClick={(e) => {
                    setSettingsAnchor(null);
                    setSettingsSection("main");
                    setFilterAnchor(e.currentTarget);
                  }}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <FilterIcon
                      sx={{ fontSize: 16, color: "text.secondary" }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Filter"
                    primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                  />
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemButton>

                {/* Sort */}
                <ListItemButton
                  onClick={(e) => {
                    setSettingsAnchor(null);
                    setSettingsSection("main");
                    setSortAnchor(e.currentTarget);
                  }}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <SortIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sort"
                    primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                  />
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemButton>

                {/* Group */}
                <ListItemButton
                  onClick={() => setSettingsSection("group")}
                  sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <GroupIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Group"
                    primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                  />
                  <ChevronRightIcon
                    sx={{ fontSize: 16, color: "text.secondary" }}
                  />
                </ListItemButton>
              </List>

              {/* Delete view */}
              {views.length > 1 && (
                <>
                  <Divider sx={{ mx: 1 }} />
                  <List dense disablePadding sx={{ py: 0.5 }}>
                    <ListItemButton
                      onClick={() => void handleDeleteView(activeViewId)}
                      sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
                    >
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <DeleteIcon
                          sx={{ fontSize: 16, color: "error.main" }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="Delete view"
                        primaryTypographyProps={{
                          sx: { fontSize: "13px", color: "error.main" },
                        }}
                      />
                    </ListItemButton>
                  </List>
                </>
              )}
            </>
          )}

          {settingsSection === "layout" && (
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
                      void handleChangeLayout(type);
                      setSettingsSection("main");
                    }}
                    selected={activeView?.type === type}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 0,
                      "&.Mui-selected": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {VIEW_TYPE_ICONS[type]}
                    </ListItemIcon>
                    <ListItemText
                      primary={capitalize(type)}
                      primaryTypographyProps={{ sx: { fontSize: "13px" } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}

          {settingsSection === "properties" && (
            <>
              <SubPanelHeader
                title="Property visibility"
                onBack={() => setSettingsSection("main")}
              />

              {/* Visible properties — sortable */}
              <DndContext
                sensors={propertySensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => void handleReorderProperties(e)}
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
                          onToggle={() => void handleToggleColumn(propId)}
                        />
                      );
                    })}
                  </Box>
                </SortableContext>
              </DndContext>

              {/* Hidden properties — not sortable */}
              {database.propertyOrder.filter(
                (id) => !visibleProps.includes(id) && database.properties[id],
              ).length > 0 && (
                <>
                  <Divider sx={{ mx: 1.5 }} />
                  <List dense disablePadding sx={{ py: 0.5 }}>
                    {database.propertyOrder
                      .filter(
                        (id) =>
                          !visibleProps.includes(id) && database.properties[id],
                      )
                      .map((propId) => {
                        const prop = database.properties[propId];
                        if (!prop) return null;
                        return (
                          <ListItemButton
                            key={propId}
                            onClick={() => void handleToggleColumn(propId)}
                            dense
                            sx={{ px: 1.5, py: 0.25, borderRadius: 0 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Checkbox
                                size="small"
                                checked={false}
                                sx={{ p: 0 }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={prop.name}
                              primaryTypographyProps={{
                                sx: {
                                  fontSize: "13px",
                                  color: "text.secondary",
                                },
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                  </List>
                </>
              )}
            </>
          )}

          {settingsSection === "group" && (
            <>
              <SubPanelHeader
                title="Group"
                onBack={() => setSettingsSection("main")}
              />

              {/* Group by property selector */}
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
                    void handleChangeGroupBy(
                      PropertyBrandId.parse(e.target.value as string),
                    );
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

              {/* Hide empty groups toggle */}
              {activeView?.config.groupBy && (
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
                    <Typography sx={{ fontSize: "13px" }}>
                      Hide empty groups
                    </Typography>
                    <Switch
                      size="small"
                      checked={activeView.config.hideEmptyGroups ?? false}
                      onChange={(_, checked) => {
                        onUpdateViewConfig?.({ hideEmptyGroups: checked });
                      }}
                    />
                  </Box>

                  {/* Sort order toggle */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 0.25,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <SortByAlphaIcon
                        sx={{ fontSize: 14, color: "text.secondary" }}
                      />
                      <Typography sx={{ fontSize: "13px" }}>
                        Sort alphabetically
                      </Typography>
                    </Box>
                    <Switch
                      size="small"
                      checked={
                        activeView.config.groupSortOrder === "alphabetical"
                      }
                      onChange={(_, checked) => {
                        onUpdateViewConfig?.({
                          groupSortOrder: checked ? "alphabetical" : "manual",
                        });
                      }}
                    />
                  </Box>

                  <Divider sx={{ mx: 1.5, my: 0.5 }} />

                  {/* Groups list */}
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
                  {(() => {
                    const groupByProp =
                      database.properties[activeView.config.groupBy!];
                    const rawOptions = groupByProp?.options ?? [];
                    const hiddenGroups = activeView.config.hiddenGroups ?? [];

                    // Sort options to match board column order
                    let options = rawOptions;
                    if (activeView.config.groupSortOrder === "alphabetical") {
                      options = [...rawOptions].sort((a, b) =>
                        a.name.localeCompare(b.name),
                      );
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
                    const isAlphabetical =
                      activeView.config.groupSortOrder === "alphabetical";

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
                      const reordered = arrayMove(
                        optionIds,
                        oldIndex,
                        newIndex,
                      );
                      onUpdateViewConfig?.({
                        groupOrder: reordered,
                        groupSortOrder: "manual",
                      });
                    };

                    return (
                      <>
                        <DndContext
                          sensors={propertySensors}
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
                                    const isHidden = hiddenGroups.includes(
                                      opt.id,
                                    );
                                    const newHidden = isHidden
                                      ? hiddenGroups.filter(
                                          (id) => id !== opt.id,
                                        )
                                      : [...hiddenGroups, opt.id];
                                    onUpdateViewConfig?.({
                                      hiddenGroups: newHidden,
                                    });
                                  }}
                                  onRename={(optionId, newName) => {
                                    if (!groupByProp) return;
                                    const updatedOptions = options.map((o) =>
                                      o.id === optionId
                                        ? {
                                            ...o,
                                            name: DisplayName.parse(newName),
                                          }
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
                            <Typography
                              sx={{
                                fontSize: "12px",
                                color: "text.secondary",
                              }}
                            >
                              No options defined for this property.
                            </Typography>
                          </Box>
                        )}

                        {/* + New group button */}
                        <Box sx={{ px: 1.5, py: 0.5 }}>
                          <Button
                            size="small"
                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                            onClick={() => {
                              if (!groupByProp || !activeView.config.groupBy)
                                return;
                              const randomColor =
                                RANDOM_COLORS[
                                  Math.floor(
                                    Math.random() * RANDOM_COLORS.length,
                                  )
                                ]!;
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
                  })()}
                </>
              )}

              {!activeView?.config.groupBy && (
                <Box sx={{ px: 1.5, py: 1 }}>
                  <Typography
                    sx={{ fontSize: "12px", color: "text.secondary" }}
                  >
                    Select a property to group by.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>

      {/* Filter Panel */}
      <FilterPanel
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        database={database}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      {/* Sort Popover */}
      <Popover
        open={Boolean(sortAnchor)}
        anchorEl={sortAnchor}
        onClose={() => setSortAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 1.5, minWidth: 250 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: FONT_WEIGHT_SEMIBOLD, mb: 1 }}
          >
            Sorts
          </Typography>
          {sorts.map((sort, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <Select
                value={sort.propertyId}
                onChange={(e) =>
                  handleChangeSortProperty(
                    i,
                    PropertyBrandId.parse(e.target.value as string),
                  )
                }
                size="small"
                sx={{
                  fontSize: "13px",
                  height: 28,
                  minWidth: 100,
                  "& .MuiSelect-select": { py: 0.25, px: 1 },
                }}
              >
                {database.propertyOrder.map((propId) => {
                  const prop = database.properties[propId];
                  if (!prop) return null;
                  return (
                    <MenuItem
                      key={propId}
                      value={propId}
                      sx={{ fontSize: "13px" }}
                    >
                      {prop.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <Chip
                label={sort.direction === "asc" ? "Ascending" : "Descending"}
                size="small"
                variant="outlined"
                onClick={() => handleToggleSortDirection(i)}
                sx={{ cursor: "pointer" }}
              />
              <IconButton
                size="small"
                aria-label="Remove sort"
                onClick={() => handleRemoveSort(i)}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddSort}>
            Add sort
          </Button>
        </Box>
      </Popover>

      {/* Right-click context menu on view tabs */}
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
