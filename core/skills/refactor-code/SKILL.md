---
name: refactor-code
description: >-
  Behavior-preserving refactoring for Node repos, from Fowler's
  "Refactoring" (2nd ed.), Beck's "Tidy First?", and Feathers' "Working
  Effectively with Legacy Code". Use when the user invokes /refactor-code,
  or asks to refactor, clean up, restructure, simplify, untangle, rename,
  extract, deduplicate, or "make this easier to change"; when code smells,
  tech debt, or legacy structure come up; or when a coming change is hard
  until the structure moves ("make the change easy, then make the easy
  change"). Do not use to add a feature, fix a bug, or tune performance, and
  do not use inside a tdd red-green cycle.
---

# Refactoring

Refactoring changes internal structure and keeps observable behavior. Same inputs, outputs, side effects, errors, logs callers depend on, and public contracts. If behavior would change, stop and say so.

## Which skill owns this

| Situation | Owner |
|---|---|
| User asked to refactor, or for a preparatory restructure before a change | This skill |
| Feature or bugfix, including `/implement-ticket` | `implement-ticket`. The only refactor in that session is the one extract `gated-seam` needs to expose a seam. |
| Red → green cycle | `tdd`. Refactoring is not a step in that loop. After a green `tdd` cycle, this skill owns a cleanup only when the user asked for one. |
| Scan for deepening opportunities, HTML report | a separate architecture-review skill, if you have one. Leave it unstarted. |
| Naming a module interface while moving code | Read your codebase-design guidance, if any. These steps stay the procedure. |
| A commit the user asked for | Suggested message below. `review-spec-code` runs before that commit, not during this loop. |

A behavior-preserving move stays ungated. `gated-seam` is for new behavior.

## Principles

1. **Behavior stays.** Bugs you find stay. Report them.
2. **One hat.** Refactoring and a behavior change are different steps. Finish the refactor and stop before the behavior change.
3. **One named refactoring, then green.** If a step breaks tests and the cause is not obvious, revert and take a smaller step.
4. **Tests first.** No coverage on the code you touch means you are editing. Add characterization tests, or stop.
5. **A coming change or a concrete smell.** Stop when that is done.
6. **One kind of change per commit boundary.** Renames, then moves, then extractions. Commit only when the user asked. When they do, and the work started from a ticket, the message includes the ticket ID (for example `PROJ-123`).

## Workflow

1. **Scope.** Restate the goal and the files in scope. The tracker's list name is the repo by convention; if the open git repo has another name, warn and stop. If `<second-brain>/feature-map/<repo>.md` exists, read the section for this capability before searching. Anything beyond a local change: a short plan, then wait for approval. Done when the boundary is stated, including which contracts stay.
2. **Safety net.** In that repo's directory, run the checks in "Green" before editing. Record the baseline. Baseline red → stop and name the failures. Thin coverage → characterization tests in the existing suite (see "Tests"), as their own commit boundary. Still no coverage → stop.
3. **Smells.** Read the smell map in [references/catalog.md](references/catalog.md). List each smell, `file:line`, and why it blocks the goal. Order by impact on that goal.
4. **One refactoring.** The smallest named move from that map. Read its mechanics in the catalog, including "Project conventions", before editing. Search for an existing helper before Extract Function.
5. **Apply, then green.** One refactoring. Run the touched tests, then lint and typecheck on the touched files. Revert if red. Leave a commit boundary. Do not commit.
6. **Stop.** Stop when the coming change is easy or the targeted smell is gone. List further opportunities and leave them.
7. **Report** with the format below.

## Workspace conventions

The workspace root may be a folder of git repos. Run every command in the repo that owns the files. The commands below are defaults for Node repos; a pack can override them (see `examples/company-pack/`).

**Green**

- Baseline and milestones: `npm test`.
- During the loop, one file, one shot. Run the single test file with the runner's own command (for example the repo's mocha script with the file path appended, or `node --test <file>`). Leave watch modes (`npm run tdd`, `test-w`, `test-until-fail`) unused.
- Types: `npm run typecheck` when that script exists. Skip types when the script is absent.
- Lint: `npm run lint` when that script exists. Otherwise run the repo's lint-diff tool after staging only the files this refactor touched. Leave lint rule changes and formatting-only edits out of the diff.

**Where code moves**

- API repos: `resources/<resource>/{handlers,queries,commands,models}`. A feature module is `resources/<resource>/features/<feature>/{queries,commands,tests/unit}`. A read or decision goes to `queries/`. A write goes to `commands/`. Import those modules as namespaces (`const Queries = require(...)`).
- Front-end repos: follow the repo's own layout (`src/`, `app/`, `components/`, `store/`).
- Generated output (transpiled `lib/`, published types): edit the source and its tests only.
- Data migrations are data. Leave them out of this skill.

**Tests**

Match the suite you are editing. Extend it (see the `no-redundant-tests` rule). Expected values are literals. Outbound HTTP uses `nock` only. A new test does not add `sinon`, `mock.method`, `jest.mock`, or `vi.mock`.

Front-end repos usually have no red-green cycle. If that area already has tests, run them. If it has none, stop.

**Contracts**

These are behavior: HTTP path, method, status, body, and error code; the API spec; database field names and model factory fields; feature-flag meaning; env and config keys; translation strings; exported client methods. A persisted or serialized rename changes the internal binding. The wire name stays.

Also behavior: `this` binding, hoisting, getters, `async` order, shared mutation, `==`, `instanceof` across packages, import side effects, and error text callers match. A dao save drops fields the factory does not copy. An array update that reads a document and `$set`s it back loses concurrent writes. Leave both as they are.

Leave a database query's operators, projection, and round-trips as they are. Changing them is a performance change.

## Guardrails

- A plan past about 10 files or about 400 changed lines is split. Ask before starting it.
- Keep every test. Change an assertion only in a test refactor that keeps the same checks.
- Leave dependency upgrades and lint-rule changes out of the diff.
- Stop when the baseline is red, the code cannot be covered, a step needs a behavior change, you find a bug, or the scope grows past what was agreed.
- Wide renames use the editor rename or a codemod. Check stringly references (routes, `require` paths, translation keys) before removing code.
- Generated, vendored, and third-party code stays as it is.

## When to leave the code

- The code works, rarely changes, and nobody needs to understand it for a change that is coming.
- A rewrite was chosen explicitly.
- A hotfix or an incident is in progress. Ship the fix, then refactor.
- Characterization tests are not feasible in the time available. Report that.
- The hot path has no benchmark, and the move could change its cost.
- Generated, vendored, or third-party code.

## Report

```
## Refactoring report
**Goal:** <change enabled or smell removed>
**Scope:** <files/modules>; public contracts unchanged: yes/no (<details>)
**Baseline:** `npm test` → <N passed / M failed>; typecheck: ok/fail/absent; lint: ok/fail
**Safety net added:** <characterization tests, or "none needed: covered by …">

**Smells found:**
- <Smell> at <file:line> — <why it hurts>

**Steps (each green, not committed):**
1. <Refactoring name>: <what/where> — suggested message `refactor: …`

**Result:** <command> → green; +X/−Y across N files
**Bugs observed (left as they are):** <list or "none">
**Deferred:** <next refactorings, with why>
**Needs a decision:** <contract changes, risky steps>
```

## Catalog

Read [references/catalog.md](references/catalog.md) when listing smells or applying a named refactoring. Leave it unread for the safety net and the report.
