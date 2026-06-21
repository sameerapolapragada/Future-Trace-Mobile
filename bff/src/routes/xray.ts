import { Hono } from "hono";
import { getAuth } from "../lib/supabaseRest.ts";
import { generateCareerXray } from "../services/xray.ts";

export const xrayRoutes = new Hono();

xrayRoutes.post("/api/v1/xray/generate", async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json<Record<string, unknown>>();
    const scanId = String(body.scanId ?? "").trim();
    if (!scanId) return c.json({ error: "scanId is required" }, 400);
    const result = await generateCareerXray(auth.token, auth.userId, scanId);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "X-Ray generation failed";
    if (message.includes("OPENROUTER_API_KEY")) return c.json({ error: message }, 503);
    return c.json({ error: message }, 502);
  }
});
