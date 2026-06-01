import type { Config } from "./config.js";
import { sendNotificationTool, type ToolDefinition } from "./tool.js";
import { sendNotificationInputSchema } from "./schema.js";
import { sendNotification } from "./client.js";
import { resultToMcpResponse, type McpToolResponse } from "./handler.js";

export interface ServerHandle {
  listTools: () => ToolDefinition[];
  callTool: (name: string, rawInput: unknown) => Promise<McpToolResponse>;
}

// Pure, transport-agnostic dispatch core. The stdio wiring in index.ts is a thin
// adapter over this; tests drive listTools/callTool directly without stdio.
export function buildServer(cfg: Config): ServerHandle {
  const tools: ToolDefinition[] = [sendNotificationTool];

  const listTools = (): ToolDefinition[] => tools;

  const callTool = async (name: string, rawInput: unknown): Promise<McpToolResponse> => {
    if (name !== sendNotificationTool.name) {
      throw new Error(`unknown tool: ${name}`);
    }

    const parsed = sendNotificationInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      );
      return {
        content: [
          {
            type: "text",
            text: `error: invalid_payload\nmessage: Tool input failed validation.\n${issues.join("\n")}`,
          },
        ],
        isError: true,
      };
    }

    const result = await sendNotification(cfg, parsed.data);
    return resultToMcpResponse(result);
  };

  return { listTools, callTool };
}
