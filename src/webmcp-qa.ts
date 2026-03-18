if (import.meta.env.DEV) {
  type Tool = {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => unknown;
  };
  type ModelContext = { tools: Tool[]; registerTool: (tool: Tool) => void };

  const nav = navigator as Navigator & { modelContext?: ModelContext };
  if (!nav.modelContext) {
    const tools: Tool[] = [];
    nav.modelContext = { tools, registerTool: (tool) => tools.push(tool) };
  }
  const mc = nav.modelContext;

  // Tool 1: get_app_state
  mc.registerTool({
    name: "get_app_state",
    description:
      "Returns the current application state from the __APP_STORE__ bridge",
    parameters: {},
    execute: () => {
      const win = window as Window & {
        __APP_STORE__?: { getState: () => Record<string, unknown> };
      };
      if (!win.__APP_STORE__) {
        return { error: "__APP_STORE__ bridge not found" };
      }
      return win.__APP_STORE__.getState();
    },
  });

  // Tool 2: assert_element
  mc.registerTool({
    name: "assert_element",
    description:
      "Checks if a DOM element matching the selector exists, optionally verifying text content",
    parameters: {
      selector: { type: "string", required: true },
      contains: { type: "string", required: false },
    },
    execute: (params) => {
      const selector = params.selector as string;
      const contains = params.contains as string | undefined;
      const el = document.querySelector(selector);
      if (!el) {
        return { found: false, selector };
      }
      const text = (el.textContent ?? "").trim().slice(0, 200);
      const result: Record<string, unknown> = {
        found: true,
        tagName: el.tagName,
        text,
      };
      if (contains) {
        result.containsMatch = text
          .toLowerCase()
          .includes(contains.toLowerCase());
      }
      return result;
    },
  });

  // Tool 3: run_qa_check
  mc.registerTool({
    name: "run_qa_check",
    description:
      'Runs a QA check: "dom_health", "console_errors", or "performance"',
    parameters: {
      check: { type: "string", required: true },
    },
    execute: (params) => {
      const check = params.check as string;

      if (check === "dom_health") {
        const root = document.getElementById("root");
        const allElements = document.querySelectorAll("*");
        const images = document.querySelectorAll("img");
        const brokenImages = Array.from(images).filter(
          (img) => !img.complete || img.naturalWidth === 0,
        );
        return {
          check: "dom_health",
          rootPresent: !!root,
          rootChildren: root?.children.length ?? 0,
          totalElements: allElements.length,
          brokenImages: brokenImages.length,
        };
      }

      if (check === "console_errors") {
        return {
          check: "console_errors",
          note: "Use mcp__claude-in-chrome__read_console_messages to read console errors",
        };
      }

      if (check === "performance") {
        const navEntries = performance.getEntriesByType("navigation");
        const navTiming = navEntries[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType("resource");
        const mem = (performance as unknown as Record<string, unknown>)
          .memory as
          | { usedJSHeapSize?: number; jsHeapSizeLimit?: number }
          | undefined;
        return {
          check: "performance",
          domContentLoaded: navTiming
            ? navTiming.domContentLoadedEventEnd -
              navTiming.domContentLoadedEventStart
            : null,
          loadComplete: navTiming
            ? navTiming.loadEventEnd - navTiming.loadEventStart
            : null,
          resourceCount: resources.length,
          memoryMB: mem?.usedJSHeapSize
            ? Math.round(mem.usedJSHeapSize / 1024 / 1024)
            : null,
        };
      }

      return { error: `Unknown check: ${check}` };
    },
  });

  console.log("[WebMCP-QA] 3 tools registered");
}
