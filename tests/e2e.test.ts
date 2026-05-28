import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";
import { buildServer } from "../src/server.js";

// Gated: only runs when RCVD_MCP_E2E=1. Requires a reachable backend
// (RCVD_API_BASE, default https://api.rcvd.cc) and a valid RCVD_API_KEY with the
// 'send' scope. Skipped in CI — it needs external state (backend + Telegram chat).
const E2E = process.env.RCVD_MCP_E2E === "1";

describe.skipIf(!E2E)("e2e against a live backend", () => {
  it("send_notification reaches the backend and is accepted", async () => {
    const cfg = loadConfig(process.env);
    const handle = buildServer(cfg);

    const result = await handle.callTool("send_notification", {
      text: `e2e test ${new Date().toISOString()}`,
      priority: "info",
    });

    expect(result.isError).toBeFalsy();
    const body = JSON.parse(result.content[0]!.text) as { message_id: string; status: string };
    expect(body.message_id).toMatch(/^msg_/);
    // 'no_target' is still a pass: the API accepted it; the test user may have no
    // linked channel. The MCP's job ends at acceptance, not delivery.
    expect(["queued", "delivered", "no_target"]).toContain(body.status);
  });

  it("invalid API key surfaces unauthorized verbatim", async () => {
    const handle = buildServer({
      apiKey: "rcvd_live_definitely_not_real",
      apiBase: process.env.RCVD_API_BASE ?? "https://api.rcvd.cc",
    });
    const result = await handle.callTool("send_notification", { text: "x" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("unauthorized");
  });
});
