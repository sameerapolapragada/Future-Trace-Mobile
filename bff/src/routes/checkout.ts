import { Hono } from "hono";
import { getAuth } from "../lib/supabaseRest.ts";
import { isMvpCheckoutEnabled } from "../lib/mvpFlags.ts";
import { confirmCheckoutSession, createCheckoutSession } from "../services/checkout.ts";

export const checkoutRoutes = new Hono();

checkoutRoutes.post("/api/v1/checkout", async (c) => {
  if (!isMvpCheckoutEnabled()) {
    return c.json({ error: "Purchases are disabled for MVP launch." }, 403);
  }

  const auth = await getAuth(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<Record<string, unknown>>();
    const result = await createCheckoutSession(auth.token, auth.userId, body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Checkout failed" }, 500);
  }
});

checkoutRoutes.post("/api/v1/checkout/confirm", async (c) => {
  if (!isMvpCheckoutEnabled()) {
    return c.json({ error: "Purchases are disabled for MVP launch." }, 403);
  }

  const auth = await getAuth(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<Record<string, unknown>>();
    const sessionId = String(body.sessionId ?? "").trim();
    if (!sessionId) return c.json({ error: "sessionId is required" }, 400);
    const result = await confirmCheckoutSession(auth.token, auth.userId, sessionId);
    return c.json(result);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Confirm failed" }, 500);
  }
});
