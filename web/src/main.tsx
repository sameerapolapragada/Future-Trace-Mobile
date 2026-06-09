import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthProvider";
import { EntitlementsProvider } from "./lib/entitlements";
import { ToastProvider } from "./lib/ToastContext";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <EntitlementsProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </EntitlementsProvider>
    </AuthProvider>
  </StrictMode>
);
