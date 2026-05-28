import { describe, it, expect } from "vitest";
import { VERSION } from "../src/version.js";

describe("VERSION", () => {
  it("matches the package.json version", async () => {
    const pkg = await import("../package.json", { with: { type: "json" } });
    expect(VERSION).toBe((pkg as unknown as { default: { version: string } }).default.version);
  });

  it("is a semver string", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });
});
