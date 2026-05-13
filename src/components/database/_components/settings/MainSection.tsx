import {
  Box,
  Typography,
  IconButton,
  TextField,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Apps as GroupIcon,
  TableChart as TableIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { Database, DatabaseView, ViewBrandId } from "@/types";
import type { PropertyBrandId } from "@/types";
import { VIEW_TYPE_ICONS, capitalize } from "../toolbarConstants";
import type { SettingsSection } from "../../_hooks/useToolbarUIState";

interface MainSectionProps {
  activeView: DatabaseView | undefined;
  activeViewId: ViewBrandId;
  visibleProps: PropertyBrandId[];
  views: DatabaseView[];
  database: Database;
  setSettingsSection: (s: SettingsSection) => void;
  setSettingsAnchor: (el: HTMLElement | null) => void;
  setFilterAnchor: (el: HTMLElement | null) => void;
  setSortAnchor: (el: HTMLElement | null) => void;
  editingViewName: boolean;
  setEditingViewName: (v: boolean) => void;
  viewNameDraft: string;
  setViewNameDraft: (v: string) => void;
  onRenameView: (name: string) => void;
  onDeleteView: (viewId: ViewBrandId) => void;
}

export default function MainSection({
  activeView,
  activeViewId,
  visibleProps,
  views,
  database,
  setSettingsSection,
  setSettingsAnchor,
  setFilterAnchor,
  setSortAnchor,
  editingViewName,
  setEditingViewName,
  viewNameDraft,
  setViewNameDraft,
  onRenameView,
  onDeleteView,
}: MainSectionProps) {
  return (
    <>
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
        <Typography sx={{ fontSize: "13px", fontWeight: FONT_WEIGHT_SEMIBOLD }}>
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
            onBlur={() => onRenameView(viewNameDraft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameView(viewNameDraft);
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

      <List dense disablePadding sx={{ py: 0.5 }}>
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
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemButton>

        <ListItemButton
          onClick={() => setSettingsSection("properties")}
          sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <VisibilityIcon sx={{ fontSize: 16, color: "text.secondary" }} />
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
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemButton>

        <ListItemButton
          onClick={(e) => {
            setSettingsAnchor(null);
            setSettingsSection("main");
            setFilterAnchor(e.currentTarget);
          }}
          sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <FilterIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </ListItemIcon>
          <ListItemText
            primary="Filter"
            primaryTypographyProps={{ sx: { fontSize: "13px" } }}
          />
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemButton>

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
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemButton>

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
          <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </ListItemButton>

        {(activeView?.type === "table" || activeView?.type === "calendar") && (
          <ListItemButton
            onClick={() => setSettingsSection("color")}
            sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <PaletteIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Color"
              primaryTypographyProps={{ sx: { fontSize: "13px" } }}
            />
            <Typography
              sx={{ fontSize: "13px", color: "text.secondary", mr: 0.5 }}
            >
              {activeView?.config.colorBy
                ? (database.properties[activeView.config.colorBy]?.name ??
                  "None")
                : "None"}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </ListItemButton>
        )}
      </List>

      {views.length > 1 && (
        <>
          <Divider sx={{ mx: 1 }} />
          <List dense disablePadding sx={{ py: 0.5 }}>
            <ListItemButton
              onClick={() => onDeleteView(activeViewId)}
              sx={{ px: 1.5, py: 0.5, borderRadius: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DeleteIcon sx={{ fontSize: 16, color: "error.main" }} />
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
  );
}
