import { describe, it, expect } from "vitest";
import { slugify, generateReferralCode, intlLocale, formatNumber } from "@/lib/utils";
import { isSegment, SEGMENTS } from "@/lib/segments-shared";
import { planConfig } from "@/lib/plans";
import { expiryDate } from "@/lib/expire";

describe("slugify", () => {
  it("lowercases, strips accents and spaces", () => {
    expect(slugify("Café Central")).toBe("cafe-central");
    expect(slugify("  Múltiples   Espacios  ")).toBe("multiples-espacios");
  });
  it("drops symbols and trims dashes", () => {
    expect(slugify("¡Hola! / Mundo")).toBe("hola-mundo");
  });
});

describe("generateReferralCode", () => {
  it("is 6 chars from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });
});

describe("intlLocale / formatNumber", () => {
  it("maps app locales to BCP-47", () => {
    expect(intlLocale("en")).toBe("en-US");
    expect(intlLocale("es")).toBe("es-AR");
    expect(intlLocale(undefined)).toBe("es-AR");
  });
  it("formats numbers per locale", () => {
    expect(formatNumber(1000, "en")).toBe("1,000");
    expect(formatNumber(1000, "es")).toBe("1.000");
  });
});

describe("segments", () => {
  it("recognizes valid segments", () => {
    for (const s of SEGMENTS) expect(isSegment(s)).toBe(true);
    expect(isSegment("NOPE")).toBe(false);
  });
});

describe("plans", () => {
  it("FREE has limits and PRO is unlimited", () => {
    expect(planConfig("FREE").customerLimit).toBe(50);
    expect(planConfig("PRO").customerLimit).toBeNull();
    expect(planConfig("PRO").rewardLimit).toBeNull();
  });
});

describe("expiryDate", () => {
  it("adds the configured days to the last activity", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    expect(expiryDate(last, 30).toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });
});
