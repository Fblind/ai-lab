# Engineering standards

Canonical coding standards for every AI coding agent. Edit this file; do not fork it per tool. `scripts/sync-agent-rules.mjs` projects it (plus `AGENTS.md`) into the files each tool reads (`CLAUDE.md`, `.cursorrules`).

## Stack
- Primary: Node.js and JavaScript.
- TypeScript when the repository already uses it; do not convert a JS repo to TS unless asked.
- Prefer the project's existing framework, test runner, and package manager.

## Style
- Re-use the code that is already in place. Always make the smallest change. Do not reinvent the wheel. Extend an existing helper before adding a new one.
- Follow the repo's formatter and linter (Prettier / ESLint). Do not fight them.
- Prefer clear names over abbreviations.
- Keep functions small; extract when a block needs its own name or tests.
- A new feature or a complex bugfix inside a large, coupled module does not grow that function. Isolate it with the gated seam in `core/rules/gated-seam.mdc`: one insertion point, the repo's feature flag, a new module with explicit inputs and outputs, and the existing code applies the result.
- Handle errors explicitly at boundaries (HTTP, queue, filesystem). Do not swallow errors silently.
- Async: prefer `async`/`await`; avoid mixing raw promise chains without reason.

## APIs and data
- Validate untrusted input at the edge.
- Do not log secrets, tokens, or full PII.
- Prefer idempotent writes where retries are likely.
- Document non-obvious invariants in code comments sparingly; put lasting decisions in short ADRs when the choice is cross-cutting.

## Testing
- Add or update tests for behavior changes.
- Prefer focused unit tests for pure logic; integration tests for boundaries.
- Do not skip failing tests to "make CI green" without calling that out.

## Git and review
- Small, purposeful commits.
- PR description: what / why / how to test.
- No force-push to shared default branches.
- Do not merge without an explicit ask.

## Security
- No hardcoded credentials.
- Dependency changes: prefer known packages; call out new network or filesystem permissions.
- Treat prompt or user-supplied text as untrusted when it could become code or shell input.

## Tooling guardrails
- Markdown rules guide agents; ESLint, typecheck, and CI enforce them.
- If a tool requires `CLAUDE.md`, `.cursorrules`, or similar, generate it from `AGENTS.md` / this file — never maintain a second hand-written source of truth.
