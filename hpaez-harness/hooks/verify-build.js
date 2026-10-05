#!/usr/bin/env node
/**
 * hpaez-harness · verify-build hook
 *
 * Install in ~/.claude/settings.json:
 *   "hooks": {
 *     "PostToolUse": [{
 *       "matcher": "Write|Edit",
 *       "command": "node ~/.claude/hpaez-hooks/verify-build.js \"$FILE_PATH\""
 *     }]
 *   }
 *
 * After each Edit/Write, runs the applicable build for the touched area.
 * Non-zero exit blocks the agent from claiming the task done.
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const filePath = process.argv[2];
if (!filePath || !existsSync(filePath)) process.exit(0);  // no file, skip

function findRoot(startDir) {
  let dir = resolve(startDir);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function run(label, cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', timeout: 60000 });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: (e.stderr?.toString() || e.message).slice(0, 500) };
  }
}

const root = findRoot(dirname(filePath));
if (!root) process.exit(0);  // no npm project, skip

const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(execSync(`cat "${pkgPath}"`).toString());

// Only run build for TS/JS files
if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) process.exit(0);

const checks = [];
if (pkg.scripts?.build) checks.push({ label: 'build', cmd: 'npm run build' });
if (pkg.scripts?.typecheck) checks.push({ label: 'typecheck', cmd: 'npm run typecheck' });

let failed = false;
for (const c of checks) {
  const r = run(c.label, c.cmd, root);
  if (!r.ok) {
    console.error(`[hpaez-hook] ✗ ${c.label} failed in ${root}`);
    console.error('    ' + r.err.split('\n').slice(0, 8).join('\n    '));
    failed = true;
  }
}

if (failed) {
  console.error('[hpaez-hook] verify-build blocked — DO NOT mark task [x] until fixed');
  process.exit(2);  // Claude Code convention: exit 2 = block
}
process.exit(0);
