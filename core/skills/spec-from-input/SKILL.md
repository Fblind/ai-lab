---
name: spec-from-input
description: Generates an implementation spec from a phrase, a technical doc path, or a ticket ID. Use when the user asks to generate a spec, create a spec from a ticket, or turn a technical doc or implementation plan into an agent-ready spec.
---

# Spec from input (phrase, technical doc, or ticket)

Generates a single implementation spec file that an agent can use to execute tasks (T1, T2, …). The spec defines Why, What, Context, Constraints, and Tasks with Do/Files/Verify.

## When to use

- User says "generate a spec for: …" (phrase)
- User points to a technical doc, requirements, or implementation plan and asks for a spec
- User provides a ticket ID or link and asks for a spec from that ticket

## Instructions

1. **Determine input type** from the user message: phrase, path to a doc (file or tracker document), or ticket ID/link.

2. **Read the spec template**  
   Path: `docs/spec-template.md` in this kit (or the copy the pack or workspace provides). Use this structure for the output (Why, What, Context, Constraints, Tasks with Do/Files/Verify, Done/Validation). Include the convention hints from the template (shared API client, TDD, API spec, fix in central places, no hardcoded credentials).

3. **Gather content for the spec**
   - **Phrase:** Use the phrase and, if needed, light codebase exploration (relevant files, existing patterns) to fill the template.
   - **Technical doc:** Read the file or document the user pointed to. If it lives in the tracker, use the tracker connector to fetch its pages. Extract goals, constraints, and structure; map them to the spec template.
   - **Ticket:**  
     - Read the ticket with the `ticket-requirements` skill (through the tracker connector).  
     - If the ticket has a linked document (e.g. discovery, requirements, or implementation plan), fetch its pages and use them as the main input for the spec.  
     - Use the list/project (or a custom field that names the repository) to infer which repo the code will live in. If the current workspace repo differs from that, **warn the user** (e.g. "This ticket's list suggests repo X; you're in repo Y. Open the correct repo before implementing tasks.").

4. **Choose output path** (`<docs_root>` defaults to `docs/`; see `new-project-workflow`)
   - If a **ticket ID** is available and the user is working in a workflow: `<docs_root>/<ticket_id>-Workflow/spec-<feature>.md`. Create the `<ticket_id>-Workflow` folder if it does not exist.
   - If there is **no ticket ID** (phrase or standalone doc):  
     - Prefer `<docs_root>/specs/spec-<feature>.md`, or  
     - Ask the user for a ticket ID so the spec can be placed in `<docs_root>/<ticket_id>-Workflow/spec-<feature>.md`.

5. **Write the spec**  
   Fill the template with concrete Why, What, Context, Constraints, and Tasks. Each task must have **Do**, **Files**, and **Verify**. Keep tasks small (one session, clear verify step). Save to the chosen path.

6. **Confirm**  
   Tell the user where the spec was saved and suggest: "Review and refine the spec, then run: implement T1 from [path]."

## Tracker integration (summary)

- **Get ticket:** with the ticket ID (from link or user).
- **Get linked doc:** if the ticket references a document, list and read its pages.
- **Repo mapping:** use the ticket's list/project or a custom field to infer the target repo; warn if it doesn't match the current repo.

The concrete connector calls belong to the pack. See `examples/company-pack/`.

## Rules

- When the generated spec references the discovery, requirements, or implementation plan document, use the **tracker document URL** (or page URL) if the document exists in the tracker. Do not write local file paths (e.g. `docs/.../discovery-xxx.md`) into the spec content when referring to those workflow documents.

## Examples

- "Generate a spec for: email/password auth with JWT in httpOnly cookies, login and signup only, no OAuth."
- "Create a spec from this implementation plan" (user attaches or points to doc path / tracker doc).
- "Generate a spec from ticket PROJ-123" or "from this ticket: https://tracker.example.com/t/PROJ-123".
