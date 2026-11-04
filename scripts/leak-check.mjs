#!/usr/bin/env node
/**
 * Fail when the repository contains anything listed in scripts/leak-patterns.txt,
 * or a broken relative link / `docs/*.md` reference.
 *
 *   node scripts/leak-check.mjs [--no-links]
 *
 * Reads files only; never writes. The patterns file itself, .git, node_modules and
 * .kit-backups are not scanned.
 */
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { isInside, parseArgs, repoRoot } from "./lib.mjs";

const args = parseArgs(process.argv.slice(2), { flags: ["no-links"] });
const PATTERNS_FILE = join(repoRoot, "scripts", "leak-patterns.txt");
const SKIP_DIRS = new Set([".git", "node_modules", ".kit-backups"]);

function loadPatterns() {
  const rules = [];
  for (const [index, raw] of readFileSync(PATTERNS_FILE, "utf8").split("\n").entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(all|core):\s*(.+)$/.exec(line);
    if (!match) throw new Error(`leak-patterns.txt:${index + 1}: expected "all: <regex>" or "core: <regex>"`);
    rules.push({ scope: match[1], source: match[2], regex: new RegExp(match[2], "i") });
  }
  return rules;
}

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) yield* walk(path);
    else if (stat.isFile()) yield path;
  }
}

function isText(buffer) {
  return !buffer.subarray(0, 4096).includes(0);
}

const rules = loadPatterns();
const findings = [];

for (const file of walk(repoRoot)) {
  if (file === PATTERNS_FILE) continue;
  const rel = relative(repoRoot, file);
  const buffer = readFileSync(file);
  if (!isText(buffer)) continue;
  const text = buffer.toString("utf8");
  const inExamples = rel.startsWith("examples/");
  const active = rules.filter((rule) => !(rule.scope === "core" && inExamples));

  // File names count too.
  for (const rule of active) {
    if (rule.regex.test(rel)) findings.push(`${rel}: file name matches /${rule.source}/`);
  }

  const isMarkdown = rel.endsWith(".md");
  const dir = dirname(file);
  let fenced = false;
  text.split("\n").forEach((line, i) => {
    for (const rule of active) {
      if (rule.regex.test(line)) findings.push(`${rel}:${i + 1}: matches /${rule.source}/`);
    }
    if (args["no-links"]) return;

    // Backticked repo paths must exist (placeholders with <...>, "..." or "xxx" are skipped).
    for (const m of line.matchAll(/`((?:docs|core|scripts|examples)\/[A-Za-z0-9_.\/<>-]+\.(?:md|mdc|mjs|json|txt|yml))`/g)) {
      if (/[<>]|\.\.\.|xxx/.test(m[1])) continue;
      if (!existsSync(resolve(repoRoot, m[1]))) findings.push(`${rel}:${i + 1}: missing file reference: ${m[1]}`);
    }

    // Relative markdown links must resolve inside the repo (code blocks and inline code are ignored).
    if (!isMarkdown) return;
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) return;
    const prose = line.replace(/`[^`]*`/g, "");
    for (const m of prose.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      const resolved = resolve(dir, target);
      if (!isInside(repoRoot, resolved)) findings.push(`${rel}:${i + 1}: link leaves the repository: ${target}`);
      else if (!existsSync(resolved)) findings.push(`${rel}:${i + 1}: broken link: ${target}`);
    }
  });
}

if (findings.length) {
  console.error(`leak-check: ${findings.length} finding(s)\n`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}
console.log("leak-check: clean");
