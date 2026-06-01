import { describe, it, expect } from "vitest";
import { sendNotificationTool } from "../src/tool.js";

describe("sendNotificationTool", () => {
  it("has the name 'send_notification'", () => {
    expect(sendNotificationTool.name).toBe("send_notification");
  });

  it("has a non-trivial description (>= 200 chars)", () => {
    expect(sendNotificationTool.description.length).toBeGreaterThanOrEqual(200);
  });

  it("description mentions out-of-band delivery", () => {
    expect(sendNotificationTool.description.toLowerCase()).toMatch(/out-of-band|away from|phone|push/);
  });

  it("description does NOT instruct the host to add system-prompt nudges", () => {
    const lc = sendNotificationTool.description.toLowerCase();
    expect(lc).not.toMatch(/system prompt/);
    expect(lc).not.toMatch(/remember to/);
  });

  it("inputSchema is a JSON Schema object with required: ['text']", () => {
    expect(sendNotificationTool.inputSchema.type).toBe("object");
    expect(sendNotificationTool.inputSchema.required).toEqual(["text"]);
  });

  it("priority property has descriptions for each enum value", () => {
    const prio = sendNotificationTool.inputSchema.properties.priority;
    expect(prio).toBeDefined();
    const desc = (prio?.description ?? "").toLowerCase();
    for (const v of ["info", "normal", "needs_attention", "done"]) {
      expect(desc).toContain(v);
    }
  });

  it("does not advertise rcvd by name in the description", () => {
    expect(sendNotificationTool.description.toLowerCase()).not.toContain("rcvd");
  });

  it("text/title/channels carry the same bounds as the Zod schema", () => {
    const props = sendNotificationTool.inputSchema.properties;
    expect(props.text?.maxLength).toBe(4096);
    expect(props.text?.minLength).toBe(1);
    expect(props.title?.maxLength).toBe(100);
    expect(props.channels?.minItems).toBe(1);
  });
});
