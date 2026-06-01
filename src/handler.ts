import type { SendResult, SendErrorBody, SendSuccessBody } from "./client.js";

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpToolResponse {
  content: McpTextContent[];
  isError?: boolean;
}

function isErrorBody(body: SendSuccessBody | SendErrorBody): body is SendErrorBody {
  return "error" in body && typeof body.error === "string";
}

export function resultToMcpResponse(result: SendResult): McpToolResponse {
  const { status, body } = result;

  // Success: 200 (idempotent replay) and 202 (fresh accept).
  if (status === 200 || status === 202) {
    return {
      content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    };
  }

  // Everything else is an error from the agent's perspective. Surface the API's
  // body verbatim — do not paraphrase its `error` code or `message`.
  const errorBody: SendErrorBody = isErrorBody(body)
    ? body
    : {
        error: "unknown_error",
        message: `Unexpected response with status ${status} and no error body.`,
      };

  const lines: string[] = [`error: ${errorBody.error}`, `message: ${errorBody.message}`];
  if (errorBody.doc_url) {
    lines.push(`doc_url: ${errorBody.doc_url}`);
  }
  lines.push(`http_status: ${status}`);

  // 429 and 5xx are retryable with the same Idempotency-Key (spec §5.1). The MCP
  // mints the key, so a retry happens at the agent level (re-invoking the tool);
  // the server's 24h window means that still won't double-deliver.
  if (status >= 500 || status === 429) {
    lines.push("");
    lines.push(
      "This is a retryable error. The agent's host may retry by invoking the tool again; the server's idempotency window (24h) means a duplicate Idempotency-Key would not double-deliver.",
    );
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
    isError: true,
  };
}
