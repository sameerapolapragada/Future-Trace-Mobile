import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthProvider";
import { EntitlementsProvider } from "./lib/entitlements";
import { registerAppServiceWorker } from "./lib/registerAppServiceWorker";
import { initSentry, Sentry } from "./lib/sentry";
import { ToastProvider } from "./lib/ToastContext";
import "./index.css";
import App from "./App";

initSentry();
registerAppServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
      <AuthProvider>
        <EntitlementsProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
