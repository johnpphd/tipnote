import { useState, useCallback } from "react";
import { Box, Typography, Divider } from "@mui/material";
import { useDatabase } from "@/hooks/useDatabase";
import { useDatabaseRowByPageId } from "@/hooks/useDatabaseRowByPageId";
import { updateDatabaseRow } from "@/lib/database/databases";
import CellDisplay from "@/components/database/properties/CellDisplay";
import CellEditor from "@/components/database/properties/CellEditor";
import type { PropertyValue, PropertyBrandId } from "@/types";
import type { PageBrandId, DatabaseBrandId } from "@/types";

interface RowPropertiesPanelProps {
  pageId: PageBrandId;
  parentDatabaseId: DatabaseBrandId;
  isReadOnly?: boolean;
}

export default function RowPropertiesPanel({
  pageId,
  parentDatabaseId,
  isReadOnly,
}: RowPropertiesPanelProps) {
  const { data: database } = useDatabase(parentDatabaseId);
  const { data: row } = useDatabaseRowByPageId(pageId, parentDatabaseId);
  const [editingPropertyId, setEditingPropertyId] =
    useState<PropertyBrandId | null>(null);
  const [expandedProperties, setExpandedProperties] = useState<
    Set<PropertyBrandId>
  >(new Set());

  const toggleExpanded = useCallback((propertyId: PropertyBrandId) => {
    setExpandedProperties((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else {
        next.add(propertyId);
      }
      return next;
    });
  }, []);

  const handlePropertyChange = useCallback(
    (propertyId: PropertyBrandId, value: PropertyValue) => {
      if (!row) return;
      void updateDatabaseRow(row.id, { [propertyId]: value });
    },
    [row],
  );

  if (!database || !row) return null;

  // Get ordered properties, skipping "title" type (already shown in PageHeader)
  const properties = database.propertyOrder
    .map((id) => database.properties[id])
    .filter((p) => p && p.type !== "title");

  if (properties.length === 0) return null;

  return (
    <Box sx={{ mb: 3, mt: 1 }}>
      {properties.map((property) => {
        const value = row.properties[property.id] ?? null;
        const isEditing = editingPropertyId === property.id;
        const isLongText =
          (property.type === "text" || property.type === "person") &&
          typeof value === "string" &&
          value.length > 100;
        const isExpanded = expandedProperties.has(property.id);

        return (
          <Box
            key={property.id}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              py: 0.75,
              minHeight: 32,
              "&:hover": { bgcolor: "action.hover", borderRadius: 0.5 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                width: 160,
                flexShrink: 0,
                color: "text.secondary",
                fontSize: "13px",
                pt: 0.25,
                pl: 0.5,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {property.name}
            </Typography>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                cursor: isReadOnly ? "default" : "pointer",
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
              }}
              onClick={
                isReadOnly ? undefined : () => setEditingPropertyId(property.id)
              }
              onBlur={() => {
                // Defer check so MUI Portal elements (Select dropdown, Popover)
                // have time to receive focus before we dismiss the editor
                requestAnimationFrame(() => {
                  const active = document.activeElement;
                  if (
                    active?.closest('[role="listbox"]') ||
                    active?.closest('[role="presentation"]') ||
                    active?.closest(".MuiPopover-root")
                  ) {
                    return;
                  }
                  setEditingPropertyId(null);
                });
              }}
            >
              {isEditing ? (
                <CellEditor
                  property={property}
                  value={value}
                  onChange={(newValue) => {
                    handlePropertyChange(property.id, newValue);
                    // Keep editing for multi-select, close for others
                    if (property.type !== "multiSelect") {
                      setEditingPropertyId(null);
                    }
                  }}
                />
              ) : (
                <>
                  <CellDisplay
                    property={property}
                    value={value}
                    maxLines={isLongText ? (isExpanded ? 0 : 4) : undefined}
                  />
                  {isLongText && (
                    <Typography
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(property.id);
                      }}
                      sx={{
                        display: "inline-block",
                        fontSize: "11px",
                        color: "text.secondary",
                        cursor: "pointer",
                        mt: 0.25,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        );
      })}
      <Divider sx={{ mt: 2, mb: 1, borderColor: "divider" }} />
    </Box>
  );
}
