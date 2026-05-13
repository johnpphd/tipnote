import { Box, Typography, Select, MenuItem } from "@mui/material";
import { resolveColor } from "@/theme/notionColors";
import { FONT_WEIGHT_SEMIBOLD } from "@/theme/fontWeights";
import type { Database, DatabaseView } from "@/types";
import { PropertyBrandId } from "@/types";
import { PROPERTY_TYPE_ICONS } from "../toolbarConstants";
import { SubPanelHeader } from "../toolbarItems";
import type { SettingsSection } from "../../_hooks/useToolbarUIState";

interface ColorSectionProps {
  database: Database;
  activeView: DatabaseView | undefined;
  setSettingsSection: (s: SettingsSection) => void;
  onChangeColorBy: (propId: PropertyBrandId | null) => void;
}

export default function ColorSection({
  database,
  activeView,
  setSettingsSection,
  onChangeColorBy,
}: ColorSectionProps) {
  return (
    <>
      <SubPanelHeader title="Color" onBack={() => setSettingsSection("main")} />

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
          Color by
        </Typography>
        <Select
          value={activeView?.config.colorBy ?? ""}
          onChange={(e) => {
            const val = e.target.value as string;
            onChangeColorBy(val === "" ? null : PropertyBrandId.parse(val));
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
          <MenuItem value="" sx={{ fontSize: "13px" }}>
            None
          </MenuItem>
          {database.propertyOrder
            .filter((id) => {
              const prop = database.properties[id];
              return prop?.type === "select" || prop?.type === "multiSelect";
            })
            .map((id) => {
              const prop = database.properties[id]!;
              return (
                <MenuItem key={id} value={id} sx={{ fontSize: "13px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {PROPERTY_TYPE_ICONS[prop.type]}
                    {prop.name}
                  </Box>
                </MenuItem>
              );
            })}
        </Select>
      </Box>

      {activeView?.config.colorBy &&
        (() => {
          const colorProp = database.properties[activeView.config.colorBy!];
          if (!colorProp?.options?.length) return null;
          return (
            <Box sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
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
                Colors
              </Typography>
              {colorProp.options.map((opt) => (
                <Box
                  key={opt.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "3px",
                      bgcolor: resolveColor(opt.color),
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: "12px" }}>{opt.name}</Typography>
                </Box>
              ))}
            </Box>
          );
        })()}
    </>
  );
}
