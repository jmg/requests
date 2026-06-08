import { describe, it, expect } from "vitest";
import { currentTier, nextTier, tierMultiplier, DEFAULT_TIERS } from "@/lib/tiers";

const tiers = DEFAULT_TIERS.map((t, i) => ({ id: String(i), ...t }));

describe("currentTier", () => {
  it("returns null when there are no tiers", () => {
    expect(currentTier([], 9999)).toBeNull();
  });

  it("returns the highest tier whose threshold is reached", () => {
    expect(currentTier(tiers, 0)?.name).toBe("Bronce");
    expect(currentTier(tiers, 999)?.name).toBe("Bronce");
    expect(currentTier(tiers, 1000)?.name).toBe("Plata");
    expect(currentTier(tiers, 4999)?.name).toBe("Plata");
    expect(currentTier(tiers, 5000)?.name).toBe("Oro");
    expect(currentTier(tiers, 999999)?.name).toBe("Oro");
  });

  it("is order-independent", () => {
    const shuffled = [...tiers].reverse();
    expect(currentTier(shuffled, 1500)?.name).toBe("Plata");
  });
});

describe("nextTier", () => {
  it("points to the next threshold up", () => {
    expect(nextTier(tiers, 0)?.name).toBe("Plata");
    expect(nextTier(tiers, 1000)?.name).toBe("Oro");
  });

  it("returns null at the top tier", () => {
    expect(nextTier(tiers, 5000)).toBeNull();
  });
});

describe("tierMultiplier", () => {
  it("defaults to 1 without tiers", () => {
    expect(tierMultiplier([], 5000)).toBe(1);
  });

  it("uses the current tier's multiplier", () => {
    expect(tierMultiplier(tiers, 0)).toBe(1);
    expect(tierMultiplier(tiers, 1000)).toBe(1.2);
    expect(tierMultiplier(tiers, 5000)).toBe(1.5);
  });
});
