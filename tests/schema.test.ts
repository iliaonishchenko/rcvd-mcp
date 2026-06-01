import { describe, it, expect } from "vitest";
import { sendNotificationInputSchema, type SendNotificationInput } from "../src/schema.js";

describe("sendNotificationInputSchema", () => {
  it("accepts the minimum valid payload (text only)", () => {
    const parsed = sendNotificationInputSchema.parse({ text: "Build finished." });
    expect(parsed.text).toBe("Build finished.");
    expect(parsed.priority).toBeUndefined();
  });

  it("accepts all optional fields", () => {
    const input: SendNotificationInput = {
      text: "127 tests passed, 3 failed.",
      priority: "needs_attention",
      title: "CI: my-repo",
      channels: ["telegram"],
      metadata: { run_id: "abc", failures: 3 },
    };
    const parsed = sendNotificationInputSchema.parse(input);
    expect(parsed).toEqual(input);
  });

  it("rejects empty text", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "" })).toThrow();
  });

  it("rejects text over 4096 chars", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "x".repeat(4097) })).toThrow();
  });

  it("rejects unknown priority", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "hi", priority: "urgent" })).toThrow();
  });

  it("accepts every valid priority", () => {
    for (const p of ["info", "normal", "needs_attention", "done"] as const) {
      expect(sendNotificationInputSchema.parse({ text: "hi", priority: p }).priority).toBe(p);
    }
  });

  it("rejects title over 100 chars", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "hi", title: "x".repeat(101) })).toThrow();
  });

  it("rejects empty title (backend requires 1..100 when present)", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "hi", title: "" })).toThrow();
  });

  it("rejects empty channels array", () => {
    expect(() => sendNotificationInputSchema.parse({ text: "hi", channels: [] })).toThrow();
  });

  it("rejects unknown extra top-level keys", () => {
    expect(() =>
      sendNotificationInputSchema.parse({ text: "hi", urgency: 5 }),
    ).toThrow();
  });
});
