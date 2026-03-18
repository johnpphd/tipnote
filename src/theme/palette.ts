/**
 * Nature-inspired dual-theme palette tokens.
 *
 * Both themes share the same semantic structure but with different values.
 * Dark: deep forest greens, warm off-whites, gold accents
 * Light: warm cream/parchment, forest greens, amber accents
 */

export interface TipnotePalette {
  mode: "light" | "dark";
  background: { default: string; paper: string };
  primary: { main: string; dark: string };
  secondary: { main: string };
  text: { primary: string; secondary: string; disabled: string };
  divider: string;
  action: { hover: string; selected: string };
  /** Custom surface color for popovers, menus, and elevated panels */
  surface: string;
  /** Accent color for highlights and decorative elements */
  accent: string;
}

export const darkPalette: TipnotePalette = {
  mode: "dark",
  background: {
    default: "#1a1f1a",
    paper: "#222722",
  },
  primary: {
    main: "#6b9e6b",
    dark: "#4a7a4a",
  },
  secondary: {
    main: "#d4a662",
  },
  text: {
    primary: "rgba(245, 240, 230, 0.92)",
    secondary: "rgba(245, 240, 230, 0.55)",
    disabled: "rgba(245, 240, 230, 0.3)",
  },
  divider: "rgba(245, 240, 230, 0.05)",
  action: {
    hover: "rgba(245, 240, 230, 0.06)",
    selected: "rgba(245, 240, 230, 0.08)",
  },
  surface: "#2d332d",
  accent: "#d4a662",
};

export const lightPalette: TipnotePalette = {
  mode: "light",
  background: {
    default: "#faf6f0",
    paper: "#fffcf7",
  },
  primary: {
    main: "#4a7a4a",
    dark: "#356035",
  },
  secondary: {
    main: "#b8863e",
  },
  text: {
    primary: "rgba(45, 35, 25, 0.9)",
    secondary: "rgba(45, 35, 25, 0.55)",
    disabled: "rgba(45, 35, 25, 0.3)",
  },
  divider: "rgba(45, 35, 25, 0.06)",
  action: {
    hover: "rgba(45, 35, 25, 0.07)",
    selected: "rgba(45, 35, 25, 0.10)",
  },
  surface: "#ffffff",
  accent: "#c4975a",
};
