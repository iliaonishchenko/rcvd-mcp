import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer as setupHttpMock } from "msw/node";
import { http, HttpResponse } from "msw";
import { buildServer } from "../src/server.js";

const httpMock = setupHttpMock();
beforeAll(() => httpMock.listen({ onUnhandledRequest: "error" }));
afterAll(() => httpMock.close());
beforeEach(() => httpMock.resetHandlers());

describe("buildServer", () => {
  it("registers exactly one tool named 'send_notification'", () => {
    const { listTools } = buildServer({ apiKey: "k", apiBase: "https://api.rcvd.cc" });
    const tools = listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe("send_notification");
  });

  it("invoking the tool forwards to the API and returns success content", async () => {
    httpMock.use(
      http.post("https://api.rcvd.cc/v1/send", () =>
        HttpResponse.json(
          { message_id: "msg_42", status: "queued", created_at: "2026-05-15T10:00:00Z" },
          { status: 202 },
        ),
      ),
    );
    const { callTool } = buildServer({ apiKey: "k", apiBase: "https://api.rcvd.cc" });
    const result = await callTool("send_notification", { text: "hi" });
    expect(result.isError).toBeFalsy();
    expect(result.content[0]!.text).toContain("msg_42");
  });

  it("rejects unknown tool names", async () => {
    const { callTool } = buildServer({ apiKey: "k", apiBase: "https://api.rcvd.cc" });
    await expect(callTool("get_recent_notifications", {})).rejects.toThrow(/unknown tool/i);
  });

  it("returns isError when input fails Zod validation", async () => {
    const { callTool } = buildServer({ apiKey: "k", apiBase: "https://api.rcvd.cc" });
    const result = await callTool("send_notification", { text: "" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text.toLowerCase()).toMatch(/invalid|empty|text/);
  });

  it("returns isError verbatim from API on 400", async () => {
    httpMock.use(
      http.post("https://api.rcvd.cc/v1/send", () =>
        HttpResponse.json(
          {
            error: "invalid_payload",
            message: "metadata exceeds 4KB",
            doc_url: "https://docs.rcvd.cc/errors#invalid_payload",
          },
          { status: 400 },
        ),
      ),
    );
    const { callTool } = buildServer({ apiKey: "k", apiBase: "https://api.rcvd.cc" });
    const result = await callTool("send_notification", { text: "x" });
    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("invalid_payload");
    expect(result.content[0]!.text).toContain("metadata exceeds 4KB");
  });
});
