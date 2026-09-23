import { describe, expect, it } from "vitest";
import { envSchema } from "../../src/config/env";

describe("env schema", () => {
  it("accepts a valid environment and applies defaults", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgresql://localhost/db",
      SESSION_SECRET: "secret",
    });
    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe("development");
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => envSchema.parse({ SESSION_SECRET: "secret" })).toThrow();
  });
});
