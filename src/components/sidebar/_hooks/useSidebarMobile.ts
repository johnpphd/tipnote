import { useMediaQuery, useTheme } from "@mui/material";

export function useSidebarMobile() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("md"));
}
