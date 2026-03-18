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

  function checkSelector(
    selector: string,
    label: string,
  ): { pass: boolean; label: string; detail?: string } {
    const el = document.querySelector(selector);
    if (el) return { pass: true, label };
    return { pass: false, label, detail: `${selector} not found` };
  }

  // Tool 1: get_routes
  mc.registerTool({
    name: "get_routes",
    description: "Returns the static route list for the Tipnote application",
    parameters: {},
    execute: () => [
      { path: "/", description: "Home/redirect" },
      { path: "/login", description: "Login" },
      { path: "/w", description: "Workspace layout" },
      { path: "/w/:pageId", description: "Page view" },
      { path: "/shared", description: "Shared pages" },
      { path: "/shared/:pageId", description: "Shared page view" },
      { path: "/share/:shareToken", description: "Share link" },
    ],
  });

  // Tool 2: navigate_to_route
  mc.registerTool({
    name: "navigate_to_route",
    description: "Navigates to a route using pushState and popstate event",
    parameters: {
      path: { type: "string", required: true },
    },
    execute: (params) => {
      const path = params.path as string;
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return { navigated: true, path };
    },
  });

  // Tool 3: verify_editor_page
  mc.registerTool({
    name: "verify_editor_page",
    description: "Verifies the editor page is properly rendered",
    parameters: {},
    execute: () => {
      const checks = [
        {
          pass: /\/w\/.+/.test(window.location.pathname),
          label: "Route matches /w/.+",
          ...(/\/w\/.+/.test(window.location.pathname)
            ? {}
            : { detail: `Current route: ${window.location.pathname}` }),
        },
        checkSelector(".tiptap, .ProseMirror", "Editor element present"),
        checkSelector("[data-testid='top-bar'], header", "TopBar present"),
        checkSelector(
          "[data-testid='page-header'], [class*='pageHeader'], h1",
          "PageHeader present",
        ),
        (() => {
          const spinner = document.querySelector(
            "[data-testid='loading'], .animate-spin, [role='progressbar']",
          );
          return {
            pass: !spinner,
            label: "No loading spinner",
            ...(spinner ? { detail: "Loading spinner still visible" } : {}),
          };
        })(),
      ];
      return {
        tool: "verify_editor_page",
        allPassed: checks.every((c) => c.pass),
        checks,
      };
    },
  });

  // Tool 4: verify_slash_menu
  mc.registerTool({
    name: "verify_slash_menu",
    description: "Verifies the slash command menu is visible",
    parameters: {},
    execute: () => {
      const tippy = document.querySelector(".tippy-box");
      let tippyFound = false;
      let slashMenuVisible = false;
      if (tippy) {
        tippyFound = true;
        const style = window.getComputedStyle(tippy);
        slashMenuVisible =
          style.display !== "none" && style.visibility !== "hidden";
      }
      return { tool: "verify_slash_menu", slashMenuVisible, tippyFound };
    },
  });

  // Tool 5: verify_database_view
  mc.registerTool({
    name: "verify_database_view",
    description: "Verifies a database view is properly rendered",
    parameters: {},
    execute: () => {
      const checks = [
        {
          pass: /\/w\/.+/.test(window.location.pathname),
          label: "Route matches /w/.+",
          ...(/\/w\/.+/.test(window.location.pathname)
            ? {}
            : { detail: `Current route: ${window.location.pathname}` }),
        },
        checkSelector(
          "[data-testid='database-toolbar'], [class*='DatabaseToolbar'], [class*='database-toolbar']",
          "DatabaseToolbar present",
        ),
        (() => {
          const viewSelectors = [
            "table, [class*='TableView']",
            "[class*='BoardView'], [class*='kanban']",
            "[class*='ListView']",
            "[class*='GalleryView']",
            "[class*='CalendarView']",
          ];
          const found = viewSelectors.some((s) => document.querySelector(s));
          return {
            pass: found,
            label: "Active view found",
            ...(found ? {} : { detail: "No known view type detected" }),
          };
        })(),
        (() => {
          const rows = document.querySelectorAll(
            "tr, [data-testid*='row'], [class*='Row'], [class*='card']",
          );
          return {
            pass: rows.length > 0,
            label: "Rows present",
            detail: `${rows.length} rows found`,
          };
        })(),
      ];
      return {
        tool: "verify_database_view",
        allPassed: checks.every((c) => c.pass),
        checks,
      };
    },
  });

  // Tool 6: verify_workspace_layout
  mc.registerTool({
    name: "verify_workspace_layout",
    description: "Verifies the workspace layout structure",
    parameters: {},
    execute: () => {
      const checks = [
        checkSelector(
          "[data-testid='sidebar'], nav, aside, [class*='Sidebar']",
          "Sidebar present",
        ),
        checkSelector(
          "main, [data-testid='main-content'], [role='main']",
          "Main content present",
        ),
        checkSelector(
          "[class*='copilot'], [data-testid='copilot-sidebar']",
          "CopilotSidebar present",
        ),
      ];
      return {
        tool: "verify_workspace_layout",
        allPassed: checks.every((c) => c.pass),
        checks,
      };
    },
  });

  // Tool 7: verify_sidebar
  mc.registerTool({
    name: "verify_sidebar",
    description:
      "Verifies the sidebar is properly rendered with expected elements",
    parameters: {},
    execute: () => {
      const checks = [
        checkSelector(
          "[data-testid='sidebar'], nav, aside, [class*='Sidebar']",
          "Sidebar visible",
        ),
        checkSelector(
          "[data-testid*='page-tree'], [class*='pageTree'], [class*='PageTree'], [class*='tree-item'], [data-testid*='tree']",
          "Page tree items present",
        ),
        checkSelector(
          "[data-testid='workspace-name'], [class*='workspaceName'], [class*='WorkspaceName']",
          "Workspace name present",
        ),
        checkSelector(
          "[data-testid='new-page'], [aria-label*='new page' i], button[class*='newPage']",
          "New page button present",
        ),
      ];
      return {
        tool: "verify_sidebar",
        allPassed: checks.every((c) => c.pass),
        checks,
      };
    },
  });

  // Tool 8: run_flow_test
  mc.registerTool({
    name: "run_flow_test",
    description:
      "Runs a composed flow test that invokes multiple tools in sequence",
    parameters: {
      flow: { type: "string", required: true },
    },
    execute: (params) => {
      const flow = params.flow as string;

      const run = (name: string, args: Record<string, unknown> = {}) => {
        const tool = mc.tools.find((t) => t.name === name);
        if (!tool) return { error: `Tool ${name} not found` };
        return tool.execute(args);
      };

      const flows: Record<string, () => Record<string, unknown>> = {
        layout_check: () => ({
          flow: "layout_check",
          appState: run("get_app_state"),
          layout: run("verify_workspace_layout"),
        }),
        editor_check: () => ({
          flow: "editor_check",
          appState: run("get_app_state"),
          editor: run("verify_editor_page"),
        }),
        database_check: () => ({
          flow: "database_check",
          appState: run("get_app_state"),
          database: run("verify_database_view"),
        }),
        sidebar_check: () => ({
          flow: "sidebar_check",
          appState: run("get_app_state"),
          sidebar: run("verify_sidebar"),
        }),
        full_health: () => ({
          flow: "full_health",
          appState: run("get_app_state"),
          domHealth: run("run_qa_check", { check: "dom_health" }),
          performance: run("run_qa_check", { check: "performance" }),
          layout: run("verify_workspace_layout"),
          sidebar: run("verify_sidebar"),
          editor: run("verify_editor_page"),
          database: run("verify_database_view"),
        }),
      };

      if (!flows[flow]) {
        return { error: `Unknown flow: ${flow}` };
      }
      return flows[flow]();
    },
  });

  console.log("[WebMCP-QA-Tipnote] 8 tools registered");
}
