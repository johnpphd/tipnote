import { useMemo, useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useAtomValue } from "jotai";
import { themeModeAtom } from "@/atoms/workspace";
import { createTipnoteTheme } from "@/theme/createTipnoteTheme";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const mode = useAtomValue(themeModeAtom);
  const theme = useMemo(() => createTipnoteTheme(mode), [mode]);

  useEffect(() => {
    document.body.setAttribute("data-theme", mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Outlet />
      </Box>
    </ThemeProvider>
  );
}
