# Contributing to @rcvd/mcp

Thanks for your interest. This is a deliberately tiny project — one MCP tool, a thin HTTP client, no business logic. Keeping it small is a feature, so contributions that *remove* surface area are as welcome as ones that add it.

## Development setup

Requires Node.js >= 20.

```bash
git clone https://github.com/iliaonishchenko/rcvd-mcp.git
cd rcvd-mcp
npm install
```

We use plain `npm` — no pnpm/yarn. The lockfile is `package-lock.json`.

## The loop

```bash
npm test         # run the unit + integration suite (vitest)
npm run test:watch
npm run lint     # eslint (flat config, type-checked)
npm run typecheck
npm run build    # emit dist/ via tsc
```

CI runs lint, typecheck, test, and build on Node 20 and 22. All four must pass.

## Tests

This project is test-driven. Write the failing test first, then the code. There is no live network in the suite — HTTP is mocked with [msw](https://mswjs.io). The optional end-to-end test (`tests/e2e.test.ts`) is gated behind `RCVD_MCP_E2E=1` and needs a running backend; it is skipped by default.

## The one rule that matters: AF5

The agent must pick `send_notification` **unprompted**. Its `name`, `description`, and per-parameter docs in `src/tool.ts` are the only thing standing between "the agent reaches for it on its own" and "the user has to nag it." When changing that copy:

- Don't advertise rcvd by name — the agent doesn't care about branding.
- Don't write imperatives ("always notify when…") — describe *situations*, let the agent reason.
- Don't suggest users add a system-prompt nudge. If the agent doesn't pick the tool, the description is the bug.

The tests in `tests/tool.test.ts` codify these as assertions. If you disagree with one, you have to consciously change the test.

## Pull requests

- Branch off `main`; open a PR against `main`.
- Keep PRs focused. One concern per PR.
- Make sure `npm run lint && npm run typecheck && npm test && npm run build` is green locally before pushing.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
