import { randomUUID } from "node:crypto";
import { VERSION } from "./version.js";
import type { Config } from "./config.js";
import type { SendNotificationInput } from "./schema.js";

export interface SendResult {
  status: number;
  body: SendSuccessBody | SendErrorBody;
}

export interface SendSuccessBody {
  message_id: string;
  status: "queued" | "delivered" | "failed" | "no_target";
  created_at: string;
}

export interface SendErrorBody {
  error: string;
  message: string;
  doc_url?: string;
}

const USER_AGENT = `rcvd-mcp/${VERSION}`;

export async function sendNotification(
  cfg: Config,
  input: SendNotificationInput,
): Promise<SendResult> {
  // A fresh UUIDv4 per call (spec: generate Idempotency-Key per call). The agent
  // retries the *tool* call; the server's 24h idempotency window keeps that safe.
  const idempotencyKey = randomUUID();

  let response: Response;
  try {
    response = await fetch(`${cfg.apiBase}/v1/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch (e) {
    // The backend was unreachable (DNS, connection refused, TLS, timeout). Surface
    // it as a synthetic 5xx so the handler maps it to a retryable error rather than
    // throwing a fatal out of the tool call.
    const detail = e instanceof Error ? e.message : String(e);
    return {
      status: 503,
      body: {
        error: "network_error",
        message: `Could not reach the rcvd API at ${cfg.apiBase}: ${detail}`,
      },
    };
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    // Server returned a non-JSON body. Wrap it so the caller always has a body.
    parsed = {
      error: "non_json_response",
      message: `Server returned ${response.status} with non-JSON body: ${text.slice(0, 200)}`,
    };
  }

  return {
    status: response.status,
    body: parsed as SendSuccessBody | SendErrorBody,
  };
}
