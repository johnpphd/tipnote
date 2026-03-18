import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { auth } from "@/lib/firebase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({ routeTree });

// Dev-only: expose app state for WebMCP QA tools
if (import.meta.env.DEV) {
  (
    window as Window & {
      __APP_STORE__?: { getState: () => Record<string, unknown> };
    }
  ).__APP_STORE__ = {
    getState: () => ({
      route: window.location.pathname,
      queryKeys: queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),
      queryCount: queryClient.getQueryCache().getAll().length,
      auth: {
        authenticated: !!auth.currentUser,
        uid: auth.currentUser?.uid ?? null,
        email: auth.currentUser?.email ?? null,
      },
    }),
  };
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
