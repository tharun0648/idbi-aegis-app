import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { narrate, type NarratorTrace } from "@/ai/narrator";
import { assess } from "@/engine/aegis-core";
import { SEEDS } from "@/data/seeds";

describe("narrate() trace param", () => {
  const originalKey = process.env.GROQ_API_KEY;
  beforeEach(() => { delete process.env.GROQ_API_KEY; });
  afterEach(() => { if (originalKey) process.env.GROQ_API_KEY = originalKey; });

  it("no API key: returns null and leaves trace fields null", async () => {
    const core = assess(SEEDS.champion.profile);
    const meta = { id: "custom", businessName: "x", archetype: "y", emoji: "", bureauScore: null, bureauVerdict: "Not pulled" };
    const trace: NarratorTrace = { model: null, prompt: null, response: null };

    const text = await narrate(core, meta, trace);

    expect(text).toBeNull();
    expect(trace.prompt).toBeNull();
    expect(trace.response).toBeNull();
    expect(trace.model).toBeNull();
  });

  it("is backward compatible when no trace is passed", async () => {
    const core = assess(SEEDS.champion.profile);
    const meta = { id: "champion", businessName: "x", archetype: "y", emoji: "", bureauScore: null, bureauVerdict: "reject" };
    await expect(narrate(core, meta)).resolves.toBeNull();
  });
});
