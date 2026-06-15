import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { checkoutDevPlugin } from "./dev-api/checkoutDevPlugin";

export default defineConfig({
  plugins: [checkoutDevPlugin(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase/supabase-js")) return "supabase";
            if (id.includes("@sentry/")) return "sentry";
            if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) {
              return "vendor";
            }
          }
        },
      },
    },
  },
  server: {
    // Non-checkout /api routes still proxy to Future-Trace BFF when it runs on :3000.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass(req) {
          const path = (req.url ?? "").split("?")[0];
          if (path.startsWith("/api/v1/checkout")) {
            return null;
          }
        },
      },
    },
  },
});
