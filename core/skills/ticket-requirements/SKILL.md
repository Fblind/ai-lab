---
name: ticket-requirements
description: >-
  Reads a ticket, its comments, and its attachments, then says what to do so
  the code matches the requirements. Use when the user shares a ticket URL or
  ID and asks what we should do, what the requirements are, or how to match
  the ticket.
---

# Ticket requirements

Read the ticket, check comments and attachments, and say what to do in order to match the requirements.

Do not implement, comment on the ticket, or change its status unless the user asks.

The steps below are tracker-neutral. A pack maps them to concrete connector calls (see `examples/company-pack/` for an example with an issue tracker and its MCP tools).

## Read the ticket

1. Take the ticket ID from the URL. A URL such as `https://tracker.example.com/t/<workspace>/<ticket-id>` carries a workspace and a ticket ID; a bare `/t/<id>` is the ticket ID. Pass the workspace to the connector when the URL includes it.
2. Fetch the ticket with description, attachments, custom fields, subtasks, checklists, and linked tickets.
3. Fetch the comments. For every comment that has replies, fetch the thread too.
4. For each attachment, download it and read the file immediately. Download links are often short-lived and single-use. If a download fails, request a fresh link once. If it still fails, say which attachment could not be read.
5. When comments or attachments contradict the description, the later comment or the attachment wins. Say which source you followed.

The tracker's list or project name is the repository name by convention. If the git repo you would change has a different name, warn the user before recommending changes in it.

## Check the code before recommending work

The ticket can be stale. Compare the requirements to the current code in the repo the list names.

- Open the files the ticket names, and the nearby handlers, models, and tests that define the same contract.
- Check git history for a commit that already did the work, including under a different ticket ID.
- If the requirement is already met, say that first. Cite the commit and the related ticket. Do not propose the same change again.
- If part of the requirement is already met, say what remains.

## Answer

Lead with what to do. Link each ticket as `[ticket name](url)`.

```markdown
## What the ticket asks
[Requirements from the description, comments, and attachments. Note empty comments or attachments.]

## What the code already does
[Current behavior in the named repo, with file paths. If a commit already covers it, cite hash, message, and related ticket.]

## What to do
[Concrete steps to match the requirements, or that nothing remains and the ticket can be closed.]

## Open checks
[Validation the ticket asked for that you did not run, and any blocker already recorded.]
```
