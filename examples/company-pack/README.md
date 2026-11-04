# Example company pack: Acme Tickets

A **pack** is a folder with the same shape as `core/` (`agents/`, `rules/`, `skills/`) that holds everything specific to one company. The core stays generic; the pack answers the questions the core leaves open:

| Question the core asks | Where this pack answers it |
|---|---|
| Which repos exist, how are they laid out, and what is the test command for each? | `rules/acme-repos.mdc` |
| What do feature flags look like and how are they named? | `rules/acme-feature-flags.mdc` |
| Which tracker, which list per repo, how are tickets, documents and links named? | `rules/acme-tracker-conventions.mdc` + `tracker-mapping.md` |
| Which API client collection do we save manual checks in, and how? | `skills/acme-api-client-collection/SKILL.md` |
| Which shared packages need bump follow-up tasks? | `rules/acme-shared-packages.mdc` |
| Which config values do I put in `kit.config.json`? | `kit.config.example.json` |

**Acme Tickets is fictional.** It sells event tickets: orders, refunds, seat holds and events. Replace every `acme-*` name, URL and rule with your own. Nothing here is a real company's configuration.

## Use it

```bash
# preview, then install core + this pack for Cursor
node scripts/install.mjs --target cursor --pack examples/company-pack --dry-run
node scripts/install.mjs --target cursor --pack examples/company-pack

# same for Claude Code
node scripts/install.mjs --target claude --pack examples/company-pack
```

Then copy the values you want from `kit.config.example.json` into `kit.config.local.json` (git-ignored) at the repo root. The skills read `kit.config.json` / `kit.config.local.json`.

## Make your own pack

1. Copy this folder to `packs/<your-company>/` (or keep it under `examples/`; the installer only accepts packs inside the repo).
2. Rename every file with a company prefix so names never clash with `core/` (the installer refuses duplicates).
3. Replace the contents. Keep each rule short, with a `description` precise enough that the tool loads it only when it matters.
4. Run `node scripts/install.mjs --target <tool> --pack packs/<your-company> --dry-run`.
5. Keep company packs **private**. The public repo only needs this fictional example.

## What is in here

```
company-pack/
├── README.md
├── kit.config.example.json
├── tracker-mapping.md
├── rules/
│   ├── acme-repos.mdc
│   ├── acme-feature-flags.mdc
│   ├── acme-tracker-conventions.mdc
│   └── acme-shared-packages.mdc
└── skills/
    └── acme-api-client-collection/SKILL.md
```
