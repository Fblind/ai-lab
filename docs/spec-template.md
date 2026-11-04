# Spec template

Copy this file to `<docs_root>/<ticket_id>-Workflow/spec-<feature>.md` (or `<docs_root>/specs/spec-<feature>.md`) and fill it in. The `spec-from-input` skill does this for you. The `execute-spec-task` skill implements one task at a time from the result.

A good spec is small enough to read in two minutes and concrete enough that an agent with a fresh context can execute any single task without asking.

---

# Spec: <feature name>

## Why

One short paragraph. The problem, who has it, and why it matters now. Link the ticket or the requirements page by its tracker URL.

## What

The behaviour that will exist when this is done, in plain language. List the user-visible or API-visible outcomes.

- Outcome 1
- Outcome 2

**Out of scope:** what this spec deliberately does not do.

## Context

What the implementer needs to know before touching code.

- **Repo(s):** `acme-api-orders`
- **Relevant files:** paths of the modules, handlers, models and tests that already exist and will be extended.
- **Existing patterns to follow:** the closest feature, and how it is laid out (`queries/`, `commands/`, `handlers/`, `models/`).
- **Related tickets / documents:** tracker URLs.

## Constraints

### Must

- Reuse what already exists. Make the smallest change that works.
- Test first (red, then green) in repos that use TDD. Stub external HTTP with the project's HTTP stub (for example `nock`) only.
- Use the shared API client for service-to-service calls. Do not hardcode credentials or internal auth values.
- Document API changes in the API spec: each error on its own line, with its code and message.
- Fix field-loss bugs in the central model factory, not at each call site.
- Keep existing request and response shapes working (no breaking changes to public APIs).
- Put a new feature or a complex bugfix inside a large module behind a gated seam and the repo's feature flag.

### Must not

- Add dependencies unless this section allows them: _none_ / _list them_.
- Put business logic in `helpers/`, `utils/` or `services/` catch-alls.
- Refactor code outside the files listed in a task.

## Tasks

Keep each task small: one session, one clear verify step. Tasks run in order unless a dependency says otherwise.

### T1: <short imperative title>

- **Do:** exactly what to implement, in one or two sentences. Name the query, command, model or handler.
- **Files:** `path/to/file.js` (modify), `path/to/new-file.js` (new), `tests/path/to/test.js` (modify)
- **Verify:** the command or manual check that proves this task is done, for example `npm test -- --grep "refund window"`.

### T2: <short imperative title>

- **Do:** …
- **Files:** …
- **Verify:** …

## Done (Validation)

Checks to run after the last task, before the final commit.

- [ ] All task Verify steps pass.
- [ ] The full test command of the repo passes.
- [ ] Coverage on the lines this change touched is above the repo's threshold.
- [ ] The manual check from the requirements passes (request, response, status code).
- [ ] The API spec and translation keys (if any) are updated.
- [ ] Lessons captured with `session-lessons`.
