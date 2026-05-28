import { describe, it, expect } from "vitest";
import { resultToMcpResponse } from "../src/handler.js";
import type { SendResult } from "../src/client.js";

describe("resultToMcpResponse", () => {
  it("maps 202 to success with the success body in content", () => {
    const r: SendResult = {
      status: 202,
      body: { message_id: "msg_01", status: "queued", created_at: "2026-05-15T10:00:00Z" },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBeFalsy();
    expect(mcp.content[0]!.type).toBe("text");
    expect(mcp.content[0]!.text).toContain("msg_01");
    expect(mcp.content[0]!.text).toContain("queued");
  });

  it("maps 200 (idempotent replay) to success", () => {
    const r: SendResult = {
      status: 200,
      body: { message_id: "msg_01", status: "delivered", created_at: "2026-05-15T10:00:00Z" },
    };
    expect(resultToMcpResponse(r).isError).toBeFalsy();
  });

  it("maps 400 to isError with verbatim API error body", () => {
    const r: SendResult = {
      status: 400,
      body: {
        error: "missing_idempotency_key",
        message: "Idempotency-Key header is required on POST /v1/send.",
        doc_url: "https://docs.rcvd.cc/errors#missing_idempotency_key",
      },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBe(true);
    const text = mcp.content[0]!.text;
    expect(text).toContain("missing_idempotency_key");
    expect(text).toContain("Idempotency-Key header is required");
    expect(text).toContain("https://docs.rcvd.cc/errors#missing_idempotency_key");
  });

  it("maps 401 to isError without paraphrasing", () => {
    const r: SendResult = {
      status: 401,
      body: { error: "unauthorized", message: "Invalid or missing API key.", doc_url: "https://docs.rcvd.cc/errors#unauthorized" },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBe(true);
    expect(mcp.content[0]!.text).toContain("unauthorized");
    expect(mcp.content[0]!.text).toContain("Invalid or missing API key.");
  });

  it("maps 429 to isError and includes the retry-safety hint", () => {
    const r: SendResult = {
      status: 429,
      body: { error: "rate_limited", message: "Slow down.", doc_url: "https://docs.rcvd.cc/errors#rate_limited" },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBe(true);
    expect(mcp.content[0]!.text.toLowerCase()).toContain("retry");
  });

  it("maps 5xx to isError with retry-safety hint and Idempotency-Key mention", () => {
    const r: SendResult = {
      status: 503,
      body: { error: "upstream_unavailable", message: "Upstream is down.", doc_url: "https://docs.rcvd.cc/errors#upstream_unavailable" },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBe(true);
    expect(mcp.content[0]!.text).toContain("upstream_unavailable");
    expect(mcp.content[0]!.text.toLowerCase()).toContain("retry");
    expect(mcp.content[0]!.text).toContain("Idempotency-Key");
  });

  it("synthesizes an error body when an error status carries no error shape", () => {
    const r: SendResult = {
      status: 418,
      body: { message_id: "x", status: "queued", created_at: "t" },
    };
    const mcp = resultToMcpResponse(r);
    expect(mcp.isError).toBe(true);
    expect(mcp.content[0]!.text).toContain("unknown_error");
    expect(mcp.content[0]!.text).toContain("418");
  });
});
