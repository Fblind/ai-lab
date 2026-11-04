---
name: pr-code-reviewer
description: >-
  Review of a GitHub pull request. Use when the user invokes
  /pr-code-reviewer, or asks to review a PR by URL or number.
  Prepares the PR diff against its real base branch, runs ESLint, hands the
  diff to the strict-code-reviewer agent, verifies its findings, and returns
  them as inline PR comments, posted to GitHub on confirmation.
---

# PR code review

The `strict-code-reviewer` agent is read-only: it cannot fetch the PR, call GitHub, or run the shell. This skill does that legwork, hands it a ready diff, then checks what comes back. The output is a set of inline PR comments, posted to the PR as a review once the user confirms.

Leave the user's working tree and current branch alone. Fetch into refs and use a worktree; never check out or reset.

## 1. Pin the PR

Done when you have owner, repo, PR number, **base branch**, head SHA, changed-file count, and the ticket ID (if any).

- Read the PR with the GitHub MCP (`pull_request_read`); `gh` is often unauthenticated here. If the MCP is unavailable, ask the user for the base branch rather than guessing.
- The base branch is whatever the PR targets (often `dev`). Never assume `master`.
- The ticket ID comes from the PR title, branch name, or commits (`PROJ-<id>` or `#<id>`; the pattern is configurable per pack). If found, read the ticket with the `ticket-requirements` skill so the reviewer can check the change against it.
- Work in the local clone of that repo. If the workspace is a different repo, say so and stop.

## 2. Build the diff

Done when the diff's changed-file count matches the PR's.

```bash
N=<number>; BASE=<base branch>
git fetch origin "$BASE" "pull/${N}/head:pr-${N}" --force   # needs full_network
MB=$(git merge-base "origin/${BASE}" "pr-${N}")
mkdir -p "/tmp/pr-${N}"
git diff "${MB}" "pr-${N}" > "/tmp/pr-${N}/pr.diff"
git log --oneline "${MB}..pr-${N}" > "/tmp/pr-${N}/commits.txt"
git diff --stat "${MB}" "pr-${N}"
```

In zsh, keep braces before a `:` (`"${MB}:path"`); `$MB:r…` is read as a path modifier. Pass file lists inline, not through an unquoted variable.

If the file count is far off the PR's, the base is wrong. Fix it before going on.

Give the reviewer a readable tree at the PR head:

- When `git rev-parse HEAD` equals `pr-${N}`, the repo itself is the tree.
- Otherwise `git worktree add "/tmp/pr-${N}/tree" "pr-${N}"`, and symlink the repo's `node_modules` into it so ESLint resolves.

## 3. Run the tools the reviewer can't

Done when ESLint has run on every changed JS/TS file at the PR head, and you know which tests ran.

- `npx eslint <changed files...>` with the repo's config, from the PR-head tree. Each error is a finding; `git blame` it to confirm the PR introduced it.
- Run the unit tests for the changed files, and the repo's coverage command (from `package.json`) when it can run locally. Integration tests that need Mongo or other services may not run; record what did and did not.

## 4. Hand off to `strict-code-reviewer`

Done when the agent returns its report.

Call the Task tool with `subagent_type: "strict-code-reviewer"` and a prompt carrying everything it can't look up:

```text
Review GitHub PR <url>. Base is `<base>` (not master).
Repo: <repo path>. PR-head tree (read files here): <tree path>.
Merge-base: <MB>. Head: <sha>.
Full diff: /tmp/pr-<N>/pr.diff   Commits: /tmp/pr-<N>/commits.txt
Changed files: <list from --stat>
Ticket: <id + requirements summary, or "none">
ESLint (already run by caller): <results>
Tests/coverage (already run by caller): <results, or what could not run and why>

Review only the changes in this diff. Run every check in your instructions.
Cite line numbers from the files in the PR-head tree, never line numbers inside the diff file.
For every finding give: severity (blocking / should fix / nit), check name, file:line, the concrete scenario, and the minimal fix.
```

## 5. Verify every finding

Done when each finding has been confirmed against the code, corrected, or dropped.

The reviewer can be wrong. For each finding:

- Open the cited lines in the PR-head tree. Fix line numbers that don't point at the code.
- Open any library function the finding depends on (`node_modules/...`) and check the version in use (`package.json`, the package's own `package.json`). A finding that the library or framework contradicts is dropped.
- Confirm the PR introduced it (it's in the diff), unless it's a security issue in code the diff touches.
- Check the claimed wording or behaviour is actually there; partial truths get narrowed to what's true.

## 6. Report as PR comments

Done when every surviving finding is a pasteable comment anchored to a PR-head line.

Lead with the verdict (approve / request changes) and the one-line reason. Then, grouped by severity, one block per finding:

1. `path:line` at the PR head, and a code reference of the lines.
2. A ready-to-paste comment inside a ````` ````markdown ````` fence (four backticks, so inner fences survive). Use a ```` ```suggestion ```` block when the fix is mechanical; the suggestion replaces exactly the lines it's attached to, so say when the user must select a line range in GitHub first.

After the comments, list in one line each:

- Findings you dropped in step 5, and why.
- ESLint and test/coverage results, including what could not run.

## 7. Post to GitHub

Done when the user has answered, and every comment they approved is on the PR, or they chose to paste the comments themselves.

Posting is visible to the PR author, so ask first with `AskQuestion`, offering:

- **Post as a pending review** (recommended): the user checks it in GitHub and submits it.
- **Post and submit** as `COMMENT` or `REQUEST_CHANGES`, matching the verdict. Never `APPROVE` without an explicit request.
- **Don't post.** The pasteable comments from step 6 are the result.

They may also pick a subset of findings.

Post with the GitHub MCP (the connected GitHub MCP server), owner/repo/number from step 1:

1. `pull_request_review_write` with `method: "create"`, `commitID: <head sha>`, and no `event`. This opens a pending review. If one already exists for the user, ask whether to add to it or `delete_pending` it first.
2. One `add_comment_to_pending_review` per finding:
   - `path`, `line` (the PR-head line), `side: "RIGHT"`, `subjectType: "LINE"`.
   - `body`: the comment from step 6 without the outer ````` ````markdown ````` fence. `suggestion` blocks stay inside it.
   - For a range (a suggestion replacing several lines), set `startLine` and `startSide: "RIGHT"`, and make `line` the last line.
3. `pull_request_review_write`:
   - For **post and submit**: `method: "submit_pending"`, with the `event` and a `body` holding the verdict plus anything without a line (dropped-finding notes go to the user only, not the PR).
   - For **pending**: stop and tell the user the review is waiting for them in GitHub.

GitHub rejects a line comment on a line outside the diff hunks. Retry that finding with `subjectType: "FILE"` (no `line`), and start the body with `path:line` so the location survives. If a call still fails, give the user that finding to paste, and carry on with the rest.

Report what was posted (count, pending or submitted, with which event) and link the PR.

## 8. Clean up

Remove `/tmp/pr-${N}` and any worktree (`git worktree remove "/tmp/pr-${N}/tree"`). Tell the user the `pr-${N}` branch exists and how to delete it (`git branch -D pr-${N}`).
