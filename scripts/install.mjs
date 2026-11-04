#!/usr/bin/env node
/**
 * Link the kit's agents, skills and rules into the config folder of a coding tool.
 *
 *   node scripts/install.mjs --target cursor|claude [--pack <dir>] [--dry-run] [--home <dir>] [--prune]
 *
 * Safety rules:
 *  - Sources must resolve inside this repository (a symlink that escapes is refused).
 *  - Destinations must resolve inside the target home.
 *  - Nothing is deleted. A file or folder that is in the way is moved to
 *    <home>/.kit-backups/<timestamp>/ before the link is created.
 *  - Only symlinks that point into this repository are ever removed, and only with --prune.
 *  - --dry-run prints what would happen and changes nothing.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { expandHome, isInside, loadConfig, parseArgs, repoRoot, timestamp } from "./lib.mjs";

const KINDS = ["agents", "skills", "rules"];

function usage(message) {
  if (message) console.error(`error: ${message}\n`);
  console.error(
    "usage: node scripts/install.mjs --target <name> [--pack <dir>]... [--dry-run] [--prune] [--home <dir>]\n" +
      "  --target   a key of `targets` in kit.config.json (cursor, claude, or your own)\n" +
      "  --pack     a company pack folder inside this repo (repeatable), e.g. examples/company-pack\n" +
      "  --home     override the target's home folder (useful for tests)\n" +
      "  --prune    unlink stale symlinks that point into this repo\n" +
      "  --dry-run  show what would change, change nothing",
  );
  process.exit(message ? 2 : 0);
}

let args;
try {
  args = parseArgs(process.argv.slice(2), {
    flags: ["dry-run", "prune", "help"],
    options: ["target", "pack", "home"],
  });
} catch (error) {
  usage(error.message);
}
if (args.help) usage();

const config = loadConfig();
const targetName = args.target?.[0] ?? "cursor";
const target = config.targets?.[targetName];
if (!target) usage(`unknown target "${targetName}". Known: ${Object.keys(config.targets ?? {}).join(", ")}`);

const dryRun = Boolean(args["dry-run"]);
const home = resolve(expandHome(args.home?.[0] ?? target.home));
const backupDir = join(home, ".kit-backups", timestamp());
const stats = { ok: 0, linked: 0, backedUp: 0, pruned: 0 };

function say(verb, detail) {
  console.log(`${dryRun ? "[dry-run] would " : ""}${verb} ${detail}`);
}

/** Sources of one kind: [{ name, source }] from core/ and every pack. Duplicate names are an error. */
function collect(kind, roots) {
  const found = new Map();
  for (const root of roots) {
    const dir = join(root, kind);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir).sort()) {
      if (entry.startsWith(".")) continue;
      const source = realpathSync(join(dir, entry));
      if (!isInside(repoRoot, source)) {
        throw new Error(`Refusing ${join(dir, entry)}: it resolves outside the repository (${source})`);
      }
      const name = installedName(kind, entry);
      if (found.has(name)) {
        throw new Error(`Name clash for ${kind}/${name}: ${found.get(name).source} and ${source}`);
      }
      found.set(name, { name, source });
    }
  }
  return [...found.values()];
}

/** Rules keep their stem and take the target's extension (.mdc for Cursor, .md for Claude Code). */
function installedName(kind, entry) {
  if (kind !== "rules") return entry;
  const ext = target.ruleExtension ?? extname(entry);
  return basename(entry, extname(entry)) + ext;
}

function backup(dest) {
  const rel = relative(home, dest);
  const to = join(backupDir, rel);
  say("move", `${dest} -> ${to}`);
  if (!dryRun) {
    mkdirSync(dirname(to), { recursive: true });
    renameSync(dest, to);
  }
  stats.backedUp++;
}

function link(source, dest) {
  if (!isInside(home, dest)) throw new Error(`Refusing to write outside ${home}: ${dest}`);
  let current = null;
  try {
    current = lstatSync(dest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (current) {
    if (current.isSymbolicLink() && resolve(dirname(dest), readlinkSync(dest)) === source) {
      console.log(`ok ${dest}`);
      stats.ok++;
      return;
    }
    backup(dest);
  }
  say("link", `${dest} -> ${source}`);
  if (!dryRun) symlinkSync(source, dest);
  stats.linked++;
}

/** Unlink symlinks in destDir that point into this repo but whose source no longer exists. */
function prune(destDir, wanted) {
  if (!existsSync(destDir)) return;
  for (const name of readdirSync(destDir)) {
    if (wanted.has(name)) continue;
    const dest = join(destDir, name);
    const current = lstatSync(dest);
    if (!current.isSymbolicLink()) continue;
    const pointsTo = resolve(dirname(dest), readlinkSync(dest));
    if (!isInside(repoRoot, pointsTo)) continue;
    say("unlink", `${dest} (stale)`);
    if (!dryRun) unlinkSync(dest);
    stats.pruned++;
  }
}

const packs = (args.pack ?? []).map((p) => resolve(repoRoot, p));
for (const pack of packs) {
  if (!existsSync(pack)) usage(`pack not found: ${pack}`);
  if (!isInside(repoRoot, realpathSync(pack))) usage(`pack must live inside the repository: ${pack}`);
}
const roots = [join(repoRoot, "core"), ...packs];

try {
  console.log(`target: ${targetName}  home: ${home}${dryRun ? "  (dry run)" : ""}`);
  for (const kind of KINDS) {
    const folder = target[kind];
    if (!folder) continue;
    const destDir = join(home, folder);
    if (!isInside(home, destDir)) throw new Error(`Target folder escapes home: ${destDir}`);
    const items = collect(kind, roots);
    if (!dryRun) mkdirSync(destDir, { recursive: true });
    for (const { name, source } of items) link(source, join(destDir, name));
    if (args.prune) prune(destDir, new Set(items.map((i) => i.name)));
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}

console.log(
  `${dryRun ? "Dry run: " : ""}${stats.linked} linked, ${stats.ok} already ok, ` +
    `${stats.backedUp} backed up, ${stats.pruned} pruned.` +
    (stats.backedUp && !dryRun ? ` Backups are in ${backupDir}` : ""),
);
