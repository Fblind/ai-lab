---
name: session-lessons
description: >-
  Captures lessons learned from the current coding session into a personal
  second brain (a plain folder of markdown notes). Use when the user invokes /session-lessons, asks to capture
  lessons learned, record what we learned, or save session lessons at the
  end of a session.
disable-model-invocation: true
---

# Session lessons

Turn this session into a few lessons in the second brain. A lesson is a specific thing this session taught that should change how a future session works. Show the lessons and wait for confirmation before writing any file.

The only files this skill writes are lesson files and `INDEX.md` in the second brain folder. Leave skills, rules, and other repos untouched.

## 1. Read the session

Done when you can name the repo, the task, and the changes this session actually produced.

- Treat this chat as the session.
- In the repo, run `git status`, `git diff`, and `git diff --cached`.
- When that diff is empty, or the chat refers to commits from this session, read `git log -15 --oneline` and `git show` for those commits. Leave older history alone.

## 2. Propose lessons

Done when every lesson is backed by this session, and you have three to seven of them — or fewer, when the session does not support that many.

Each lesson has:

- **Context** — repo and task
- **What happened**
- **What we learned**
- **Actionable rule** — one line: "Next time, do X"
- **Evidence** — a file path, commit, or PR from this session
- **Tags** — a few lowercase words
- **skill_target** — the skill or rule this lesson would change, or `new-skill`

Set `skill_target` from the skill directory names and rule file stems of the installed target (the paths come from `kit.config.json`; for Cursor that is `~/.cursor/{skills,rules}`, for Claude Code `~/.claude/skills`). Use `new-skill` when none of them is the thing the lesson would change.

Keep each field to one or two sentences. Keep a lesson only when the session produced a mistake, a surprise, a decision, or a repeated correction. Skip typos, formatting, and one-off tool glitches.

Every lesson cites evidence from this session. When nothing qualifies, say so and stop.

## 3. Confirm

Done when the user has accepted the set, including any edits and drops.

Show the lessons in a numbered list with the fields above. Ask them to confirm, drop, or edit wording, tags, and `skill_target`. Write nothing until they answer. Dropped lessons are not saved.

## 4. Save

Done when each confirmed lesson is one file under the second brain folder and `INDEX.md` has one new row per file.

Save only there. The second brain folder is `secondBrain` in `kit.config.json` (default `~/second-brain`). Create it and `lessons/` when they do not exist, after telling the user the path.

Read [lesson-template.md](lesson-template.md) and fill one copy per lesson.

- **date** — today, `YYYY-MM-DD`
- **path** — `<second-brain>/lessons/YYYY-MM-DD-<topic>.md`, with `<topic>` a short kebab-case title. If that file exists, append `-2`, `-3`, and so on
- **status** — `new`

When `<second-brain>/INDEX.md` is missing, create it:

```markdown
# Lessons

One row per lesson. The lesson file is the source of truth. `status` stays `new` until a later review sets `applied` or `discarded`.

| Date | Title | Repo | Tags | skill_target | Status | File |
|------|-------|------|------|--------------|--------|------|
```

When it exists, append one row per lesson. Leave existing rows as they are.

Do not commit.

## Later

A separate `review-lessons` skill (not part of this kit yet) would read these files. It groups lessons with `status: new` by `skill_target`, proposes changes to that skill or rule, suggests a new skill when one topic appears 3 or more times, and then sets `status: applied`. This skill does not do that.
