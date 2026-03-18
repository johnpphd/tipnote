import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { useDatabaseRows } from "@/hooks/useDatabaseRows";
import { useDatabaseRowPages } from "@/hooks/useDatabaseRowPages";
import { useDatabaseViews } from "@/hooks/useDatabaseViews";
import {
  createDatabaseRow,
  updateDatabaseRow,
  deleteDatabaseRow,
  updateDatabaseView,
  updateProperty,
  updateViewOrder,
  sortViewsByOrder,
} from "@/lib/database/databases";
import { updatePage } from "@/lib/database/pages";
import { applyFilters } from "@/lib/database/filterEngine";
import { applySorts } from "@/lib/database/sortEngine";
import DatabaseToolbar from "./DatabaseToolbar";
const TableView = lazy(() => import("./TableView/TableView"));
const BoardView = lazy(() => import("./BoardView/BoardView"));
const ListView = lazy(() => import("./ListView/ListView"));
const CalendarView = lazy(() => import("./CalendarView/CalendarView"));
const GalleryView = lazy(() => import("./GalleryView/GalleryView"));
import AddPropertyMenu from "./AddPropertyMenu";
import type {
  DatabaseRow,
  DatabaseView as DatabaseViewType,
  PropertyDefinition,
  PropertyValue,
  ViewFilter,
  ViewSort,
} from "@/types";
import {
  DatabaseBrandId,
  ViewBrandId,
  RowBrandId,
  UserBrandId,
  Title,
  type PropertyBrandId,
  type PageBrandId,
} from "@/types";

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
}

export default function DatabaseView({
  databaseId,
  urlViewId,
  onViewChange,
  isReadOnly,
  onRowClick: onRowClickProp,
}: DatabaseViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: database, isLoading: dbLoading } = useDatabase(databaseId);
  const { data: rows } = useDatabaseRows(databaseId);
  const { data: pageMap } = useDatabaseRowPages(
    databaseId,
    database?.workspaceId,
  );
  const { data: views } = useDatabaseViews(databaseId);

  const [addPropAnchor, setAddPropAnchor] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroupSettings, setOpenGroupSettings] = useState(false);

  // Find the title property ID from the database schema
  const titlePropId = useMemo(
    () =>
      database?.propertyOrder.find(
        (id) => database.properties[id]?.type === "title",
      ),
    [database],
  );

  const sortedViews = useMemo(
    () => sortViewsByOrder(views ?? [], database?.viewOrder),
    [views, database?.viewOrder],
  );

  // View ID priority: URL param > database default > first view
  const effectiveViewId =
    urlViewId ??
    database?.defaultViewId ??
    (sortedViews.length > 0 ? sortedViews[0].id : null);

  const activeView = sortedViews.find((v) => v.id === effectiveViewId);

  // Filters and sorts come directly from the active view config (persisted in Firestore)
  const filters = useMemo(
    () => activeView?.config.filters ?? [],
    [activeView?.config.filters],
  );
  const sorts = useMemo(
    () => activeView?.config.sorts ?? [],
    [activeView?.config.sorts],
  );

  const handleFiltersChange = useCallback(
    async (newFilters: ViewFilter[]) => {
      if (!effectiveViewId) return;
      await updateDatabaseView(effectiveViewId, {
        filters: newFilters,
      });
    },
    [effectiveViewId],
  );

  const handleSortsChange = useCallback(
    async (newSorts: ViewSort[]) => {
      if (!effectiveViewId) return;
      await updateDatabaseView(effectiveViewId, {
        sorts: newSorts,
      });
    },
    [effectiveViewId],
  );

  // Enrich rows with page titles (single source of truth) before filtering/sorting
  const enrichedRows = useMemo(() => {
    if (!rows || !titlePropId || !pageMap) return rows;
    return rows.map((row) => {
      const page = pageMap.get(row.pageId);
      if (!page) return row;
      return {
        ...row,
        properties: { ...row.properties, [titlePropId]: page.title },
      };
    });
  }, [rows, titlePropId, pageMap]);

  // Apply filters, sorts, and search client-side
  const processedRows = useMemo(() => {
    if (!enrichedRows || !database) return [];
    const filtered = applyFilters(enrichedRows, filters, database.properties);
    let result = applySorts(filtered, sorts, database.properties);
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row.properties).some(
          (val) => val != null && String(val).toLowerCase().includes(lower),
        ),
      );
    }
    return result;
  }, [enrichedRows, database, filters, sorts, searchQuery]);

  const handleAddRow = useCallback(
    async (defaultProperties?: Record<PropertyBrandId, PropertyValue>) => {
      if (!user || !database) return;
      await createDatabaseRow(
        database.workspaceId,
        UserBrandId.parse(user.uid),
        databaseId,
        defaultProperties,
        titlePropId,
      );
    },
    [databaseId, user, database, titlePropId],
  );

  const handleUpdateRow = useCallback(
    async (
      rowId: RowBrandId,
      properties: Record<PropertyBrandId, PropertyValue>,
    ) => {
      const nonTitleProps = { ...properties };
      // Title is stored only in pages.title (single source of truth)
      if (titlePropId && titlePropId in properties) {
        const row = enrichedRows?.find((r) => r.id === rowId);
        if (row) {
          await updatePage(row.pageId, {
            title: Title.parse(String(properties[titlePropId] ?? "")),
          });
        }
        delete nonTitleProps[titlePropId];
      }
      if (Object.keys(nonTitleProps).length > 0) {
        await updateDatabaseRow(rowId, nonTitleProps);
      }
    },
    [titlePropId, enrichedRows],
  );

  const handleDeleteRow = useCallback(
    async (rowId: RowBrandId, pageId: PageBrandId) => {
      await deleteDatabaseRow(rowId, pageId);
    },
    [],
  );

  const defaultRowClick = useCallback(
    (row: DatabaseRow) => {
      void navigate({ to: "/w/$pageId", params: { pageId: row.pageId } });
    },
    [navigate],
  );

  // null = explicitly disabled, undefined = use default
  const handleRowClick =
    onRowClickProp === null ? undefined : (onRowClickProp ?? defaultRowClick);

  const noop = useCallback(() => {}, []);

  const handleUpdateProperty = useCallback(
    async (property: PropertyDefinition) => {
      await updateProperty(databaseId, property);
    },
    [databaseId],
  );

  const handleUpdateGroupOrder = useCallback(
    async (order: string[]) => {
      if (!effectiveViewId) return;
      await updateDatabaseView(effectiveViewId, {
        groupOrder: order,
      });
    },
    [effectiveViewId],
  );

  const handleViewOrderChange = useCallback(
    async (newOrder: ViewBrandId[]) => {
      await updateViewOrder(databaseId, newOrder, newOrder[0]);
    },
    [databaseId],
  );

  const handleUpdateViewConfig = useCallback(
    async (config: Partial<DatabaseViewType["config"]>) => {
      if (!effectiveViewId) return;
      await updateDatabaseView(effectiveViewId, config);
    },
    [effectiveViewId],
  );

  const handleDeleteRows = useCallback(
    async (rowIds: RowBrandId[], pageIds: PageBrandId[]) => {
      await Promise.all(
        rowIds.map((rowId, i) => deleteDatabaseRow(rowId, pageIds[i]!)),
      );
    },
    [],
  );

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
