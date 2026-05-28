# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately via [GitHub's private vulnerability reporting](https://github.com/iliaonishchenko/rcvd-mcp/security/advisories/new), or email **security@rcvd.cc**. We aim to acknowledge within 72 hours.

## Scope

This package is a thin client. It reads your `RCVD_API_KEY` from the environment and forwards notification payloads to the rcvd API over HTTPS. Things worth reporting:

- The API key being logged, written to disk, or sent anywhere other than the configured `RCVD_API_BASE`.
- `RCVD_API_BASE` accepting a value that lets the key leak to an unintended host.
- Any dependency advisory affecting the shipped `dist/` output (not dev-only tooling).

Vulnerabilities in the rcvd **API** itself (`api.rcvd.cc`) belong to the backend, not this repo — but if you're unsure, report it here and we'll route it.

## Handling your API key

This server never persists or transmits your key anywhere except as a `Bearer` token to the API base URL you configure. Treat the key like a password: scope it, rotate it via `@RcvdBot` if exposed, and never commit it. Keys belong in your MCP host's `env` block, not in source control.
