---
name: feature-map
description: >-
  Builds and updates a per-project feature map from the code: what each
  business capability does, and where it lives (modules, endpoints, database
  collections). Use when the user asks for a feature map, where a feature
  lives in the code, or to refresh second-brain/feature-map for a project.
  Reads the scanned repo only.
---

# Feature map (v1)

Build or refresh one project's feature map. A feature is a business capability a person would name (Cart, Cancellations), not a file.

Read the scanned repo. Write only `feature-map/<repo>.md` in the second brain, and only after the user confirms the draft. The map file is the source of truth. Publishing it to a tracker or wiki is later work.

Fill [template.md](template.md). Sections are the source. Rebuild the index and the mindmap from the sections.

## 1. Find the second brain

Use the first path that exists:

1. The path the user gave.
2. The `secondBrain` path in `kit.config.json`.
3. A directory named `second-brain` next to the scanned repo, then `~/second-brain`.

The map file is `<second-brain>/feature-map/<repo>.md`, where `<repo>` is the git directory name (`acme-api-orders`).

Done when you have the file's contents, or you know it is not there yet. If no second-brain directory exists, ask where it is and stop. Do not create one.

If the file exists, copy each feature's **Owner**, **Status**, **Ticket**, and **Notes** before scanning. Those four survive the refresh.

## 2. Scan

Read only. Do not edit, format, or commit the scanned repo.

Account for every registered endpoint and every collection name (the string a model passes to the data-access layer). Healthcheck, service info, and middlewares are shared code, not features.

In a Node API repo laid out as below, start here (the layout is an example; adapt it to the repo):

- `resources/index.js`: the handlers registered with the router, and the registered modules.
- Each handler's spec: `method` and `path` are the endpoint. The `description` is the wording to shorten.
- `resources/<capability>/` (handlers, commands, queries, models, tests) and the top-level `resources/<verb>-<noun>.js` files.
- The collection name on models, and any collection string passed into the data-access layer.
- Config keys a feature's code reads by name. Tests confirm a capability; a test file with no handler is not a feature.

Anywhere else, use the same evidence: route registration, controllers or handlers, service modules, models, config, and tests.

Done when every registered endpoint and every collection name is on the evidence list or listed as shared code.

## 3. Group

One feature per capability. Merge handlers and folders that serve the same noun (`get-order.js` and `resources/orders/` are Order). A shared service with no endpoint of its own stays under Shared code.

Copy endpoints and collection names as they appear in the code. Write "What it does" in one or two lines from the handler description. When the name, the sentence, or the grouping is your summary rather than a string you opened, suffix it with `(inferred)`.

**Status** on a first write: `deprecated` when the code says deprecated; `active (inferred)` when the endpoint is registered and nothing says deprecated; otherwise `unknown`. **Owner** is `TBD`. **Ticket** is empty unless that feature's files contain a tracker URL or a ticket ID.

## 4. Merge

Match sections by heading.

- Refresh "What it does", modules, endpoints, and collections from the scan.
- Put back Owner, Status, Ticket, and Notes unchanged.
- A capability in the scan and not in the file: add a section.
- A section in the file and not in the scan: move it under "Not in this scan", set **Removed from code** to today's date, and keep Owner, Status, Ticket, and Notes.
- A rename that would drop a section which has manual fields: show both in the draft and let the user decide.

Rebuild the index (Feature, What it does, Status) and the mindmap (feature names only) from the sections.

## 5. Confirm, then save

Show the full draft and, on a refresh, a short list of added, refreshed, and removed features. Ask the user to confirm or edit. Save only after they confirm.

Write the file with frontmatter `project`, `repo`, `last_updated` (`YYYY-MM-DD`), `generated_by: feature-map`. Create `feature-map/` under the second brain they named. Do not create the second brain itself.

## Shape

```markdown
### Order

Returns an order by its ID, with the main transaction, customer, and payment information.

| | |
|---|---|
| Repo and modules | `acme-api-orders` — `resources/get-order.js`, `resources/orders/` |
| Endpoints | `GET /order/{orderId}` |
| Collections | `orders` |
| Owner | TBD |
| Status | active (inferred) |
| Ticket | |
```

That row is the grain. Re-read the files before using it; do not paste it into a map from memory.
