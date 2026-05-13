import { useState, lazy, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import DatabaseToolbar from "./DatabaseToolbar";
const TableView = lazy(() => import("./TableView/TableView"));
const BoardView = lazy(() => import("./BoardView/BoardView"));
const ListView = lazy(() => import("./ListView/ListView"));
const CalendarView = lazy(() => import("./CalendarView/CalendarView"));
const GalleryView = lazy(() => import("./GalleryView/GalleryView"));
import AddPropertyMenu from "./AddPropertyMenu";
import { useDatabaseViewModel } from "./_hooks/useDatabaseViewModel";
import type { DatabaseRow } from "@/types";
import { DatabaseBrandId, ViewBrandId } from "@/types";

const visuallyHiddenSx = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

interface DatabaseViewProps {
  databaseId: DatabaseBrandId;
  urlViewId?: ViewBrandId;
  onViewChange?: (viewId: ViewBrandId) => void;
  isReadOnly?: boolean;
  /** Override row click navigation. Return false to disable default navigation. */
  onRowClick?: ((row: DatabaseRow) => void) | null;
  calMode?: string;
  calDate?: string;
  onCalStateChange?: (mode: string, date: string) => void;
}

export default function DatabaseView({
  databaseId,
  urlViewId,
  onViewChange,
  isReadOnly,
  onRowClick: onRowClickProp,
  calMode,
  calDate,
  onCalStateChange,
}: DatabaseViewProps) {
  const vm = useDatabaseViewModel({ databaseId, urlViewId, onRowClickProp });
  const [addPropAnchor, setAddPropAnchor] = useState<HTMLElement | null>(null);
  const [openGroupSettings, setOpenGroupSettings] = useState(false);

  const {
    database,
    dbLoading,
    sortedViews,
    activeView,
    effectiveViewId,
    filters,
    sorts,
    searchQuery,
    setSearchQuery,
    processedRows,
    handleFiltersChange,
    handleSortsChange,
    handleAddRow,
    handleUpdateRow,
    handleDeleteRow,
    handleRowClick,
    noop,
    handleUpdateProperty,
    handleUpdateGroupOrder,
    handleViewOrderChange,
    handleUpdateViewConfig,
    handleDeleteRows,
  } = vm;

  if (dbLoading || !database) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Toolbar */}
      {activeView && effectiveViewId && (
        <DatabaseToolbar
          database={database}
          views={sortedViews}
          activeViewId={effectiveViewId}
          onViewChange={onViewChange ?? (() => {})}
          onViewOrderChange={isReadOnly ? undefined : handleViewOrderChange}
          filters={filters}
          sorts={sorts}
          onFiltersChange={isReadOnly ? () => {} : handleFiltersChange}
          onSortsChange={isReadOnly ? () => {} : handleSortsChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddRow={isReadOnly ? undefined : handleAddRow}
          onUpdateProperty={isReadOnly ? undefined : handleUpdateProperty}
          onUpdateViewConfig={isReadOnly ? undefined : handleUpdateViewConfig}
          openGroupSettings={openGroupSettings}
          onGroupSettingsOpened={() => setOpenGroupSettings(false)}
          isReadOnly={isReadOnly}
        />
      )}

      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={visuallyHiddenSx}
      >
        {(filters.length > 0 || searchQuery.trim()) &&
          `${processedRows.length} result${processedRows.length !== 1 ? "s" : ""}`}
      </Box>

      {!isReadOnly && (
        <AddPropertyMenu
          anchorEl={addPropAnchor}
          onClose={() => setAddPropAnchor(null)}
          database={database}
        />
      )}

      {/* View content */}
      <Suspense
        fallback={
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        {activeView?.type === "table" && (
          <TableView
            database={database}
            rows={processedRows}
            view={activeView}
            onUpdateRow={handleUpdateRow}
            onAddRow={handleAddRow}
            onRowClick={isReadOnly ? undefined : handleRowClick}
            onAddProperty={
              isReadOnly ? undefined : (el) => setAddPropAnchor(el)
            }
            onUpdateProperty={isReadOnly ? undefined : handleUpdateProperty}
            onDeleteRows={isReadOnly ? undefined : handleDeleteRows}
            isReadOnly={isReadOnly}
          />
        )}

        {activeView?.type === "board" && (
          <BoardView
            database={database}
            rows={processedRows}
            view={activeView}
            onUpdateRow={handleUpdateRow}
            onAddRow={handleAddRow}
            onDeleteRow={isReadOnly ? undefined : handleDeleteRow}
            onRowClick={isReadOnly || !handleRowClick ? noop : handleRowClick}
            onUpdateGroupOrder={isReadOnly ? undefined : handleUpdateGroupOrder}
            onUpdateProperty={isReadOnly ? undefined : handleUpdateProperty}
            onUpdateView={isReadOnly ? undefined : handleUpdateViewConfig}
            onDeleteRows={isReadOnly ? undefined : handleDeleteRows}
            onOpenGroupSettings={() => setOpenGroupSettings(true)}
            isReadOnly={isReadOnly}
          />
        )}

        {activeView?.type === "list" && (
          <ListView
            database={database}
            rows={processedRows}
            view={activeView}
            onUpdateRow={handleUpdateRow}
            onAddRow={handleAddRow}
            onRowClick={handleRowClick ?? noop}
            isReadOnly={isReadOnly}
          />
        )}

        {activeView?.type === "calendar" && (
          <CalendarView
            database={database}
            rows={processedRows}
            view={activeView}
            onUpdateRow={handleUpdateRow}
            onAddRow={handleAddRow}
            onRowClick={isReadOnly || !handleRowClick ? noop : handleRowClick}
            initialMode={calMode}
            initialDate={calDate}
            onStateChange={onCalStateChange}
          />
        )}

        {activeView?.type === "gallery" && (
          <GalleryView
            database={database}
            rows={processedRows}
            view={activeView}
            onUpdateRow={handleUpdateRow}
            onAddRow={handleAddRow}
            onRowClick={isReadOnly || !handleRowClick ? noop : handleRowClick}
            isReadOnly={isReadOnly}
          />
        )}
      </Suspense>

      {!activeView && sortedViews.length === 0 && (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            No views configured for this database
          </Typography>
        </Box>
      )}
    </Box>
  );
}
