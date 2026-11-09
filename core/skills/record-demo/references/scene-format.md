# Scene file format

A scene file is an ES module (`*.scenes.mjs`) whose default export drives `core/skills/record-demo/scripts/record.mjs`.
The template is [minimal.scenes.mjs](../examples/minimal.scenes.mjs): a static page, three criteria, no login. Copy it next to the spec and replace the steps. Do not write a second recorder.

## Top level

| Key | Meaning |
|---|---|
| `name` | Output basename: `<outDir>/<name>.webm` (or `.mp4`) and `<name>-captions.md` |
| `title`, `footer` | Captions heading; footer goes on the summary card (for example "Local environment, fake data") |
| `outDir` | Relative to the scene file, or absolute. Keep it outside any product repo (default `demo-out`) |
| `baseURL`, `viewport` | Default viewport 1440x900. Relative `goto` paths use `baseURL` |
| `criteria` | `{C01: "short description", ...}`: every acceptance criterion. `--plan` fails if one has no scene |
| `intro`, `introMs` | Title card HTML shown first (default 9 s) |
| `summaryCard` | Default on: final card lists every criterion and how it was shown (UI / API check / title card) |
| `users`, `login(page, user, {state})` | Users are logged in on a hidden context; cookies are copied into the recorded one |
| `startUser`, `startUrl` | Session and first page before the intro |
| `css` | Extra CSS injected on every page (mask account ids, debug badges). Leave the product's own logo and name visible |
| `masks` | Extra `[regex, replacement]` applied to caption, panel and card HTML. 24-hex ids and UUIDs are masked by default |
| `forbidden` / `extraForbidden` | Visible-text guard. Defaults: on the whole page, 24-hex ids, local paths, emails outside example.com, example.org and example.net; on our captions, panels and cards only, the word "claude". `forbidden: false` turns the defaults off |
| `api` | Helpers available as `h.api` inside step functions |
| `timeout` | Per-action timeout, default 30000 ms |
| `dryScale` | Multiplier for waits in `--dry` (default 0.05) |
| `mp4`, `maxMB` | `mp4: false` keeps webm even if ffmpeg exists; size warning threshold (default 25) |
| `notes` | Appended to the captions file |

## Scene

`{id, criteria: ["C01"], how: "ui"|"api"|"card"|"tests", preflight?, fallback?, steps: [...]}`

- `how` is what the plan, the captions file and the summary card report: `ui` live in the app, `api` an API panel, `card` an explanation on a title card (operator procedures), `tests` a card saying automated tests cover it.
- `preflight: async h => {}` runs before any recording (`h`: `fetchJson`, `scratchPage(userKey)`, `api`, `state`, `render`). Throw, or return a string or `false`, when a prerequisite is missing (seed data, a permission, a date).
- `fallback: {text | card, ms}`: in `--record`, a scene whose preflight failed is replaced by a title card that names its criteria. With no fallback, the recording aborts (unless `--allow-missing`).

## Steps

Each step is an object with one action key, plus an optional `ms` to hold afterwards (scaled down in `--dry`).
A locator `spec` is a CSS selector string or `{role, name} | {label} | {text} | {placeholder} | {testId} | {css}` plus optional `has`, `hasText`, `visible`, `nth`, `exact`. Defaults to `.first()`.

| Step | Effect |
|---|---|
| `{goto: "/path"}` | Navigate, wait for the overlay, run the guard. `settle` ms (default 800) |
| `{click: spec}` `{hover: spec}` | Moves the visible cursor there first. `force: true` is available |
| `{fill: spec, value, tab?}` / `{type: spec, value, delay?}` | Instant fill, or visible typing |
| `{select: spec, option: "Label"}` `{check: spec}` `{uncheck: spec}` `{press: spec, key}` | Form actions |
| `{waitFor: spec, state?}` `{waitForURL: pattern}` `{wait: ms}` | Synchronization |
| `{expect: spec, text?}` | Assertion. The dry run then catches a wrong state, not only a missing element |
| `{caption: html, pos?}` / `{caption: null}` | Bottom caption. It stays across navigations until cleared. Use `<span class="tag">C01</span>` for criterion tags |
| `{card: html, ms?}` / `{card: null}` | Full-screen title card. With `ms`, shown for that long, then removed |
| `{panel: html \| h => html, pos?, ms?}` | Floating panel. `h.render.kv`, `table`, `json`, `tag` and `esc` build HTML |
| `{apiPanel: {title, fetch: h => data, render?: (data, h) => html, note}, ms, criteria?}` | Fetches on the Node side (no CSP or CORS), then renders a panel |
| `{login: "userKey", fresh?, as?, goto?}` | Switch session behind a "Signing in as" card. `fresh: true` logs in again after a permission change |
| `{log: h => string}` | Prints a value to the console. Not shown in the video |
| `{run: async h => {}}` | Escape hatch. `h.page` is the Playwright page |
| `{guard: true}` | Run the visible-text guard now. It also runs after each `goto` and at the end of each scene |

Optional `criteria` on a caption, card or panel step overrides the scene's criteria in the captions file.

## Output (`--record`)

- `<outDir>/<name>.webm`, converted to `.mp4` (H.264, CRF 28) when `ffmpeg` is on `PATH`.
- `<outDir>/<name>-captions.md`: a timestamped table of every caption, card and panel, plus coverage per criterion.
- Exit code 1 if a scene failed, the recording aborted, or the guard matched. `--allow-guard` overrides the guard after you have checked the hit is a false positive.

## Dates

Compute dates from today inside the scene file (`Date.now()` plus a number of days) so the same file still finds the right trip or the right row on a later run.
