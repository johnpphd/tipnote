import { useState, useMemo, useCallback } from "react";
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

interface UseDatabaseViewModelArgs {
  databaseId: DatabaseBrandId;
  urlViewId?: ViewBrandId;
  onRowClickProp?: ((row: DatabaseRow) => void) | null;
}

export function useDatabaseViewModel({
  databaseId,
  urlViewId,
  onRowClickProp,
}: UseDatabaseViewModelArgs) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: database, isLoading: dbLoading } = useDatabase(databaseId);
  const { data: rows } = useDatabaseRows(databaseId);
  const { data: pageMap } = useDatabaseRowPages(
    databaseId,
    database?.workspaceId,
  );
  const { data: views } = useDatabaseViews(databaseId);

  const [searchQuery, setSearchQuery] = useState("");

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

  const effectiveViewId =
    urlViewId ??
    database?.defaultViewId ??
    (sortedViews.length > 0 ? sortedViews[0].id : null);

  const activeView = sortedViews.find((v) => v.id === effectiveViewId);

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
      await updateDatabaseView(effectiveViewId, { filters: newFilters });
    },
    [effectiveViewId],
  );

  const handleSortsChange = useCallback(
    async (newSorts: ViewSort[]) => {
      if (!effectiveViewId) return;
      await updateDatabaseView(effectiveViewId, { sorts: newSorts });
    },
    [effectiveViewId],
  );

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
      rowId: RowBrandId | undefined,
      properties: Record<PropertyBrandId, PropertyValue>,
    ) => {
      if (!rowId) return;
      const nonTitleProps = { ...properties };
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
    async (rowId: RowBrandId | undefined, pageId: PageBrandId | undefined) => {
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
      await updateDatabaseView(effectiveViewId, { groupOrder: order });
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

  return {
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
  };
}
