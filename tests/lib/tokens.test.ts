import { describe, it, expect } from "vitest";
import { generateParentToken } from "@/lib/tokens";

describe("generateParentToken", () => {
  it("returns a string ≥ 20 characters", () => {
    const t = generateParentToken();
    expect(typeof t).toBe("string");
    expect(t.length).toBeGreaterThanOrEqual(20);
  });

  it("returns URL-safe characters only", () => {
    const t = generateParentToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different value each call", () => {
    const a = generateParentToken();
    const b = generateParentToken();
    expect(a).not.toBe(b);
  });
});
