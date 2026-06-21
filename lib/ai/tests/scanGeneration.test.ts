import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseScanGeneration } from "../scanGeneration.ts";
import { resolveModelRoute } from "../router.ts";
import { orchestrate, buildAccessContext } from "../orchestrator.ts";

describe("parseScanGeneration", () => {
  it("parses valid scan JSON", () => {
    const raw = JSON.stringify({
      currentRole: "Engineer",
      targetRole: "PM",
      currentRoleProfile: {
        resilienceScore: 70,
        aiExposureLevel: "medium",
        aiExposureLabel: "Moderate",
        strengths: ["A", "B", "C"],
        vulnerabilities: ["D", "E", "F"],
        opportunityZones: ["G", "H", "I"],
      },
      targetRoleProfile: {
        resilienceScore: 65,
        aiExposureLevel: "low",
        aiExposureLabel: "Low",
        strengths: ["A", "B", "C"],
        vulnerabilities: ["D", "E", "F"],
        opportunityZones: ["G", "H", "I"],
      },
      summary: "Solid path forward.",
      initialRoleRecommendations: ["Product Manager", "Technical PM", "Solutions Architect"],
      xrayPreview: {
        readinessScore: 68,
        transitionDifficulty: "medium",
        topRoleTeaser: "Product Manager fits your systems thinking.",
        unlockMessage: "Unlock full Career X-Ray for $1.99",
      },
    });

    const parsed = parseScanGeneration(raw);
    assert.equal(parsed.currentRole, "Engineer");
    assert.equal(parsed.initialRoleRecommendations.length, 3);
    assert.equal(parsed.xrayPreview.readinessScore, 68);
  });
});

describe("free tier routing", () => {
  it("routes free scans to openrouter chain", () => {
    const route = orchestrate(
      "career_profile_scan",
      buildAccessContext({
        hasTransitionSubscription: false,
        hasCareerXrayPurchase: false,
      })
    );

    assert.equal(route.allowed, true);
    assert.equal(route.source, "openrouter_free");
    assert.equal(route.model, "openai/gpt-oss-120b:free");
    assert.deepEqual(route.modelChain, [
      "openai/gpt-oss-120b:free",
      "openai/gpt-oss-20b:free",
      "openrouter/free",
    ]);
  });

  it("routes paid xray to openrouter free chain", () => {
    const route = resolveModelRoute(
      "career_xray_report",
      buildAccessContext({
        hasTransitionSubscription: false,
        hasCareerXrayPurchase: true,
        hasExistingXrayResult: false,
      })
    );

    assert.equal(route.allowed, true);
    assert.equal(route.source, "openrouter_free");
    assert.equal(route.model, "openai/gpt-oss-120b:free");
  });
});
