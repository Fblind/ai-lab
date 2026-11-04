---
name: review-spec-code
description: Reviews code as a senior engineer would (simplicity, clarity, consistency, correctness). Use when the user asks for a code review after implementing a spec task or for changed files.
---

# Review spec code

Reviews changed (or specified) code against simplicity, clarity, consistency with repo patterns, and correctness. Use after implementing a spec task or when the user asks for a review of specific files.

## When to use

- User says "review the changes", "review my code", or "review the code for T1"
- User asks for a code review after implementing a task from a spec

## Instructions

1. **Determine scope**  
   If the user specified files or a path, review those. Otherwise review all changed files (e.g. from the last spec task or from `git status` / `git diff`).

2. **Review against these criteria**

   **Simplicity**
   - Is this over-engineered?
   - Could it be shorter without losing clarity?
   - Are there unnecessary abstractions?

   **Clarity**
   - Are names descriptive?
   - Is the logic easy to follow?
   - Would a new teammate understand this?

   **Consistency**
   - Does it match patterns in the repo (and in CLAUDE.md or project rules if present)?
   - Is it idiomatic for the language and codebase?

   **Correctness**
   - Are edge cases handled?
   - Any obvious bugs?
   - Project conventions: shared API client used for service calls, no hardcoded credentials or internal auth values, API spec updated if the API changed, fixes in central places where applicable (`fix-in-central-places` rule). The pack may add more.

3. **Output**
   - If changes are needed: list specific issues with **file and line** (or short excerpt), and provide the fixed code or concrete suggestions.
   - If the code is good: say so briefly (e.g. "Looks good, no changes needed.").

## Guidelines

- Be constructive, not nitpicky.
- Focus on what matters: bugs, clarity, maintainability.
- Don’t suggest changes just for the sake of it.

## Examples

- "Review the code from T1."
- "Review my changes in resources/auth/."
