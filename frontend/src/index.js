import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";

// En mode application desktop (Sparkle.exe), l'interface est l'assistant d'installation.
// Sur le web, c'est la page d'atterrissage (landing).
// Chargement paresseux : seul le code + CSS de l'interface affichée est chargé
// (évite les collisions de styles entre App.css et Wizard.css).
const IS_DESKTOP = typeof window !== "undefined" && !!(window.sparkle && window.sparkle.isDesktop);
const Root = IS_DESKTOP ? lazy(() => import("@/Wizard")) : lazy(() => import("@/App"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <Root />
      </Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
);
