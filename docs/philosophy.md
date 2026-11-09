# Philosophy

Why this kit looks the way it does. Short version: AI coding agents are fast and literal, so most of the engineering work moves to **deciding what to build**, **keeping each step small and checkable**, and **remembering what went wrong**.

## The loop

```
grill-discovery  →  spec  →  one task  →  TDD  →  review  →  demo  →  commit  →  lessons
```

1. **Grill before you spec.** The cheapest bug is the misunderstanding you remove in a conversation. `grill-discovery` interviews you one frontier of questions at a time until the problem, the actors and the outcomes are shared. Only then is a spec worth writing.
2. **A spec is a contract for an agent with no memory.** Why, What, Context, Constraints, and tasks with *Do / Files / Verify*. If a task cannot be verified in one command or one manual check, it is too big.
3. **One task per context.** `execute-spec-task` implements exactly Tn. Fresh context per task keeps the agent from drifting into unrelated edits.
4. **Red, then green.** `tdd` writes the failing test first, watches it fail for the right reason, then makes it pass. Stubs for external HTTP are the only test double. Tests that repeat existing assertions are noise (`no-redundant-tests`).
5. **Review with a second pair of eyes.** `code-reviewer` is a light read-only pass. `strict-code-reviewer` adds backward-compatibility, test-vulnerability, performance and security checks plus a coverage gate on the touched lines. `review-spec-code` checks the diff against the spec.
6. **Show what a person can see.** `record-demo` turns the acceptance criteria into one scene file. A dry run proves the clicks. One headless recording produces the video and a caption script. Login, URLs and fixtures stay in that file. The kit does not know any one product.
7. **Commit the why.** `commit-spec-change` writes a conventional commit that explains the reason, not just the diff.
8. **Learn.** `session-lessons` turns what surprised you into a short note in a "second brain" and, when a skill or rule caused the problem, proposes a change to that skill or rule.

## Rules of thumb behind the rules

- **Smallest change that works.** Reuse before you write (`reuse-existing-code`). Comments explain *why*, never *what* (`comments-self-explanatory`).
- **Fix it where it is born.** When data is lost on save, the factory is wrong, not the twelve call sites (`fix-in-central-places`, `model-factory-investigation`).
- **Reads and writes are different things.** Questions go in `queries/`, state changes in `commands/`, handlers only route (`cqrs-queries-commands`).
- **Isolate new behaviour in old code.** One insertion point, a feature flag, a new module with plain inputs (`gated-seam`).
- **Know the map.** A one-file feature map per repo saves an agent from rediscovering the codebase every session (`feature-map`, `read-feature-map`).
- **Refactor on purpose.** One named refactoring at a time, behaviour unchanged (`refactor-code`).

## Company-specific knowledge goes in a pack

Everything above is generic. Repo names, test commands, feature flag naming, tracker mapping, API client conventions and shared-package rules differ by company, so they live in a **pack** (see `examples/company-pack/` and the README).

## Credits

- The spec-driven flow was inspired by Owain Lewis's tutorial: https://github.com/owainlewis/youtube-tutorials/tree/main/tutorials/spec-driven-development
- The refactoring catalog paraphrases ideas from Martin Fowler (*Refactoring*), Kent Beck, and Michael Feathers (*Working Effectively with Legacy Code*). No text is copied.
