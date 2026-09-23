import { describe, expect, it } from "vitest";
import { normalizeArabicName } from "./index.js";

describe("shared workspace smoke test", () => {
  it("exports normalizeArabicName", () => {
    expect(normalizeArabicName("test")).toBe("test");
  });
});
