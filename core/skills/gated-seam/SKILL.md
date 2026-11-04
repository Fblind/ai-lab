---
name: gated-seam
description: Reshapes code changes already in a repo into the gated seam pattern. Use when the user runs /gated-seam, or asks to apply the gated seam to a diff, branch, or uncommitted changes.
disable-model-invocation: true
---

# Apply the gated seam to existing changes

Take changes that are already in the open repo and move the new behavior behind a gated seam. Do not implement a new feature from a ticket. Do not commit, push, or open a pull request.

The pattern is the `gated-seam` rule. Read it and follow it. If that file and this skill disagree, the rule wins.

## 1. Take the change set

Use the first match:

1. The user named files, a commit, or a range. Use that.
2. `git diff` and `git diff --cached` are not empty. Use both. That is the default.
3. The work tree is clean. Diff the branch against its merge base with the default branch (`main`, or `master` if there is no `main`).

Ignore changes that were already dirty and are unrelated to the behavior being isolated. If the change set is empty, say so and stop.

## 2. Name the seam, then edit

Read the changed code and the function it sits in. State, before editing:

- the file and the insertion point
- the new module name (the business outcome)
- the flag name
- what the legacy file still does (fetch, mutate, save, call out)

One clear seam: state it, then apply it.

Two seams that would change the design: name both and stop. Do not edit until the user picks one.

Skip a hunk that is already a gated seam, or that only touches a module that is already small and isolated.

## 3. Apply it

Move only the new behavior.

- Gather inputs in the existing file. Pass a plain object in.
- Gate the call with the feature-flag check this repo already uses. Off runs the path from before this change.
- Put the new logic in a new file. No database client, API client, or global state inside it.
- The existing file applies the returned value.
- If the repo has `queries/` and `commands/`, follow that split.
- Unit-test the new module. Keep or adjust the tests that already cover the change. Do not add a suite for the whole legacy file.
- A small refactor is allowed only to expose the one seam.

## 4. Report

Say which files moved, the flag name, and what flag-off does. Name anything in the diff you left in place, and why.
