---
name: execute-spec-task
description: Executes a single task (T1, T2, …) from an implementation spec file. Use when the user asks to implement Tn from a spec, run task Tn, or execute the next task from a spec path.
---

# Execute spec task

Implements exactly one task from a spec file: read the spec, find the requested task (e.g. T1, T2), implement only what that task describes, then run its Verify step.

## When to use

- User says "implement T1 from …" or "implement T2 from docs/…/spec-auth.md"
- User says "run task T3" or "execute the next task" and has shared or pointed to a spec path

## Instructions

1. **Resolve spec path and task id**  
   From the user message, get the path to the spec file (e.g. `<docs_root>/<ticket_id>-Workflow/spec-<feature>.md` or `<docs_root>/specs/spec-<feature>.md`) and the task label (T1, T2, T3, …). If the user said "next task", infer from context or ask.

2. **Read the spec**  
   Open the spec file. Parse Why, What, Context, Constraints, and the **Tasks** section.

3. **Locate the requested task**  
   Find the task block for the given number (e.g. T2). Read its **Do**, **Files**, and **Verify** lines.

4. **Implement only that task**
   - Implement exactly what **Do** describes.
   - Touch **only** the files listed under **Files** for this task (plus any new files explicitly required by the task).
   - Follow all **Constraints** and **Must / Must not** from the spec.
   - Do not do other tasks, drive-by refactors, or extra features.
   - If the spec or workspace rules require tests (e.g. TDD for API repos, per the `tdd` skill), write or update tests as specified.
   - If this task adds a feature or a complex bugfix inside existing high-complexity code, follow the `gated-seam` rule unless the spec already names the seam and the module.
   - Do not add dependencies unless the spec’s Constraints allow it.

5. **Run the Verify step**  
   Execute the **Verify** instruction for this task (command or manual check). If it fails, fix the implementation and re-run until it passes.

6. **Session checks**
   Follow **Session checks** in the `implement-ticket` skill. The file list is the files this task changed, not the rest of the branch.

7. **Pre-commit**
   Follow **Pre-commit** in that same skill (`implement-ticket`).

8. **Report**
   - What was implemented (short summary).
   - Files created or modified.
   - Verification result (pass/fail).
   - For each session check that ran: what was added or fixed, or that nothing was wrong.
   - Pre-commit result.
   - Any blockers or issues.

9. **Suggest next step**
   - If more tasks remain: "Run: implement T(N+1) from [spec path]."
   - If all tasks are done: "All tasks complete. Run the **Done (Validation)** section from the spec (e.g. full test suite, manual checks)."

## Rules

- Only this task — ignore other tasks in the spec.
- Only files listed in this task’s **Files** (and any new file the task explicitly requires).
- No drive-by refactors or scope creep.
- Follow Constraints strictly (shared API client, TDD, API spec, central-place fixes, etc. as in the spec/template).

## Examples

- "Implement T1 from docs/PROJ-123-Workflow/spec-auth.md"
- "Run T2 from the spec we just created" (when the spec path was shared earlier in the chat)
