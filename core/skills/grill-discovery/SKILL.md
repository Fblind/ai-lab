---
name: grill-discovery
description: >-
  Relentless interview for a discovery until problem, user journey,
  desired outcomes, and scope are settled. Use when the user invokes
  /grill-discovery, or asks to grill a discovery, a roadmap ticket, or the
  discovery phase.
disable-model-invocation: true
---

# Grill a discovery

Interview until the discovery design tree is settled. The tree is only:

- problem, and who has it
- user journey
- desired outcomes
- scope boundaries
- gaps

Requirements and the implementation plan are out of this session. Do not create tracker tasks. Do not update the roadmap ticket description.

## Rounds

Work the tree in rounds. The frontier is every decision whose prerequisites are already settled: the questions you can ask now without guessing at answers you have not heard yet. Ask the whole frontier in one round, then wait.

Format each question like this:

```
❓ **Q1** - **<question title>**: <question body>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer. A question whose answer depends on another question still open in this round belongs to a later round.

Settled decisions push the frontier outward. Recompute it and ask the next round.

## Facts and decisions

Look facts up yourself: the roadmap ticket, the product's public docs, and the engineering docs the pack lists. Do not ask the user for something you can look up. A lookup still running is an unsettled prerequisite, so only the questions downstream of it wait. Ask the rest of the frontier now.

The decisions belong to the user. Put each one to them and wait.

## Done

The session is done when the frontier is empty: every branch visited, nothing left assumed. Do not write the discovery outcome until the user confirms you have reached a shared understanding.

When they confirm:

- If **project-discovery** started this skill, stop and return to that agent. It writes the discovery outcome.
- If the user invoked `/grill-discovery` directly, follow the **project-discovery** agent to write the discovery outcome and, after they approve that document, the tracker page.
