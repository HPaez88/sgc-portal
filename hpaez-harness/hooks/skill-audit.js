#!/usr/bin/env node
/**
 * hpaez-harness · skill-audit hook
 *
 * Gates third-party skill/plugin/MCP installs through NVIDIA SkillSpector.
 * Fail-closed: a new SKILL.md that scores > SKILL_AUDIT_MAX (default 50) blocks
 * the task; a missing scanner blocks too (with install instructions), because a
 * skipped security gate is worse than a stopped task.
 *
 * Install in ~/.claude/settings.json:
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": "Write",
 *       "command": "node ~/.claude/hpaez-hooks/skill-audit.js \"$FILE_PATH\""
 *     }]
 *   }
 *
 * It only acts when the touched file IS a SKILL.md (skill being added/edited).
 * Everything else is a no-op, so it never slows normal work.
 *
 * Env:
 *   SKILL_AUDIT_MAX   score above which install is blocked (default 50)
 *   SKILL_AUDIT_OFF   set to "1" to disable (do this only with human intent)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

// Claude Code passes tool context as JSON on stdin; other harnesses may pass the
// path as argv[2]. Accept both.
function resolveFilePath() {
  if (process.argv[2]) return process.argv[2];
  try {
    const raw = readFileSync(0, 'utf8');
    if (!raw.trim()) return null;
    const j = JSON.parse(raw);
    return j.tool_input?.file_path || j.tool_input?.path || null;
  } catch {
    return null;
  }
}

const filePath = resolveFilePath();
if (!filePath || process.env.SKILL_AUDIT_OFF === '1') process.exit(0);
if (basename(filePath) !== 'SKILL.md' || !existsSync(filePath)) process.exit(0);

const MAX = Number(process.env.SKILL_AUDIT_MAX ?? 50);
const skillDir = dirname(resolve(filePath));

function hasScanner() {
  try {
    execSync('skillspector --version', { stdio: 'pipe', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

if (!hasScanner()) {
  console.error('[skill-audit] BLOCKED: NVIDIA SkillSpector is not installed, so this skill cannot be vetted.');
  console.error('[skill-audit] Install: uv tool install git+https://github.com/NVIDIA/skillspector.git');
  console.error('[skill-audit] Then re-run, or set SKILL_AUDIT_OFF=1 only if you accept the unvetted skill.');
  process.exit(2);
}

let out = '';
try {
  out = execSync(`skillspector scan "${skillDir}" --no-llm --format json`, {
    stdio: 'pipe', timeout: 120000,
  }).toString();
} catch (e) {
  // Scanner ran but exited non-zero (its own gate tripped) — surface and block.
  out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  console.error('[skill-audit] SkillSpector reported a problem:');
  console.error(out.slice(0, 800));
  process.exit(2);
}

let score = null;
try {
  const j = JSON.parse(out);
  score = j.risk_score ?? j.score ?? j.riskScore ?? null;
} catch {
  console.error('[skill-audit] Could not parse SkillSpector output; treating as unvetted (blocked).');
  console.error(out.slice(0, 500));
  process.exit(2);
}

if (score === null) process.exit(0); // nothing to gate on
if (score > MAX) {
  console.error(`[skill-audit] BLOCKED: ${skillDir} scored ${score} (> ${MAX}). Do not install.`);
  console.error('[skill-audit] Review findings: skillspector scan "' + skillDir + '" --no-llm --format markdown');
  process.exit(2);
}
console.error(`[skill-audit] OK: ${basename(skillDir)} scored ${score} (<= ${MAX}).`);
process.exit(0);
