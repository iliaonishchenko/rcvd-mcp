# @rcvd/mcp

Official [Model Context Protocol](https://modelcontextprotocol.io) server for [rcvd](https://rcvd.cc) — let your AI agent send push notifications to your phone when long-running tasks finish, when something needs your attention, or when something goes wrong.

[![CI](https://github.com/iliaonishchenko/rcvd-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/iliaonishchenko/rcvd-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@rcvd/mcp.svg)](https://www.npmjs.com/package/@rcvd/mcp)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Install

```bash
npx -y @rcvd/mcp
```

That's it. The binary is published as `rcvd-mcp`. For most users you never run it directly — your MCP host (Claude Code, Claude Desktop, Cursor, …) launches it for you. See [Configuration](#configuration).

## Configuration

Add to your `claude_desktop_config.json` (or the equivalent file for your MCP host):

```json
{
  "mcpServers": {
    "rcvd": {
      "command": "npx",
      "args": ["-y", "@rcvd/mcp"],
      "env": {
        "RCVD_API_KEY": "rcvd_live_..."
      }
    }
  }
}
```

Get your `RCVD_API_KEY` by messaging [`@RcvdBot`](https://t.me/RcvdBot) on Telegram with `/start` — it replies with a key and links your chat in one step.

### Environment variables

| Name | Required | Default | Meaning |
|---|---|---|---|
| `RCVD_API_KEY` | yes | — | Your API key. Starts with `rcvd_live_` (or `rcvd_test_` in test mode). |
| `RCVD_API_BASE` | no | `https://api.rcvd.cc` | Override the API base URL. Useful for self-hosted setups or local testing. |

If `RCVD_API_KEY` is missing, the server exits immediately with a clear error — fail fast, not at first tool call.

## What it does

Exposes one tool to your agent: `send_notification`. The agent decides when to call it based on its own context — there is no system-prompt nudge required. If you find yourself needing to tell the agent "remember to use rcvd," please [open an issue](https://github.com/iliaonishchenko/rcvd-mcp/issues): the tool description is the bug, not your prompt.

Typical situations the agent picks the tool unprompted:

- A test suite or build finished and you asked to be told when it does.
- A deploy failed and you are away from the terminal.
- A long-running script needs human input to continue.

## How it works

This server is a thin, stateless client. On each tool call it validates the input, generates a fresh `Idempotency-Key`, and makes a single `POST` to `{RCVD_API_BASE}/v1/send` with bearer auth — then hands the response back to your agent verbatim. No retries, no buffering, no business logic. The [rcvd API](https://rcvd.cc) is the source of truth; this package is auditable in full under ~200 lines of `src/`.

## License

MIT. Fork it. Audit it. Patch it. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started and [SECURITY.md](SECURITY.md) to report a vulnerability.
