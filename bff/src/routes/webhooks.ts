import { Hono } from "hono";
import { isMvpCheckoutEnabled } from "../lib/mvpFlags.ts";
import { handleStripeWebhook } from "../services/checkout.ts";

export const webhookRoutes = new Hono();

webhookRoutes.post("/api/webhooks/stripe", async (c) => {
  if (!isMvpCheckoutEnabled()) {
    return c.json({ received: true, ignored: "mvp_launch" });
  }

  try {
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature");
    const result = await handleStripeWebhook(rawBody, signature);
    return c.json(result);
  } catch (err) {
    console.error("[bff] stripe webhook failed:", err);
    return c.json({ error: err instanceof Error ? err.message : "Webhook failed" }, 400);
  }
});
