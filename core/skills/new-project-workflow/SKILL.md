---
name: new-project-workflow
description: Starts the new-project workflow from a roadmap ticket through discovery, requirements, an implementation plan, and engineering tasks. Use when the user says "new project", "start workflow", or "from a roadmap ticket".
disable-model-invocation: true
---

# New project workflow

You are starting the new-project workflow.

1. Read the `new-project-workflow` rule and follow it from the beginning. That file is the contract for steps, document titles, tracker location, and handoff. Do not continue until you have read it.
2. Do not follow a generic PRD template. The discovery, requirements, and implementation-plan pages from this workflow are the documents.

## What to do now

**Step 1: Start.** Ask for the roadmap ticket (link or ID) and any initial thoughts (goals, constraints, ideas, concerns). Load the ticket through the tracker connector when you need it.

Then continue in order, one subagent at a time, as the rule defines:

- Step 2: **project-discovery**
- Step 3: **requirements-doc-helper**
- Step 4: **technical-implementation-planner**
- Step 5: **technical-task-creator**

Pass the ticket ID, the user's initial thoughts, the discovery file path, and the tracker document ID forward as the rule requires. Wait for the user to approve each gate before starting the next step. Do not write code in this chat.
