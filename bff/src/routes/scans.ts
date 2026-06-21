import { Hono } from "hono";
import { getAuth } from "../lib/supabaseRest.ts";
import { rateLimit } from "../lib/rateLimit.ts";
import { createCareerScan, getCareerScan, ScanQuotaError } from "../services/scans.ts";

export const scansRoutes = new Hono();

scansRoutes.post("/api/v1/scans", async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  if (!rateLimit(`scan:${auth.userId}`, 5, 60_000)) {
    return c.json({ error: "Too many scan requests. Try again in a minute." }, 429);
  }

  try {
    const body = await c.req.json<Record<string, unknown>>();
    const result = await createCareerScan(auth.token, auth.userId, {
      currentRole: String(body.currentRole ?? ""),
      targetRole: String(body.targetRole ?? ""),
      industry: String(body.industry ?? ""),
      yearsExperience: String(body.yearsExperience ?? ""),
      skills: String(body.skills ?? ""),
      tools: String(body.tools ?? ""),
      careerGoal: String(body.careerGoal ?? ""),
      workPreference: String(body.workPreference ?? "Hybrid"),
      inputHash: body.inputHash ? String(body.inputHash) : undefined,
      cacheKey: body.cacheKey ? String(body.cacheKey) : undefined,
      modelTier: body.modelTier ? String(body.modelTier) : undefined,
    });
    return c.json(result);
  } catch (err) {
    if (err instanceof ScanQuotaError) return c.json({ error: err.message }, 429);
    const message = err instanceof Error ? err.message : "Scan generation failed";
    if (message.includes("invalid JSON")) return c.json({ error: message }, 502);
    if (message.includes("already ran")) return c.json({ error: message }, 409);
    console.error("[bff] scan failed:", err);
    return c.json({ error: message }, 502);
  }
});

scansRoutes.get("/api/v1/scans/:id", async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const scan = await getCareerScan(auth.token, auth.userId, c.req.param("id"));
  if (!scan) return c.json({ error: "Scan not found" }, 404);

  return c.json({
    scanId: scan.id,
    status: scan.status,
    summary: scan.summary,
    hasResult: Boolean(scan.free_result_json ?? scan.result),
    createdAt: scan.created_at,
  });
});
