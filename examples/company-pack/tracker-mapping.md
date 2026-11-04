# Tracker mapping (ClickUp-like)

The core agents and skills describe tracker operations in plain words. This table says which tool call an agent should use for each operation at Acme Tickets. Tool names are those of the ClickUp MCP connector; adapt them for Jira, Linear, GitHub Issues or whatever you use.

| Operation (core wording) | Tool | Notes |
|---|---|---|
| Read a ticket with description, subtasks, dependencies, links, attachments, checklists | `clickup_get_task` with `include` set accordingly | Used by `ticket-requirements`, `feature-summary` |
| Read comments and threaded replies | `clickup_get_task_comments`, `clickup_get_threaded_comments` | |
| Search tickets or documents by name | `clickup_search` | e.g. find `Discovery – ACME-123` |
| Resolve a list (the repo) | `clickup_get_list` | |
| Create the workflow document (private, workspace level) | `clickup_create_document` | `visibility: PRIVATE`, parent is the workspace, never a list |
| List / read document pages | `clickup_list_document_pages`, `clickup_get_document_pages` | |
| Add a page | `clickup_create_document_page` | `content_format: text/md`; names from `acme-tracker-conventions` |
| Replace a page | `clickup_update_document_page` | `feature-summary` re-runs |
| Create a task | `clickup_create_task` | assignee: the user; tags must already exist |
| Link a task to its parent ticket | `clickup_add_task_link` | `task_id` = parent, `links_to` = new task. Bidirectional, leaves the description alone |
| Check existing links | `clickup_get_task` with `include: ["linked_tasks"]` | avoid duplicate links |
| Set "waiting on" dependency | `clickup_add_task_dependency` | `task_id` = blocked task, `depends_on` = blocking task, `type: "waiting_on"` |
| Post a comment on a ticket | `clickup_create_comment` | `entity_type: "task"` |

## Hard rules for this tracker

- Never call an update on a roadmap ticket's description.
- Never nest a created task as a subtask of the roadmap ticket; link it.
- If the connector times out, retry once, then check `linked_tasks` before linking again.
