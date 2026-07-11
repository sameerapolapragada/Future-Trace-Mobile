import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchLocalOccupation } from "../onet/matchOccupation";
import {
  occupationSimilarity,
  rankRelatedOccupations,
  sharedOccupationSkills,
} from "../onet/skillDistance";
import { getLocalOccupationByCode } from "../onet/localIndex";

describe("O*NET skill distance", () => {
  it("scores identical occupations as strongly related (same SOC cluster)", () => {
    const security = getLocalOccupationByCode("15-1212.00");
    assert.ok(security);
    assert.equal(occupationSimilarity(security!, security!), 0.88);
  });

  it("ranks security-adjacent occupations above software for cybersecurity", () => {
    const related = rankRelatedOccupations("Cybersecurity Analyst", 6);
    assert.ok(related.length > 0);

    const topTitles = related.map((item) => item.occupation.title).join(" | ");
    assert.ok(
      related.some((item) => /Network and Computer Systems Administrators|Computer Systems Analysts|Computer User Support/i.test(item.occupation.title)),
      `expected IT/security-adjacent related roles, got: ${topTitles}`
    );

    const software = related.find((item) => item.occupation.code === "15-1252.00");
    const systemsAdmin = related.find((item) => item.occupation.code === "15-1244.00");
    if (software && systemsAdmin) {
      assert.ok(
        systemsAdmin.similarity >= software.similarity,
        `sysadmin (${systemsAdmin.similarity}) should be >= software (${software.similarity})`
      );
    }
  });

  it("returns shared skills between related occupations", () => {
    const source = matchLocalOccupation("Cybersecurity Analyst")?.occupation;
    const target = getLocalOccupationByCode("15-1244.00");
    assert.ok(source);
    assert.ok(target);
    const shared = sharedOccupationSkills(source!, target!, 3);
    assert.ok(shared.length >= 1);
    assert.ok(shared.some((skill) => /Critical Thinking|Complex Problem Solving|Systems Analysis/i.test(skill)));
  });
});
