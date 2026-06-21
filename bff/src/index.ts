import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { allowedOrigins, env } from "./env.ts";
import { checkoutRoutes } from "./routes/checkout.ts";
import { scansRoutes } from "./routes/scans.ts";
import { webhookRoutes } from "./routes/webhooks.ts";
import { xrayRoutes } from "./routes/xray.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      const allowed = allowedOrigins();
      return allowed.includes(origin) ? origin : allowed[0] ?? "http://localhost:5173";
    },
    allowHeaders: ["Authorization", "Content-Type", "Stripe-Signature"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

app.get("/api/health", (c) => c.json({ ok: true, service: "future-trace-bff" }));

app.route("/", scansRoutes);
app.route("/", checkoutRoutes);
app.route("/", xrayRoutes);
app.route("/", webhookRoutes);

const port = Number(env("BFF_PORT") ?? "3000");

console.log(`[bff] Future Trace BFF listening on http://localhost:${port}`);
console.log(`[bff] Allowed origins: ${allowedOrigins().join(", ")}`);

serve({ fetch: app.fetch, port });
