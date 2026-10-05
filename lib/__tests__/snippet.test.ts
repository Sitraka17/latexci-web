import { describe, expect, it } from "vitest";
import { clampDescription } from "@/lib/snippet";

describe("clampDescription", () => {
  it("keeps short text", () => {
    expect(clampDescription("Short. Text.")).toBe("Short. Text.");
  });
  it("drops whole trailing sentences", () => {
    const s = "A".repeat(100) + ". " + "B".repeat(40) + ". " + "C".repeat(40) + ".";
    expect(clampDescription(s)).toBe("A".repeat(100) + ". " + "B".repeat(40) + ".");
  });
  it("cuts a single long sentence at a word", () => {
    const out = clampDescription(Array(60).fill("word").join(" "));
    expect(out.length).toBeLessThanOrEqual(158);
    expect(out.endsWith("word…")).toBe(true);
  });
  it("does not split on decimals or commands like \\cdot", () => {
    const s = "Type \\cdot for a centred dot (·) in LaTeX, no package needed. " + "x".repeat(120) + ".";
    expect(clampDescription(s)).toBe("Type \\cdot for a centred dot (·) in LaTeX, no package needed.");
  });
});
