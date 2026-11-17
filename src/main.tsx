import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { LocaleProvider } from "./lib/locale.tsx";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

registerSW({ immediate: true });

// Back and forward return each page to where it was scrolled; new navigations start at the top.
const router = createRouter({ routeTree, scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  </StrictMode>,
);
