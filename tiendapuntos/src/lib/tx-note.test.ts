import { describe, it, expect } from "vitest";
import { encodeNote, decodeNote, renderNote } from "@/lib/tx-note";

describe("encode/decode note", () => {
  it("encodes a key without value", () => {
    expect(encodeNote("birthdayBonus")).toBe("@@birthdayBonus");
    expect(decodeNote("@@birthdayBonus")).toEqual({ key: "birthdayBonus", value: undefined });
  });

  it("round-trips a key with value", () => {
    const enc = encodeNote("redeem", "Café gratis");
    expect(decodeNote(enc)).toEqual({ key: "redeem", value: "Café gratis" });
  });

  it("keeps a value that itself contains the separator", () => {
    const enc = encodeNote("redeem", "2x1 | promo");
    expect(decodeNote(enc)).toEqual({ key: "redeem", value: "2x1 | promo" });
  });

  it("treats user-written notes (no prefix) as plain text", () => {
    expect(decodeNote("compra en mostrador")).toBeNull();
  });
});

describe("renderNote", () => {
  const t = (key: string, values?: Record<string, string>) =>
    values?.value ? `${key}:${values.value}` : key;

  it("returns null for empty notes", () => {
    expect(renderNote(null, t)).toBeNull();
    expect(renderNote("", t)).toBeNull();
  });

  it("passes through user notes unchanged", () => {
    expect(renderNote("nota libre", t)).toBe("nota libre");
  });

  it("translates system notes via the translator", () => {
    expect(renderNote(encodeNote("birthdayBonus"), t)).toBe("birthdayBonus");
    expect(renderNote(encodeNote("redeem", "Café"), t)).toBe("redeem:Café");
  });
});
