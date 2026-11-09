---
name: record-demo
description: >-
  Scripted demo of acceptance criteria. One scene file, a coverage plan, a
  headless dry run, then one video with captions. Use when the user asks to
  record a demo, show the criteria, or add evidence a reviewer can watch.
---

# Record a demo

One short video in which every acceptance criterion appears. The recorder is `core/skills/record-demo/scripts/record.mjs`. Each run only writes a scene file (`*.scenes.mjs`). Do not write a new recorder.

Format: [references/scene-format.md](references/scene-format.md). Template: [examples/minimal.scenes.mjs](examples/minimal.scenes.mjs) (a static page, no server).

The app under test must already be running locally, with fake data. How to log in, which URL, and which fixtures belong in the scene file. This skill does not start a stack and does not know any one product.

Put the scene file next to the spec, outside the product repo. Point `outDir` outside the repo too (the template uses the system temp directory).

## 0. Prerequisites

Playwright is resolved by `core/skills/record-demo/scripts/record.mjs` from `PLAYWRIGHT_PATH` (the directory of an installed `playwright` package), then from `require("playwright")` in the current directory or the scene directory. Browsers live in Playwright's cache (`~/Library/Caches/ms-playwright`, `~/.cache/ms-playwright`, or `%USERPROFILE%\AppData\Local\ms-playwright`).

From this repo the recorder is `core/skills/record-demo/scripts/record.mjs`. After install, the same script sits inside the skill folder your tool loaded.

## 1. Coverage plan (before any browser)

1. List every acceptance criterion from the spec as `criteria: {C01: "...", ...}`.
2. Map each one to a scene and to how it is shown:
   - `ui`: live in the app. Prefer this.
   - `api`: an `apiPanel` that shows what another channel or service returns. Say so in the caption.
   - `card`: a title card. Use it for an operator procedure, or for something the system does not enforce.
   - `tests`: a title card that says automated tests cover it. Use it only when the UI cannot show it locally, and say why.
3. For each `ui` or `api` scene, list its prerequisites (seed data, a permission, a date, a completed earlier step) and write a `preflight` that checks them, plus a `fallback` card.
4. Run the plan. It must print no `MISSING`. Nothing is skipped in silence.

```bash
node core/skills/record-demo/scripts/record.mjs <file> --plan
```

A criterion with no scene fails the plan. A procedure you cannot click still gets a card.

## 2. Dry run (no video)

```bash
node core/skills/record-demo/scripts/record.mjs <file> --dry
node core/skills/record-demo/scripts/record.mjs <file> --dry --only S4
```

- One line per scene: `PASS`, `FAIL`, or `PREFLIGHT-FAIL`, then the scene id, criteria, how, step count and time. `GUARD` lines name visible text that must not be published.
- On a failure, open only the printed `failure-<scene>-step<n>.png`, fix that step, and rerun with `--only`. Reset app state first if the flow changes data.
- Do not browse the app by hand, and do not take extra screenshots, unless a step fails.
- Add `expect` where the criterion is a visible state, so the dry run proves the behavior.
- Every preflight passes, or its scene has a fallback you will report. Fix a missing prerequisite when you reasonably can (seed data, a flag) before you accept a fallback.

Waits in `--dry` are scaled by `dryScale` (default 0.05). A step that passes only in `--record` is waiting on a clock: use `waitFor` or `expect` instead.

The template is the self-test. `--plan` needs no browser. `--dry` needs Playwright and opens `examples/minimal.html`.

## 3. Record once

Reset the app state, then:

```bash
node core/skills/record-demo/scripts/record.mjs <file> --record
```

The recorder reruns the preflights, swaps a failing scene for its fallback card, records one headless video, and appends a summary card listing every criterion and how it was shown. It writes `<name>.webm` (or `.mp4` when ffmpeg is on `PATH`) and `<name>-captions.md`.

A `GUARD` hit exits 1. Mask with `css` or `masks`, or change the data. If the hit is a false positive, pass `--allow-guard` and say so in the report. Do not mask the product's own logo, name, or copyright line. The wording rule covers only our text: captions, panels, cards, and file names.

## 4. Check

- The `VIDEO` line gives path, size and duration. Keep it under 25 MB, and about 2 to 4 minutes. To shorten, cut `ms` holds, not scenes.
- Read the captions file. Every criterion is in Coverage. Wording is English. No secrets, no local paths, no customer names, no mention of the assistant.
- Spot-check a frame only when a line looks wrong. Do not read the video file.

## 5. Where the files go

Leave the video and the captions file next to the spec, under `evidence/`. One row per criterion: the file name, or the captions timestamp, or the test path when the criterion is not visible. The product repo does not get the video.

Before you hand the files to anyone: fake data only. No personal data, credentials, real ids, or local paths on screen. 1440x900. webm is fine when ffmpeg cannot make mp4.

## Report

Video path, duration, size, and a coverage table (criterion to UI, API, card, or fallback). Every fallback gets its reason, for example "C09 shown as a card: the payment preflight failed (module not seeded)". List any guard hit you allowed with `--allow-guard`.

A bug seen while recording is not hidden by a scene that avoids it. Note it. If it is in this change, fix it. If it is not, say so in the report and use a fallback card that says the live path failed.

## Gotchas

- Captions, panels and cards persist across navigations. Clear them with `{caption: null}`, `{panel: null}`, or `{card: null}`.
- Logins are cached per user. Use `{login: "x", fresh: true}` after changing that user's permissions.
- Run this as its own session: write the scene file, `--dry`, `--record`, report.
