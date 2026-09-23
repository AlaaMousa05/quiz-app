import { describe, expect, it } from "vitest";
import { en } from "./en.js";
import { ar } from "./ar.js";

describe("i18n key parity", () => {
  it("has exactly the same keys in en and ar", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it("has a non-empty string for every key in both dictionaries", () => {
    for (const key of Object.keys(en)) {
      expect(en[key as keyof typeof en].length).toBeGreaterThan(0);
      expect(ar[key as keyof typeof ar].length).toBeGreaterThan(0);
    }
  });
});
