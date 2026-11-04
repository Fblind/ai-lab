---
name: implement-ticket
description: Implements one engineering ticket or bugfix. Reads the ticket, writes tests, codes to repo and team standards, runs the linter and tests, checks the API or the UI by hand, runs small session-only quality checks on the files this session changed, then runs the repo's pre-commit commands and fixes failures.
disable-model-invocation: true
---

# Implement a ticket

Implement one ticket. A planned engineering task and a bugfix both start here. Do not run discovery, and do not create tickets.

Do not commit, push, merge, or comment on the ticket unless the user asks for that exact action.

Company-specific conventions (repo names, test commands, manual-check tooling, error-handling idioms) come from the active pack. See `examples/company-pack/` and `kit.config.json`. Where this skill says "the pack defines", skip the item if no pack defines it.

## 1. Read the ticket

Use the `ticket-requirements` skill and follow it through the answer (what the ticket asks, what the code already does, what remains). The "do not implement" line in that skill does not apply here.

The tracker's list or project name is the repository name by convention. If the git repo you have open has a different name, stop and say so. Do not edit the wrong repo.

If nothing remains, say that and stop.

## 2. Choose the path

State which path you are taking, and why, before editing code.

**Bug.** Reproduce it first. When the `tdd` skill applies, add a failing test that shows the bug, then fix it. In a repo without a red-green cycle (typically a front end), state the exact steps and confirm the failure, then fix it.

**Planned task, one deliverable.** The ticket is the requirements. State the goal, approach, risks, and test plan in a few sentences, then implement in this chat. One deliverable is one endpoint, one bug, or one screen in one repo.

**Planned task, too big for one session.** Stop and use the `spec-from-input` skill. This applies when the task spans more than one repo, or lists several independent deliverables. Tell the user the spec path and wait. Do not implement in this turn. Later tasks run with `/execute-spec-task`.

## 3. Implement

Follow the open repo's `AGENTS.md`, formatter, linter, and existing patterns. Those win for style.

Also follow these rules:

- Use the `tdd` skill for tests. It owns the red→green loop, which repos skip it, and nock (or the pack's HTTP stub) as the only test double.
- API changes: document the handler and models in the API spec (OpenAPI/Swagger). Describe each error on its own line, with the error code and the message.
- Handler errors: when the pack defines an error-mapping idiom, follow it. A common one: handler bodies and commands throw `new Error("CODE")`, and only the handler's error map turns a code into a typed validation error with a message and status. The unmapped-error test is one cycle in `tdd`.
- Call other services through the shared API client. Do not hardcode credentials or internal auth values.
- New UI copy that needs translation keys: list the new keys. Create them with the pack's tool only after the user picks which keys.
- If a save drops or overwrites fields, read the `model-factory-investigation` and `fix-in-central-places` rules. Change the model factory or shared helper, not each call site.
- If the repo has `queries/` and `commands/`, read the `cqrs-queries-commands` rule. Reads and decisions go in queries. Writes go in commands.
- A new feature or a complex bugfix inside existing high-complexity code: read the `gated-seam` rule before editing. Name the seam, isolate the new logic in a new module, and gate the call with the repo's feature flag.
- Keep the change to this ticket. No drive-by refactors. A small refactor is allowed only when `gated-seam` needs it to expose one seam.

## 4. Check

1. Run the linter with the repo's configuration and fix the errors you introduced.
2. Run the repo's test command. Fix failures you introduced. If you skip a failing test, say so.
   - Before calling a failure unrelated, name the test and the error, then rerun that file alone. Random fixtures can collide on unique indexes. Report it as flaky only when the rerun passes.
   - When a check is piped into `head`, `tail` or `rg`, the shell reports the filter's exit code. Redirect the check to a file and read `$?` instead.
3. Manual check, and do not call the work done before this:
   - **API.** Make a real request against the local service for the endpoint this session changed: method, URL, the headers the handler expects, and a sample body with only the required fields. Check the status and body against the spec. If the pack configures an API client collection (the pack names the tool), save the request there too, following the pack's conventions for workspace, environment variables and headers. Never put a real token in a saved request and never copy environment values. If no tool is connected, print the request (a `curl` command) instead.
   - **UI.** Exercise the changed flow in the browser: the main path, and the empty or error state the ticket mentions. A screenshot of the screen is not the check.

## 5. Session checks

These are small stand-ins for periodic team checks. Look only at paths this session created, edited, or committed. Leave out files that were already dirty when the session started, and leave out the rest of the branch. Do not open a pull request, post to chat, or scan merged history.

If that list is empty, skip this section. Skip a check when the repo does not match it. "API repo" below means a repo that serves an HTTP API (the pack defines how to recognise one; by default a repo whose name starts with `api-` or `*-api-`).

### APIs: add test coverage

Run only in an API repo.

On production files in the session list, add tests where risk is real: a new path with no test, a bugfix that did not add one, or edge cases in parsing, permissions, validation, or a shared flow. Skip cosmetic edits, low-signal snapshots, and behavior-neutral refactors. Read the `no-redundant-tests` rule. Follow the repo's fixtures. Keep tests deterministic. Add the smallest set that proves the behavior. Do not change production behavior unless a tiny testability refactor is required. Run those tests. Drop a test that is flaky or environment-dependent, and say so.

### Front end: add test coverage

Run only in a front-end repo.

Same bar as the API coverage check, using the test style that repo already has. Do not add a new test stack. If that area has no tests, say so and stop.

### APIs: find critical bugs

Run only in an API repo.

On the session change, look for data loss, a lost write, a crash on a real input, an auth or permission bypass, or silent truncation. Trace the changed path far enough to see the effect. Ignore style, theoretical cases, and minor UX issues.

Report a bug only with a concrete input that triggers it. If you are highly confident, apply a minimal fix and a test in this session. Otherwise report it and do not expand the change. If none, say that no critical bug was found in this change.

### Backward compatibility check

Run only in an API repo, and only when the session changed a request, a response, an error, or a route.

Flag a break for existing clients: a removed or renamed field, a type or enum change, a new required field, a changed status or error code, or a changed path or method. A new optional field or a new route is compatible.

If the ticket requires the break, report it and leave the code. Otherwise make the change additive in this session: keep the old field and behavior, and put the new behavior beside it.

### Review API documentation

Run only in an API repo, and only when the session changed a handler, a model, or the API spec.

Update the spec for those endpoints only, from the code. Describe behavior in multiple lines, including each parameter. Put each error on its own line with its code and message. Do not document unchanged endpoints, and do not describe behavior the code does not have.

## 6. Pre-commit

Run the commands this repo runs before a commit. Do not create a commit.

Read `.husky/pre-commit`, or a `package.json` script named `precommit` or `pre-commit`, and run those commands. If a command only checks staged files, stage the files this session changed and run it. Leave them staged. Do not stage files that were already dirty when the session started.

If a command fails, fix the failure and run it again until it passes. If the repo has no pre-commit command, say so.

## 7. Report

Say what changed, which commands passed, and what you verified by hand. Then, for each check that ran: what you added or fixed, or that nothing was wrong. Include the pre-commit result. Name anything you could not run.

When the user wants a second pass, they will invoke the `strict-code-reviewer` agent (or `/review-spec-code`). Do not start that review yourself.

When the user asks to commit, include the ticket ID (for example `PROJ-123`) in the message.
