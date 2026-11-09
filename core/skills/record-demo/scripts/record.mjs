#!/usr/bin/env node
// Declarative demo recorder: node record.mjs <scenes.mjs> [--plan|--dry|--record] [--only S1,S2] [--headed] [--bail] [--allow-guard]
//   --plan    no browser: print the coverage plan (criterion -> scene -> how) and exit 1 if a criterion has no scene
//   --dry     (default) run every scene without video, waits scaled down, screenshot only on failure
//   --record  preflight all scenes, switch failing ones to their fallback card, then record ONE video + captions .md
// Playwright: $PLAYWRIGHT_PATH (dir of the playwright package) > require('playwright') from cwd / scene dir.
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import {execFileSync} from "node:child_process";

const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const opt = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const sceneFile = argv.find(a => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--only");
if (!sceneFile) { console.error("usage: node record.mjs <scenes.mjs> [--plan|--dry|--record] [--only S1,S2] [--headed] [--bail] [--allow-guard]"); process.exit(64); }
const MODE = flag("--record") ? "record" : flag("--plan") ? "plan" : "dry";
const ONLY = opt("--only") ? opt("--only").split(",") : null;
const t = () => new Date().toISOString().slice(11, 19);
const say = (...a) => console.log(t(), ...a);
const short = (e, n = 240) => String(e && e.message || e).replace(/\x1b\[[0-9;]*m/g, "").split("\n").filter(Boolean).slice(0, 3).join(" | ").slice(0, n);

function loadPlaywright(sceneDir) {
  const tries = [];
  if (process.env.PLAYWRIGHT_PATH) tries.push(process.env.PLAYWRIGHT_PATH);
  tries.push("playwright");
  for (const base of [process.cwd(), sceneDir]) {
    const req = createRequire(path.join(base, "noop.js"));
    for (const id of tries) { try { return req(id); } catch { /* next */ } }
  }
  console.error("Playwright not found. Set PLAYWRIGHT_PATH to a node_modules/playwright directory, or run from a project that depends on playwright.");
  process.exit(69);
}

// ---------- Overlay injected into every document of the recorded context ----------
const OVERLAY = (extraCss) => {
  const css = `
    #demo-cursor{position:fixed;z-index:2147483646;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
      background:rgba(255,196,0,.55);border:2px solid #d48800;pointer-events:none;transition:transform .12s;left:-50px;top:-50px}
    #demo-cursor.down{transform:scale(.6)}
    #demo-caption{position:fixed;left:24px;bottom:96px;z-index:2147483645;max-width:900px;background:rgba(17,24,39,.92);color:#fff;
      font:500 21px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;padding:14px 24px;border-radius:12px;
      box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none;text-align:left}
    #demo-caption b{color:#ffd166}
    .tag{display:inline-block;background:#ffd166;color:#111;border-radius:6px;padding:0 8px;margin-right:10px;font-weight:700;font-size:17px}
    #demo-panel{position:fixed;z-index:2147483644;background:#fff;border:2px solid #111827;border-radius:14px;max-width:760px;
      box-shadow:0 10px 30px rgba(0,0,0,.25);font:15px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111;padding:16px 20px}
    #demo-panel h3{margin:0 0 8px;font-size:17px}
    #demo-panel .kv{display:flex;flex-wrap:wrap;gap:12px;margin:6px 0 10px}
    #demo-panel .kv div{background:#f3f4f6;border-radius:8px;padding:6px 12px}
    #demo-panel .kv b{font-size:20px} #demo-panel .ok{background:#dcfce7!important} #demo-panel .bad{background:#fee2e2!important}
    #demo-panel table{border-collapse:collapse;font-size:14px} #demo-panel td,#demo-panel th{border-bottom:1px solid #e5e7eb;padding:4px 10px;text-align:left}
    #demo-panel pre{margin:0;font-size:13px;max-height:420px;overflow:hidden;background:#f9fafb;padding:8px;border-radius:8px}
    #demo-panel .note{color:#374151;font-size:14px;margin-top:6px}
    #demo-card{position:fixed;inset:0;z-index:2147483647;background:#111827;color:#fff;display:flex;flex-direction:column;
      align-items:center;justify-content:center;font:500 22px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;text-align:center;padding:60px}
    #demo-card h1{font-size:40px;margin:0 0 18px} #demo-card ul{text-align:left;font-size:21px} #demo-card .foot{margin-top:18px;color:#ffd166}
  ` + (extraCss || "");
  const ss = {get: k => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } }, rm: k => { try { sessionStorage.removeItem(k); } catch { /* private mode */ } }};
  const mount = () => {
    if (document.getElementById("demo-style")) return;
    const st = document.createElement("style"); st.id = "demo-style"; st.textContent = css; document.head.appendChild(st);
    const cur = document.createElement("div"); cur.id = "demo-cursor"; document.body.appendChild(cur);
    const xy = ss.get("demo-cursor-xy");
    if (xy) { const [l, tp] = xy.split(","); cur.style.left = l + "px"; cur.style.top = tp + "px"; }
    document.addEventListener("mousemove", e => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; ss.set("demo-cursor-xy", e.clientX + "," + e.clientY); }, true);
    document.addEventListener("mousedown", () => cur.classList.add("down"), true);
    document.addEventListener("mouseup", () => cur.classList.remove("down"), true);
    const el = (id, html, pos, persist) => {
      let c = document.getElementById(id);
      if (persist) { if (html) { ss.set(id, html); ss.set(id + "-pos", JSON.stringify(pos || null)); } else { ss.rm(id); } }
      if (!html) { if (c) c.remove(); return; }
      if (!c) { c = document.createElement("div"); c.id = id; document.body.appendChild(c); }
      c.removeAttribute("style"); if (pos) Object.assign(c.style, pos);
      c.innerHTML = html;
    };
    window.__demo = {
      caption: (h, p) => el("demo-caption", h, p, true),
      panel: (h, p) => el("demo-panel", h, p || {left: "30px", top: "430px"}, true),
      card: h => el("demo-card", h, null, true),
    };
    for (const id of ["demo-caption", "demo-panel", "demo-card"]) {
      const h = ss.get(id); if (h) el(id, h, JSON.parse(ss.get(id + "-pos") || "null"), false);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
};

// ---------- Panel renderers (Node side, return HTML) ----------
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const render = {
  esc,
  tag: s => `<span class="tag">${esc(s)}</span>`,
  kv: (obj, cls = {}) => `<div class="kv">${Object.entries(obj).map(([k, v]) => `<div class="${cls[k] || ""}">${esc(k)} <b>${esc(v)}</b></div>`).join("")}</div>`,
  table: rows => !rows.length ? "" : `<table><tr>${Object.keys(rows[0]).map(k => `<th>${esc(k)}</th>`).join("")}</tr>${rows.map(r => `<tr>${Object.values(r).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</table>`,
  json: (obj, maxLines = 18) => `<pre>${esc(JSON.stringify(obj, null, 2).split("\n").slice(0, maxLines).join("\n"))}</pre>`,
  card: (title, bodyHtml, foot) => `<h1>${esc(title)}</h1>${bodyHtml || ""}${foot ? `<div class="foot">${esc(foot)}</div>` : ""}`,
};
const DEFAULT_MASKS = [[/\b[0-9a-f]{24}\b/gi, "•••"], [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "•••"]];
// Wording rules apply to our own text (captions, panels, cards). The product's real UI may show its own names.
const DEFAULT_WORDING = [/claude/i];
// Data rules apply to everything visible.
const DEFAULT_FORBIDDEN = [/\b[0-9a-f]{24}\b/i, /\/Users\/|\/home\/|[A-Z]:\\/, /[\w.+-]+@(?!example\.(com|org|net)\b)[\w-]+\.[\w.]+/i];

// ---------- Main ----------
const scenePath = path.resolve(sceneFile);
const cfg = (await import(pathToFileURL(scenePath).href)).default;
const sceneDir = path.dirname(scenePath);
const scenes = cfg.scenes.filter(s => !ONLY || ONLY.includes(s.id));
const criteria = cfg.criteria || {};
const VIEW = cfg.viewport || {width: 1440, height: 900};
const OUT = path.resolve(sceneDir, cfg.outDir || "demo-out");
const NAME = cfg.name || path.basename(scenePath).replace(/\.scenes?\.m?js$|\.m?js$/, "");
const SCALE = MODE === "dry" ? (cfg.dryScale ?? 0.05) : 1;
const masks = [...DEFAULT_MASKS, ...(cfg.masks || [])];
const forbidden = [...(cfg.forbidden === false ? [] : DEFAULT_FORBIDDEN), ...(cfg.extraForbidden || [])];
const wording = cfg.forbidden === false ? [] : DEFAULT_WORDING;
const mask = html => html == null ? html : masks.reduce((h, [re, rep]) => h.replace(re, rep), String(html));
const howLabel = {ui: "UI", api: "API check", card: "Explained (title card)", tests: "Covered by automated tests (title card)"};

function coveragePlan() {
  const map = {};
  for (const s of cfg.scenes) for (const c of s.criteria || []) (map[c] = map[c] || []).push(`${s.id}:${s.how || "ui"}`);
  const missing = Object.keys(criteria).filter(c => !map[c]);
  const unknown = Object.keys(map).filter(c => Object.keys(criteria).length && !criteria[c]);
  console.log("COVERAGE PLAN");
  for (const c of Object.keys(criteria)) console.log(`  ${c.padEnd(5)} ${(map[c] || ["MISSING"]).join(", ").padEnd(28)} ${criteria[c]}`);
  for (const c of unknown) console.log(`  ${c} used by a scene but not listed in criteria`);
  for (const s of cfg.scenes) if ((s.how === "card" || s.how === "tests") && !s.steps?.some(st => "card" in st)) console.log(`  WARN ${s.id} is how=${s.how} but has no card step`);
  return {map, missing};
}

const {missing} = coveragePlan();
if (missing.length) { console.log(`FAIL criteria without a scene: ${missing.join(", ")} (add a scene, even a title card)`); if (MODE !== "dry" || !ONLY) process.exit(1); }
if (MODE === "plan") process.exit(0);

const {chromium} = loadPlaywright(sceneDir);
fs.mkdirSync(OUT, {recursive: true});
const browser = await chromium.launch({headless: !flag("--headed")});
const ctxOpts = {viewport: VIEW, bypassCSP: cfg.bypassCSP !== false, baseURL: cfg.baseURL, ignoreHTTPSErrors: true, ...(cfg.contextOptions || {})};
const cookieCache = {};
const state = {};
const users = cfg.users || {};

async function loginCookies(userKey, fresh) {
  if (!fresh && cookieCache[userKey]) return cookieCache[userKey];
  const user = users[userKey]; if (!user) throw new Error(`unknown user ${userKey}`);
  if (!cfg.login) throw new Error("scene file has users but no login(page, user) function");
  const ctx = await browser.newContext(ctxOpts);
  const p = await ctx.newPage(); p.setDefaultTimeout(cfg.timeout || 30000);
  try { await cfg.login(p, user, {state}); cookieCache[userKey] = await ctx.cookies(); }
  catch (e) { await p.screenshot({path: path.join(OUT, `failure-login-${userKey}.png`)}).catch(() => {}); throw new Error(`login ${userKey}: ${short(e)}`); }
  finally { await ctx.close(); }
  return cookieCache[userKey];
}

// Hidden helper context for preflights (never recorded).
let scratch;
async function scratchPage(userKey) {
  if (!scratch) { const c = await browser.newContext(ctxOpts); scratch = await c.newPage(); scratch.setDefaultTimeout(cfg.timeout || 30000); }
  if (userKey) { await scratch.context().clearCookies(); await scratch.context().addCookies(await loginCookies(userKey)); }
  return scratch;
}

async function fetchJson(url, init = {}) {
  const r = await fetch(url, init); const txt = await r.text();
  if (!r.ok) throw new Error(`${init.method || "GET"} ${url.replace(/\?.*/, "")} -> ${r.status} ${txt.slice(0, 160)}`);
  try { return JSON.parse(txt); } catch { return txt; }
}

// ---------- Preflight ----------
const preflight = {};
for (const s of scenes) {
  if (!s.preflight) continue;
  try {
    const r = await s.preflight({api: cfg.api, state, fetchJson, scratchPage, users, render});
    preflight[s.id] = r === false || typeof r === "string" ? (r || "preflight returned false") : null;
  } catch (e) { preflight[s.id] = short(e); }
  say(preflight[s.id] ? `PREFLIGHT FAIL ${s.id}: ${preflight[s.id]}` : `preflight ok ${s.id}`);
}

// ---------- Recording context ----------
const ctx = await browser.newContext({...ctxOpts, ...(MODE === "record" ? {recordVideo: {dir: path.join(OUT, ".raw"), size: VIEW}} : {})});
await ctx.addInitScript(OVERLAY, cfg.css || "");
const page = await ctx.newPage();
page.setDefaultTimeout(cfg.timeout || 30000);
const t0 = Date.now();
const timeline = []; // {at, scene, kind, text, criteria}
const guardHits = [];
const at = () => { const s = Math.max(0, Math.round((Date.now() - t0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const pause = ms => ms > 0 ? page.waitForTimeout(Math.round(ms * SCALE)) : null;
const ready = () => page.waitForFunction(() => !!window.__demo, null, {timeout: cfg.timeout || 30000});
const overlay = async (kind, html, pos) => { if (html) check(kind, strip(html), wording); await ready(); await page.evaluate(([k, h, p]) => window.__demo[k](h, p), [kind, mask(html), pos || null]); };

function loc(spec) {
  if (typeof spec === "string") return page.locator(spec);
  let l;
  if (spec.role) l = page.getByRole(spec.role, {name: spec.name, exact: spec.exact});
  else if (spec.label) l = page.getByLabel(spec.label, {exact: spec.exact});
  else if (spec.text) l = page.getByText(spec.text, {exact: spec.exact});
  else if (spec.placeholder) l = page.getByPlaceholder(spec.placeholder);
  else if (spec.testId) l = page.getByTestId(spec.testId);
  else l = page.locator(spec.css);
  if (spec.has) l = l.filter({has: page.locator(spec.has)});
  if (spec.hasText) l = l.filter({hasText: spec.hasText});
  if (spec.visible) l = l.filter({visible: true});
  if (spec.nth !== undefined) l = l.nth(spec.nth); else if (spec.first !== false) l = l.first();
  return l;
}
async function moveTo(spec) {
  const l = loc(spec);
  await l.waitFor({state: "visible"});
  await l.scrollIntoViewIfNeeded();
  const b = await l.boundingBox();
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, {steps: MODE === "record" ? 25 : 2});
  await pause(250);
  return l;
}
function check(where, txt, rules) {
  for (const re of rules) { const m = txt.match(re); if (m) { guardHits.push(`${where}: /${re.source}/ "${m[0]}"`); say(`GUARD ${where}: visible "${m[0]}" matches /${re.source}/`); } }
}
async function guard(where) {
  const txt = await page.evaluate(() => document.body ? document.body.innerText : "").catch(() => "");
  check(where, txt, forbidden);
}

const H = () => ({page, api: cfg.api, state, fetchJson, render, loc, users, pause});
const ACTIONS = {
  async goto(s) { await page.goto(s.goto); await ready(); await pause(s.settle ?? 800); },
  async click(s) { const l = await moveTo(s.click); await l.click(s.force ? {force: true} : {}); },
  async hover(s) { await moveTo(s.hover); },
  async fill(s) { const l = await moveTo(s.fill); await l.fill(String(s.value)); if (s.tab) await l.press("Tab"); },
  async type(s) { const l = await moveTo(s.type); await l.click(); await l.pressSequentially(String(s.value), {delay: MODE === "record" ? (s.delay ?? 120) : 0}); },
  async select(s) { const l = await moveTo(s.select); await l.selectOption(typeof s.option === "string" ? {label: s.option} : s.option); },
  async check(s) { const l = await moveTo(s.check); await l.check(); },
  async uncheck(s) { const l = await moveTo(s.uncheck); await l.uncheck(); },
  async press(s) { await loc(s.press).press(s.key); },
  async waitFor(s) { await loc(s.waitFor).waitFor({state: s.state || "visible"}); },
  async waitForURL(s) { await page.waitForURL(s.waitForURL); },
  async wait(s) { await pause(s.wait); },
  async expect(s) {
    const l = loc(s.expect); await l.waitFor({state: "visible"});
    if (s.text !== undefined) { const got = await l.innerText(); if (!(s.text instanceof RegExp ? s.text.test(got) : got.includes(s.text))) throw new Error(`expected text ${s.text}, got "${got.slice(0, 80)}"`); }
  },
  async caption(s, sc) { await overlay("caption", s.caption, s.pos); if (s.caption) timeline.push({at: at(), scene: sc.id, kind: "caption", text: strip(s.caption), criteria: s.criteria || sc.criteria}); },
  async card(s, sc) {
    await overlay("card", s.card);
    if (s.card) timeline.push({at: at(), scene: sc.id, kind: "card", text: strip(s.card), criteria: s.criteria || sc.criteria});
    if (s.ms) { await pause(s.ms); await overlay("card", null); }
  },
  async panel(s, sc) {
    const html = typeof s.panel === "function" ? await s.panel(H()) : s.panel;
    await overlay("panel", html, s.pos);
    if (html) timeline.push({at: at(), scene: sc.id, kind: "panel", text: strip(html).slice(0, 160), criteria: s.criteria || sc.criteria});
    if (s.ms) { await pause(s.ms); await overlay("panel", null); }
  },
  async apiPanel(s, sc) {
    const a = s.apiPanel; const data = await a.fetch(H());
    const body = a.render ? await a.render(data, H()) : (data && typeof data === "object" && !Array.isArray(data) && Object.values(data).every(v => typeof v !== "object") ? render.kv(data) : render.json(data));
    const html = `<h3>${esc(a.title || "API check")}</h3>${body}${a.note ? `<div class="note">${a.note}</div>` : ""}`;
    await ACTIONS.panel({panel: html, pos: s.pos, ms: s.ms, criteria: s.criteria}, sc);
  },
  async login(s) {
    const user = users[s.login] || {};
    if (s.card !== false) await overlay("card", `<div style="font-size:30px">Signing in as <b>${esc(s.as || user.display || s.login)}</b>…</div>`);
    const cookies = await loginCookies(s.login, s.fresh);
    await ctx.clearCookies(); await ctx.addCookies(cookies);
    await pause(1200);
    if (s.goto) await ACTIONS.goto({goto: s.goto});
    if (s.card !== false && s.keepCard !== true) await overlay("card", null);
  },
  async log(s) { const v = typeof s.log === "function" ? await s.log(H()) : s.log; say(`  log: ${String(v).slice(0, 200)}`); },
  async run(s) { await s.run(H()); },
  async guard(s, sc) { await guard(sc.id); },
};

function fallbackCard(sc) {
  const fb = sc.fallback || {};
  const tags = (sc.criteria || []).map(render.tag).join(" ");
  return fb.card || `<h1>${tags}</h1><div>${(sc.criteria || []).map(c => esc(criteria[c] || c)).join("<br>")}</div>
    <div class="foot">${esc(fb.text || "Not shown live in this recording; covered by the automated tests.")}</div>`;
}

const results = [];
let aborted = false;
try {
  if (cfg.startUser) await ctx.addCookies(await loginCookies(cfg.startUser));
  await ACTIONS.goto({goto: cfg.startUrl || "data:text/html,<body style='background:%23111827'></body>"});
  if (cfg.intro) await ACTIONS.card({card: cfg.intro, ms: cfg.introMs || 9000}, {id: "intro", criteria: []});
  for (const sc of scenes) {
    const st0 = Date.now();
    const pf = preflight[sc.id];
    let steps = sc.steps || [];
    let status = "PASS";
    if (pf && MODE === "record") {
      if (!sc.fallback && !flag("--allow-missing")) { say(`ABORT ${sc.id}: preflight failed and no fallback (${pf})`); aborted = true; break; }
      steps = [{card: fallbackCard(sc), ms: sc.fallback?.ms || 7000}]; status = "FALLBACK";
    }
    let failed = null;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const kind = Object.keys(ACTIONS).find(k => k in s);
      if (!kind) { failed = {i, kind: "?", err: `unknown step ${JSON.stringify(s).slice(0, 80)}`}; break; }
      try {
        await ACTIONS[kind](s, sc);
        if (s.ms && !["card", "panel", "apiPanel"].includes(kind)) await pause(s.ms);
        if (kind === "goto") await guard(sc.id);
      } catch (e) { failed = {i, kind, err: short(e)}; break; }
    }
    await guard(sc.id);
    const secs = ((Date.now() - st0) / 1000).toFixed(1);
    const how = status === "FALLBACK" ? "fallback" : (sc.how || "ui");
    if (failed) {
      const shot = path.join(OUT, `failure-${sc.id}-step${failed.i + 1}.png`);
      await page.screenshot({path: shot}).catch(() => {});
      say(`FAIL ${sc.id} [${(sc.criteria || []).join(",")}] step ${failed.i + 1} (${failed.kind}): ${failed.err} -> ${shot}`);
      results.push({id: sc.id, status: "FAIL", how, criteria: sc.criteria || []});
      if (MODE === "record" || flag("--bail")) { aborted = true; break; }
    } else {
      say(`${status} ${sc.id} [${(sc.criteria || []).join(",")}] ${how} ${steps.length} steps ${secs}s${pf && MODE === "dry" ? ` (preflight failed: ${pf})` : ""}`);
      results.push({id: sc.id, status: pf && MODE === "dry" ? "PREFLIGHT-FAIL" : status, how, criteria: sc.criteria || []});
    }
  }
  if (!aborted && cfg.summaryCard !== false && !ONLY) {
    const rows = Object.keys(criteria).map(c => {
      const r = results.filter(x => x.criteria.includes(c) && x.status !== "FAIL");
      const hows = [...new Set(r.map(x => x.how === "fallback" ? "card" : x.how))].map(h => howLabel[h] || h).join(" + ") || "not shown";
      return `<li><b>${esc(c)}</b> ${esc(criteria[c])} <span style="color:#9ca3af">(${esc(hows)})</span></li>`;
    }).join("");
    await overlay("caption", null); await overlay("panel", null);
    await ACTIONS.card({card: `<h1>${esc(cfg.summaryTitle || "Acceptance criteria")}</h1><ul>${rows}</ul>${cfg.footer ? `<div class="foot">${esc(cfg.footer)}</div>` : ""}`, ms: cfg.summaryMs || 8000}, {id: "summary", criteria: []});
  }
} finally {
  const video = page.video();
  await ctx.close();
  if (scratch) await scratch.context().close();
  await browser.close();
  const wall = ((Date.now() - t0) / 1000).toFixed(0);
  const pass = results.filter(r => r.status === "PASS").length;
  console.log(`SUMMARY ${MODE}: ${pass}/${results.length} pass, ${results.filter(r => r.status === "FALLBACK").length} fallback, ${results.filter(r => /FAIL/.test(r.status)).length} fail, guard hits ${guardHits.length}, ${wall}s`);
  if (MODE === "record" && video && !aborted) {
    const webm = path.join(OUT, `${NAME}.webm`);
    fs.renameSync(await video.path(), webm); fs.rmSync(path.join(OUT, ".raw"), {recursive: true, force: true});
    let final = webm, dur = `${wall}s (wall clock)`;
    const has = bin => { try { execFileSync("which", [bin], {stdio: "ignore"}); return true; } catch { return false; } };
    if (cfg.mp4 !== false && has("ffmpeg")) {
      const mp4 = webm.replace(/\.webm$/, ".mp4");
      try { execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]); final = mp4; } catch (e) { say(`mp4 conversion failed, keeping webm: ${short(e)}`); }
    }
    if (has("ffprobe")) { try { dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final]).toString().trim() + "s"; } catch { /* duration stays wall clock */ } }
    const mb = (fs.statSync(final).size / 1048576).toFixed(1);
    const md = [`# ${cfg.title || NAME}: demo caption script`, "", `Video: \`${path.basename(final)}\` (${VIEW.width}x${VIEW.height}).${cfg.footer ? " " + cfg.footer + "." : ""}`, "",
      "| Time | Scene | Shown | Criteria |", "|---|---|---|---|",
      ...timeline.map(e => `| ${e.at} | ${e.scene} | ${e.kind === "caption" ? "" : `(${e.kind}) `}${e.text.replace(/\|/g, "\\|")} | ${(e.criteria || []).join(", ") || "–"} |`),
      "", "## Coverage", "", ...Object.keys(criteria).map(c => { const r = results.filter(x => x.criteria.includes(c)); return `- ${c} ${criteria[c]}: ${r.map(x => `${x.id} ${howLabel[x.how === "fallback" ? "card" : x.how] || x.how}${x.status === "FALLBACK" ? " (fallback)" : ""}`).join(", ") || "not shown"}`; }),
      ...(cfg.notes ? ["", "## Notes", "", cfg.notes] : [])].join("\n");
    fs.writeFileSync(path.join(OUT, `${NAME}-captions.md`), md + "\n");
    console.log(`VIDEO ${final} ${mb} MB ${dur}${+mb > (cfg.maxMB || 25) ? `  WARN over ${cfg.maxMB || 25} MB` : ""}`);
    console.log(`CAPTIONS ${path.join(OUT, `${NAME}-captions.md`)}`);
  } else if (MODE === "record") {
    fs.rmSync(path.join(OUT, ".raw"), {recursive: true, force: true});
    console.log("No video kept (aborted). Fix the failing scene with --dry --only <id>, then record again.");
  }
  const bad = aborted || results.some(r => /FAIL/.test(r.status)) || (MODE === "record" && guardHits.length && !flag("--allow-guard"));
  process.exitCode = bad ? 1 : 0;
}
