import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { sendNotification } from "../src/client.js";

const RECORDED: Array<{
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}> = [];

function okHandler() {
  return http.post("https://api.rcvd.cc/v1/send", async ({ request }) => {
    RECORDED.push({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.json(),
    });
    return HttpResponse.json(
      { message_id: "msg_01HG", status: "queued", created_at: "2026-05-15T10:00:00Z" },
      { status: 202 },
    );
  });
}

const server = setupServer(okHandler());

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  RECORDED.length = 0;
  server.resetHandlers(okHandler());
});

describe("sendNotification", () => {
  it("POSTs to {apiBase}/v1/send with bearer auth and a UUIDv4 idempotency key", async () => {
    const result = await sendNotification(
      { apiKey: "rcvd_live_abc", apiBase: "https://api.rcvd.cc" },
      { text: "Build finished." },
    );

    expect(result.status).toBe(202);
    expect(result.body).toEqual({
      message_id: "msg_01HG",
      status: "queued",
      created_at: "2026-05-15T10:00:00Z",
    });

    expect(RECORDED).toHaveLength(1);
    const r = RECORDED[0]!;
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.rcvd.cc/v1/send");
    expect(r.headers.authorization).toBe("Bearer rcvd_live_abc");
    expect(r.headers["content-type"]).toMatch(/^application\/json/);
    expect(r.headers["idempotency-key"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(r.headers["user-agent"]).toMatch(/^rcvd-mcp\//);
    expect(r.body).toEqual({ text: "Build finished." });
  });

  it("generates a fresh idempotency key on every call", async () => {
    await sendNotification({ apiKey: "k", apiBase: "https://api.rcvd.cc" }, { text: "a" });
    await sendNotification({ apiKey: "k", apiBase: "https://api.rcvd.cc" }, { text: "b" });
    expect(RECORDED).toHaveLength(2);
    expect(RECORDED[0]!.headers["idempotency-key"]).not.toBe(RECORDED[1]!.headers["idempotency-key"]);
  });

  it("forwards optional fields verbatim", async () => {
    await sendNotification(
      { apiKey: "k", apiBase: "https://api.rcvd.cc" },
      { text: "x", priority: "done", title: "t", channels: ["telegram"], metadata: { k: "v" } },
    );
    expect(RECORDED[0]!.body).toEqual({
      text: "x",
      priority: "done",
      title: "t",
      channels: ["telegram"],
      metadata: { k: "v" },
    });
  });

  it("uses the apiBase override when configured", async () => {
    server.resetHandlers(
      http.post("http://localhost:8080/v1/send", () =>
        HttpResponse.json(
          { message_id: "msg_local", status: "queued", created_at: "2026-05-15T10:00:00Z" },
          { status: 202 },
        ),
      ),
    );
    const result = await sendNotification(
      { apiKey: "k", apiBase: "http://localhost:8080" },
      { text: "hi" },
    );
    expect(result.status).toBe(202);
    expect((result.body as { message_id: string }).message_id).toBe("msg_local");
  });

  it("wraps a non-JSON response body in a synthetic error", async () => {
    server.resetHandlers(
      http.post("https://api.rcvd.cc/v1/send", () =>
        HttpResponse.text("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    );
    const result = await sendNotification({ apiKey: "k", apiBase: "https://api.rcvd.cc" }, { text: "x" });
    expect(result.status).toBe(502);
    expect((result.body as { error: string }).error).toBe("non_json_response");
  });

  it("surfaces a network failure as a retryable synthetic 503", async () => {
    server.resetHandlers(
      http.post("https://api.rcvd.cc/v1/send", () => HttpResponse.error()),
    );
    const result = await sendNotification({ apiKey: "k", apiBase: "https://api.rcvd.cc" }, { text: "x" });
    expect(result.status).toBe(503);
    expect((result.body as { error: string }).error).toBe("network_error");
  });
});
