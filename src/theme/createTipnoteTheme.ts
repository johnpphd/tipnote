import { createTheme, type Theme } from "@mui/material/styles";
import { darkPalette, lightPalette, type TipnotePalette } from "./palette";

export const FONT_MONO = "'PP Neue Montreal Mono', monospace";

const FONT_FAMILY =
  '"Quicksand", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

function buildTheme(p: TipnotePalette): Theme {
  return createTheme({
    palette: {
      mode: p.mode,
      background: p.background,
      primary: p.primary,
      secondary: p.secondary,
      text: p.text,
      divider: p.divider,
      action: {
        hover: p.action.hover,
        selected: p.action.selected,
      },
    },
    typography: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      body1: {
        fontSize: "1.0625rem",
      },
      body2: {
        fontSize: "0.9375rem",
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: p.background.default,
            color: p.text.primary,
          },
          "::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor:
              p.mode === "dark"
                ? "rgba(245, 240, 230, 0.15)"
                : "rgba(45, 35, 25, 0.2)",
            borderRadius: 8,
          },
          "::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "*:focus-visible": {
            outline: `2px solid ${p.primary.main}`,
            outlineOffset: "2px",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: p.background.paper,
            borderRight: "none",
            boxShadow:
              p.mode === "dark"
                ? "4px 0 16px rgba(0, 0, 0, 0.2)"
                : "4px 0 16px rgba(0, 0, 0, 0.04)",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: p.text.secondary,
            "&:hover": {
              backgroundColor: p.action.hover,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: p.text.secondary,
            "&.Mui-selected": {
              color: p.text.primary,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${p.mode === "dark" ? "rgba(245, 240, 230, 0.04)" : "rgba(45, 35, 25, 0.06)"}`,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: p.surface,
            border: "none",
            boxShadow:
              p.mode === "dark"
                ? "0 4px 24px rgba(0, 0, 0, 0.3)"
                : "0 4px 24px rgba(0, 0, 0, 0.08)",
            borderRadius: 12,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: p.surface,
            border: "none",
            boxShadow:
              p.mode === "dark"
                ? "0 4px 24px rgba(0, 0, 0, 0.3)"
                : "0 4px 24px rgba(0, 0, 0, 0.08)",
            borderRadius: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: p.text.disabled,
            "&.Mui-checked": {
              color: p.primary.main,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none" as const,
          },
        },
      },
    },
  });
}

export function createTipnoteTheme(mode: "light" | "dark"): Theme {
  const palette = mode === "dark" ? darkPalette : lightPalette;
  return buildTheme(palette);
}
