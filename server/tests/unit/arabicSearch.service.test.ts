import { describe, expect, it } from "vitest";
import { normalizeArabicName } from "shared";
import { matchesNameQuery } from "../../src/services/arabicSearch.service.js";

describe("search.spec: Arabic name search ignores diacritics and normalizes alef variants", () => {
  it("normalizes diacritics and alef variants to the same key", () => {
    // "Ahmad" written with tashkeel and with a bare alef should normalize identically.
    expect(normalizeArabicName("أَحْمَد")).toBe(normalizeArabicName("احمد"));
    // The three alef-hamza variants unify to the bare alef.
    expect(normalizeArabicName("آدم")).toBe(normalizeArabicName("ادم"));
    expect(normalizeArabicName("إيمان")).toBe(normalizeArabicName("ايمان"));
  });

  it("maps trailing teh marbuta to heh so both spellings match", () => {
    expect(normalizeArabicName("فاطمة")).toBe(normalizeArabicName("فاطمه"));
  });

  it("is case-insensitive for Latin names", () => {
    expect(normalizeArabicName("Sarah")).toBe(normalizeArabicName("sarah"));
  });

  it("matchesNameQuery finds a normalized substring match regardless of diacritics", () => {
    expect(matchesNameQuery("أَحْمَد خالد", "احمد")).toBe(true);
    expect(matchesNameQuery("أَحْمَد خالد", "خالد")).toBe(true);
    expect(matchesNameQuery("أَحْمَد خالد", "سارة")).toBe(false);
  });
});
