---
name: commit-spec-change
description: Generates a conventional commit message for staged changes (type(scope): subject, body with WHY). Use when the user asks for a commit message after a spec task or wants to commit staged changes.
---

# Commit spec change

Produces a conventional commit message from the current staged diff. Explains **why** the change was made, not only what changed. Optionally includes a ticket reference (for example `PROJ-123`) when the work comes from a ticket. The reference format is configurable in `kit.config.json` (`ticketPattern`).

## When to use

- User says "write a commit message", "commit these changes", or "suggest a commit message for the last task"
- User has staged changes and wants a commit message before pushing

## Instructions

1. **Get staged changes**  
   Run `git diff --staged` to see what will be committed.

2. **Write the commit message**

   **Format:**
   ```
   <type>(<scope>): <subject>

   <body>
   ```

   **Types:** feat | fix | refactor | test | docs | chore

   **Rules:**
   - Subject: max 50 characters, imperative mood ("add" not "added").
   - Body: explain **why** this change was needed (for future you and reviewers).
   - If the work is from a ticket, add a line like `PROJ-<id>` (e.g. in the body or as "Closes PROJ-123").

3. **Output**  
   Provide the full commit message so the user can paste it into `git commit -m "..."` or use a multi-line commit. Optionally suggest running `git commit` with the message.

## Example

```
feat(auth): add JWT verification middleware

Users need per-account auth for billing. This middleware validates
the JWT from httpOnly cookies before allowing access to protected routes.

PROJ-123
```

## Guidelines

- Future you will search git blame at 2am — make the message helpful.
- A good commit message is a gift to yourself.
- If you can’t summarize it clearly, the change might be too big (consider splitting commits per spec task).
