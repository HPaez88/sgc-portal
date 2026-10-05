#!/usr/bin/env node
/**
 * hpaez-harness · skill-clone-audit hook
 *
 * Closes the gap that skill-audit.js (matcher: Write) misses: skills are almost
 * always installed by `git clone`/`gh repo clone`/`degit`, not by writing a
 * SKILL.md through the Write tool. This hook fires PostToolUse on Bash, finds
 * what a clone command dropped on disk, scans any SKILL.md under it with NVIDIA
 * SkillSpector, and BLOCKS (exit 2) if anything scores > SKILL_AUDIT_MAX.
 *
 * Install in ~/.claude/settings.json:
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": "Bash",
 *       "hooks": [{ "type": "command",
 *         "command": "node \"C:\\Users\\hmpl_\\.claude\\hpaez-hooks\\skill-clone-audit.js\"",
 *         "timeout": 150 }]
 *     }]
 *   }
 *
 * Env:
 *   SKILL_AUDIT_MAX   score above which the clone is quarantined (default 50)
 *   SKILL_AUDIT_OFF   set to "1" to disable (only with human intent)
 *
 * ponytail: best-effort clone-dir parsing. A clone command we can't parse warns
 * but does not block (blocking every unparseable clone would get the hook
 * disabled, which is worse). Upgrade path: parse `cd X && ...` chains fully.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

// Derive the destination dir from a clone command (best effort). Exported for tests.
export function cloneDir(command, cwd) {
  const cdMatch = command.match(/cd\s+"?([^"&|;]+)"?\s*&&/);
  const base = cdMatch ? resolve(cwd, cdMatch[1].trim()) : cwd;
  const VALUE_FLAGS = new Set(['--depth', '-b', '--branch', '-o', '--origin', '--reference', '-c', '--config']);
  const seg = command.split(/git\s+clone|gh\s+repo\s+clone|degit/i).pop();
  const toks = seg.trim().split(/\s+/).filter(Boolean);
  const pos = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (VALUE_FLAGS.has(t)) { i++; continue; }
    if (t.startsWith('-')) continue;
    pos.push(t.replace(/["']/g, ''));
  }
  if (pos.length === 0) return null;
  const url = pos[0];
  const dest = pos[1] || basename(url).replace(/\.git$/, '');
  return resolve(base, dest);
}

// --selftest: assert the parser before doing anything else. Runs without stdin.
if (process.argv.includes('--selftest')) {
  const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } };
  assert(cloneDir('git clone https://github.com/x/y.git', '/w') === resolve('/w', 'y'), 'url basename');
  assert(cloneDir('git clone https://github.com/x/y.git mydir', '/w') === resolve('/w', 'mydir'), 'explicit dest');
  assert(cloneDir('git clone --depth 1 https://github.com/x/y.git', '/w') === resolve('/w', 'y'), 'skip --depth value');
  assert(cloneDir('cd sub && git clone https://github.com/x/y.git', '/w') === resolve('/w', 'sub', 'y'), 'cd chain');
  assert(cloneDir('gh repo clone x/y dest', '/w') === resolve('/w', 'dest'), 'gh repo clone');
  console.log('skill-clone-audit selftest OK');
  process.exit(0);
}

if (process.env.SKILL_AUDIT_OFF === '1') process.exit(0);

let input = {};
try {
  const raw = readFileSync(0, 'utf8');
  if (raw.trim()) input = JSON.parse(raw);
} catch { process.exit(0); }

if (input.tool_name && input.tool_name !== 'Bash') process.exit(0);
const cmd = input.tool_input?.command || process.argv.slice(2).join(' ');
if (!cmd) process.exit(0);

// Only care about commands that fetch a repo/skill onto disk.
if (!/\b(git\s+clone|gh\s+repo\s+clone|degit)\b/i.test(cmd)) process.exit(0);

const cwd = input.cwd || process.cwd();
const MAX = Number(process.env.SKILL_AUDIT_MAX ?? 50);

const dir = cloneDir(cmd, cwd);
if (!dir || !existsSync(dir)) {
  console.error(`[skill-clone-audit] Could not locate the clone target for: ${cmd.slice(0, 120)}`);
  console.error('[skill-clone-audit] Scan it manually before using: skillspector scan <dir> --no-llm --format markdown');
  process.exit(0); // ponytail: warn, do not block an unparseable clone
}

// Find SKILL.md files (a repo is a "skill install" only if it has any).
function findSkillMds(root, depth = 4) {
  const out = [];
  (function walk(d, left) {
    if (left < 0) return;
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      if (e === '.git' || e === 'node_modules') continue;
      const p = join(d, e);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p, left - 1);
      else if (e === 'SKILL.md') out.push(dirname(p));
    }
  })(root, depth);
  return out;
}

const skillDirs = findSkillMds(dir);
if (skillDirs.length === 0) process.exit(0); // not a skill install, nothing to gate

function hasScanner() {
  try { execSync('skillspector --version', { stdio: 'pipe', timeout: 10000 }); return true; }
  catch { return false; }
}

if (!hasScanner()) {
  console.error(`[skill-clone-audit] BLOCKED: cloned a skill (${basename(dir)}) but SkillSpector is not installed.`);
  console.error('[skill-clone-audit] Install: uv tool install git+https://github.com/NVIDIA/skillspector.git');
  console.error(`[skill-clone-audit] Or remove the clone: rm -rf "${dir}"`);
  process.exit(2);
}

const blocked = [];
for (const sd of skillDirs) {
  let out = '';
  try {
    out = execSync(`skillspector scan "${sd}" --no-llm --format json`, { stdio: 'pipe', timeout: 120000 }).toString();
  } catch (e) {
    out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  }
  let score = null;
  try { const j = JSON.parse(out); score = j.risk_score ?? j.score ?? j.riskScore ?? null; } catch {}
  if (score !== null && score > MAX) blocked.push({ sd, score });
}

if (blocked.length) {
  console.error(`[skill-clone-audit] BLOCKED: ${blocked.length} skill(s) exceed score ${MAX}. Do NOT use; quarantine or remove.`);
  for (const b of blocked) {
    console.error(`  - ${b.sd}  score=${b.score}`);
    console.error(`    review: skillspector scan "${b.sd}" --no-llm --format markdown`);
  }
  console.error(`[skill-clone-audit] Remove the clone: rm -rf "${dir}"`);
  process.exit(2);
}

console.error(`[skill-clone-audit] OK: ${skillDirs.length} skill(s) under ${basename(dir)} scored <= ${MAX}.`);
process.exit(0);
