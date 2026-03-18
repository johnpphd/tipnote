import { createTheme } from "@mui/material/styles";

export const FONT_MONO = "'PP Neue Montreal Mono', monospace";

const notionTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#191919",
      paper: "#202020",
    },
    primary: {
      main: "#2383e2",
      dark: "#1b6ec2",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.9)",
      secondary: "rgba(255, 255, 255, 0.55)",
      disabled: "rgba(255, 255, 255, 0.3)",
    },
    divider: "rgba(255, 255, 255, 0.08)",
    action: {
      hover: "rgba(255, 255, 255, 0.06)",
      selected: "rgba(255, 255, 255, 0.08)",
    },
  },
  typography: {
    fontFamily:
      'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
    fontWeightMedium: 500,
    fontWeightBold: 700,
    body2: {
      fontSize: "14px",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#191919",
          color: "rgba(255, 255, 255, 0.9)",
        },
        "::-webkit-scrollbar": {
          width: 8,
          height: 8,
        },
        "::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          borderRadius: 4,
        },
        "::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        "*:focus-visible": {
          outline: "2px solid #2383e2",
          outlineOffset: "2px",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#202020",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.55)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.06)",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(255, 255, 255, 0.55)",
          "&.Mui-selected": {
            color: "rgba(255, 255, 255, 0.9)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2f2f2f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#2f2f2f",
          border: "1px solid rgba(255, 255, 255, 0.08)",
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
          color: "rgba(255, 255, 255, 0.3)",
          "&.Mui-checked": {
            color: "#2383e2",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default notionTheme;
