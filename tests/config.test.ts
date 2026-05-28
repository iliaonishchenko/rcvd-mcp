import { describe, it, expect } from "vitest";
import { loadConfig, ConfigError } from "../src/config.js";

describe("loadConfig", () => {
  it("reads RCVD_API_KEY and defaults RCVD_API_BASE to https://api.rcvd.cc", () => {
    const cfg = loadConfig({ RCVD_API_KEY: "rcvd_live_abc" });
    expect(cfg.apiKey).toBe("rcvd_live_abc");
    expect(cfg.apiBase).toBe("https://api.rcvd.cc");
  });

  it("uses RCVD_API_BASE override when present", () => {
    const cfg = loadConfig({
      RCVD_API_KEY: "rcvd_live_abc",
      RCVD_API_BASE: "http://localhost:8080",
    });
    expect(cfg.apiBase).toBe("http://localhost:8080");
  });

  it("strips trailing slash from RCVD_API_BASE", () => {
    const cfg = loadConfig({
      RCVD_API_KEY: "rcvd_live_abc",
      RCVD_API_BASE: "http://localhost:8080/",
    });
    expect(cfg.apiBase).toBe("http://localhost:8080");
  });

  it("throws ConfigError with a clear message when RCVD_API_KEY is missing", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    try {
      loadConfig({});
    } catch (e) {
      expect((e as Error).message).toContain("RCVD_API_KEY");
      expect((e as Error).message).toContain("RcvdBot");
    }
  });

  it("throws when RCVD_API_KEY is empty string", () => {
    expect(() => loadConfig({ RCVD_API_KEY: "" })).toThrow(ConfigError);
  });

  it("rejects malformed RCVD_API_BASE", () => {
    expect(() =>
      loadConfig({ RCVD_API_KEY: "rcvd_live_abc", RCVD_API_BASE: "not a url" }),
    ).toThrow(ConfigError);
  });
});
