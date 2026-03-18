import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import "tippy.js/dist/tippy.css";
import "./webmcp-qa";
import "./webmcp-qa-tipnote";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
