import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";
import Wizard from "@/Wizard";

// En mode application desktop (Sparkle.exe), l'interface est l'assistant d'installation.
// Sur le web, c'est la page d'atterrissage (landing).
const IS_DESKTOP = typeof window !== "undefined" && !!(window.sparkle && window.sparkle.isDesktop);
const Root = IS_DESKTOP ? Wizard : App;

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
      <Root />
    </QueryClientProvider>
  </React.StrictMode>,
);
