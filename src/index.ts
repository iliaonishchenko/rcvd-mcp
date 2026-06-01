#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { loadConfig, ConfigError } from "./config.js";
import { buildServer } from "./server.js";
import { VERSION } from "./version.js";

async function main(): Promise<void> {
  let cfg;
  try {
    cfg = loadConfig(process.env);
  } catch (e) {
    if (e instanceof ConfigError) {
      process.stderr.write(`rcvd-mcp: ${e.message}\n`);
      process.exit(1);
    }
    throw e;
  }

  const handle = buildServer(cfg);

  const server = new Server(
    { name: "rcvd", version: VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: handle.listTools().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req): Promise<CallToolResult> => {
    const name = req.params.name;
    const args = req.params.arguments ?? {};
    // Our McpToolResponse is a faithful subset of the SDK's CallToolResult; the
    // cast bridges the SDK's looser index-signature shape at this boundary only.
    return (await handle.callTool(name, args)) as CallToolResult;
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`rcvd-mcp ${VERSION} ready (api: ${cfg.apiBase})\n`);
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`rcvd-mcp fatal: ${msg}\n`);
  process.exit(1);
});
