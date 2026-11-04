import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));

export function expandHome(p) {
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

/** True when `child` is `parent` or lives under it (after resolving `..`). */
export function isInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel) && !rel.startsWith(`..${sep}`));
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${path}: ${error.message}`);
  }
}

/** kit.config.json, overridden key by key (shallow) by kit.config.local.json when present. */
export function loadConfig() {
  const base = readJson(join(repoRoot, "kit.config.json"));
  const localPath = join(repoRoot, "kit.config.local.json");
  if (!existsSync(localPath)) return base;
  const local = readJson(localPath);
  const merged = { ...base, ...local };
  merged.targets = { ...base.targets, ...(local.targets ?? {}) };
  merged.sync = { ...base.sync, ...(local.sync ?? {}) };
  return merged;
}

/** Tiny argv parser: --flag, --key value, --key=value. Repeated keys collect into arrays. */
export function parseArgs(argv, { flags = [], options = [] } = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out._.push(arg);
      continue;
    }
    const [rawKey, inline] = arg.slice(2).split(/=(.*)/s, 2);
    if (flags.includes(rawKey)) {
      out[rawKey] = true;
    } else if (options.includes(rawKey)) {
      const value = inline ?? argv[++i];
      if (value === undefined) throw new Error(`Missing value for --${rawKey}`);
      (out[rawKey] ??= []).push(value);
    } else {
      throw new Error(`Unknown option --${rawKey}`);
    }
  }
  return out;
}
