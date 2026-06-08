import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth/AuthProvider";
import { EntitlementsProvider } from "./lib/entitlements";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <EntitlementsProvider>
        <App />
      </EntitlementsProvider>
    </AuthProvider>
  </StrictMode>
);
