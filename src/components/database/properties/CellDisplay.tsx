import { memo } from "react";
import { Chip, Box, Checkbox, Link, Typography } from "@mui/material";
import { Description as PageIcon } from "@mui/icons-material";
import type { PropertyDefinition, PropertyValue } from "@/types";
import type { Timestamp } from "firebase/firestore";
import { NOTION_COLORS } from "@/theme/notionColors";
import { FONT_WEIGHT_MEDIUM } from "@/theme/fontWeights";

function resolveColor(color: string): string {
  return NOTION_COLORS[color] ?? color;
}

interface CellDisplayProps {
  property: PropertyDefinition;
  value: PropertyValue;
  /** Number of visible lines before clamping. 1 = single-line truncation (default), 0 = no clamp. */
  maxLines?: number;
}

function lineClampSx(
  maxLines: number,
): Record<string, string | number | undefined> {
  if (maxLines === 0) {
    return { whiteSpace: "normal" };
  }
  if (maxLines > 1) {
    return {
      display: "-webkit-box",
      WebkitLineClamp: maxLines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "normal",
    };
  }
  // Default: single-line truncation
  return {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

function CellDisplay({ property, value, maxLines = 1 }: CellDisplayProps) {
  if (value == null || value === "") {
    return (
      <Typography
        variant="body2"
        sx={{ color: "text.disabled", fontSize: "13px" }}
      >
        &mdash;
      </Typography>
    );
  }

  switch (property.type) {
    case "title":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <PageIcon
            sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }}
          />
          <Typography
            variant="body2"
            sx={{ fontSize: "13px", ...lineClampSx(maxLines) }}
          >
            {String(value)}
          </Typography>
        </Box>
      );

    case "text":
    case "person":
      return (
        <Typography
          variant="body2"
          sx={{ fontSize: "13px", ...lineClampSx(maxLines) }}
        >
          {String(value)}
        </Typography>
      );

    case "number": {
      let display: string;
      if (typeof value !== "number") {
        display = String(value);
      } else if (property.numberFormat === "percent") {
        display = value.toLocaleString(undefined, {
          style: "percent",
          maximumFractionDigits: 0,
        });
      } else {
        display = value.toLocaleString();
      }
      return (
        <Typography
          variant="body2"
          sx={{ fontSize: "13px", fontVariantNumeric: "tabular-nums" }}
        >
          {display}
        </Typography>
      );
    }

    case "checkbox":
      return (
        <Checkbox
          size="small"
          checked={value === true}
          disabled
          sx={{
            p: 0,
            color: "text.disabled",
            "&.Mui-checked": { color: "primary.main" },
          }}
        />
      );

    case "select": {
      // Match by ID or by name (values may be stored as either)
      const opt =
        property.options?.find((o) => o.id === value) ??
        property.options?.find((o) => o.name === value);
      return opt ? (
        <Chip
          label={opt.name}
          size="small"
          sx={{
            bgcolor: resolveColor(opt.color),
            color: "white",
            height: 22,
            fontSize: "12px",
            fontWeight: FONT_WEIGHT_MEDIUM,
            borderRadius: "3px",
            "& .MuiChip-label": { px: 1 },
          }}
        />
      ) : (
        <Typography variant="body2" sx={{ fontSize: "13px" }}>
          {String(value)}
        </Typography>
      );
    }

    case "multiSelect": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
          {arr.map((id) => {
            const opt =
              property.options?.find((o) => o.id === id) ??
              property.options?.find((o) => o.name === id);
            return opt ? (
              <Chip
                key={id}
                label={opt.name}
                size="small"
                sx={{
                  bgcolor: resolveColor(opt.color),
                  color: "white",
                  height: 20,
                  fontSize: "11px",
                  fontWeight: FONT_WEIGHT_MEDIUM,
                  borderRadius: "3px",
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            ) : null;
          })}
        </Box>
      );
    }

    case "date": {
      let display: string;
      if (typeof value === "object" && "toDate" in (value as Timestamp)) {
        display = (value as Timestamp).toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } else if (typeof value === "string") {
        // Parse YYYY-MM-DD in local time to avoid UTC midnight shift
        const parts = value.split("-").map(Number);
        const parsed =
          parts.length === 3
            ? new Date(parts[0]!, parts[1]! - 1, parts[2]!)
            : new Date(value);
        if (!isNaN(parsed.getTime())) {
          display = parsed.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else {
          display = value;
        }
      } else {
        display = String(value);
      }
      return (
        <Typography variant="body2" sx={{ fontSize: "13px" }}>
          {display}
        </Typography>
      );
    }

    case "url": {
      // Show shortened URL like Notion: "domain.com" + truncated path
      const urlStr = String(value);
      let displayUrl = urlStr;
      try {
        const u = new URL(urlStr);
        const path = u.pathname + u.search + u.hash;
        const shortPath =
          path.length > 10
            ? "/" + path.slice(1, 4) + "..." + path.slice(-6)
            : path;
        displayUrl =
          u.hostname.replace("www.", "") + (path !== "/" ? shortPath : "");
      } catch {
        // use raw value
      }
      return (
        <Link
          href={urlStr}
          target="_blank"
          rel="noopener"
          sx={{
            fontSize: "13px",
            color: "text.secondary",
            textDecoration: "underline",
            textDecorationColor: "divider",
          }}
          noWrap
        >
          {displayUrl}
        </Link>
      );
    }

    default:
      return (
        <Typography variant="body2" sx={{ fontSize: "13px" }}>
          {String(value)}
        </Typography>
      );
  }
}

export default memo(CellDisplay);
