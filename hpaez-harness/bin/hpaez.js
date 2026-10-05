#!/usr/bin/env node
/**
 * hpaez-harness CLI
 * Usage:
 *   hpaez init                → scaffold harness in current directory
 *   hpaez skill list          → list installed skills
 *   hpaez skill new <name>    → create new skill scaffold
 *   hpaez verify              → run verification hooks (build + state sync)
 *   hpaez registry refresh    → regenerate AGENTS.md skill table
 *   hpaez --version           → print version
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = resolve(__dirname, '..');
const CWD = process.cwd();

const cmd = process.argv[2];
const arg1 = process.argv[3];

function readTemplate(name) {
  return readFileSync(join(HARNESS_ROOT, 'templates', name), 'utf-8');
}

function copyDir(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function cmdInit() {
  console.log('hpaez-harness init — scaffolding harness in', CWD);

  const files = [
    { name: 'AGENTS.md', template: 'AGENTS.md.template' },
    { name: 'STATE.md', template: 'STATE.md.template' },
    { name: 'CHANGELOG.md', template: 'CHANGELOG.md.template' },
    { name: 'SKILLS.md', template: 'SKILLS.md.template' },
    { name: 'CONSTITUTION.md', template: 'CONSTITUTION.md.template' },
  ];

  for (const f of files) {
    const dest = join(CWD, f.name);
    if (existsSync(dest)) {
      console.log(`  ⏭  ${f.name} — ya existe, skip`);
      continue;
    }
    const content = readTemplate(f.template).replaceAll('{{DATE}}', today());
    writeFileSync(dest, content);
    console.log(`  ✓ ${f.name}`);
  }

  const skillsSrc = join(HARNESS_ROOT, 'skills');
  const skillsDest = join(CWD, 'skills');
  if (existsSync(skillsDest)) {
    console.log('  ⏭  skills/ — ya existe, skip');
  } else {
    copyDir(skillsSrc, skillsDest);
    console.log('  ✓ skills/ (23 skills en 6 categorías)');
  }

  console.log('\nHarness instalado. Próximos pasos:');
  console.log('  1. Editar CONSTITUTION.md con los principios inmutables del proyecto');
  console.log('  2. Agregar tareas iniciales a STATE.md');
  console.log('  3. Leer skills/_core/protocol-sync/SKILL.md');
  console.log('  4. Correr `hpaez verify` para probar los hooks\n');
}

function cmdSkillList() {
  const skillsDir = existsSync(join(CWD, 'skills')) ? join(CWD, 'skills') : join(HARNESS_ROOT, 'skills');
  console.log(`Skills disponibles en ${skillsDir}:\n`);
  for (const cat of readdirSync(skillsDir)) {
    const catPath = join(skillsDir, cat);
    if (!statSync(catPath).isDirectory()) continue;
    console.log(`  ${cat}/`);
    for (const skill of readdirSync(catPath)) {
      const skillMd = join(catPath, skill, 'SKILL.md');
      if (!existsSync(skillMd)) continue;
      const front = readFileSync(skillMd, 'utf-8').split('---')[1] || '';
      const desc = (front.match(/description:\s*"?([^"\n]+)"?/) || [, ''])[1];
      console.log(`    - ${skill}: ${desc.slice(0, 70)}`);
    }
  }
}

function cmdSkillNew(name) {
  if (!name) return console.error('Uso: hpaez skill new <kebab-case-name>');
  if (!/^[a-z][a-z0-9-]*$/.test(name)) return console.error('Nombre inválido: usa kebab-case');

  const skillsDir = join(CWD, 'skills');
  if (!existsSync(skillsDir)) return console.error('No hay skills/ aquí. Corre `hpaez init` primero.');

  const dest = join(skillsDir, name);
  if (existsSync(dest)) return console.error(`skills/${name}/ ya existe`);

  mkdirSync(dest, { recursive: true });
  const template = `---
name: ${name}
description: "Trigger: <palabras clave>. <Qué hace el skill>."
license: MIT
metadata:
  author: hpael
  version: "0.1"
---

## Activation Contract

Load this skill when <cuando aplica>.

## Hard Rules

- <regla no negociable 1>
- <regla no negociable 2>

## Decision Gates

| Situation | Action |
|-----------|--------|
| <caso 1> | <qué hacer> |

## Execution Steps

1. <paso 1>
2. <paso 2>

## Output Contract

<qué debe entregar>

## References

- <link relacionado>
`;
  writeFileSync(join(dest, 'SKILL.md'), template);
  console.log(`✓ Creado skills/${name}/SKILL.md`);
  console.log('Ahora edita el contenido siguiendo la doctrina Anthropic Skills (180-450 tokens, secciones fijas).');
}

function cmdVerify() {
  console.log('hpaez verify — corriendo checks...\n');
  let failed = false;

  const check = (label, cmd, cwd = CWD) => {
    try {
      execSync(cmd, { cwd, stdio: 'pipe' });
      console.log(`  ✓ ${label}`);
    } catch (e) {
      console.log(`  ✗ ${label}`);
      console.log('    ' + (e.stderr?.toString() || e.message).slice(0, 300));
      failed = true;
    }
  };

  if (existsSync(join(CWD, 'package.json'))) {
    const pkg = JSON.parse(readFileSync(join(CWD, 'package.json'), 'utf-8'));
    if (pkg.scripts?.build) check('npm run build', 'npm run build');
    if (pkg.scripts?.test) check('npm test', 'npm test');
    if (pkg.scripts?.lint) check('npm run lint', 'npm run lint');
  } else {
    console.log('  ⏭  no package.json, skip build/test');
  }

  if (existsSync(join(CWD, 'STATE.md')) && existsSync(join(CWD, 'CHANGELOG.md'))) {
    const state = readFileSync(join(CWD, 'STATE.md'), 'utf-8');
    const changelog = readFileSync(join(CWD, 'CHANGELOG.md'), 'utf-8');
    const doneCount = (state.match(/^- \[x\]/gm) || []).length;
    const entryCount = (changelog.match(/^## \d{4}-/gm) || []).length;
    console.log(`  ℹ  STATE.md: ${doneCount} tareas [x]`);
    console.log(`  ℹ  CHANGELOG.md: ${entryCount} entradas`);
    if (doneCount > entryCount * 2) {
      console.log('  ⚠  Discrepancia: muchas más tareas [x] que entradas de CHANGELOG. Posible sync-gap.');
    }
  }

  process.exit(failed ? 1 : 0);
}

function cmdVersion() {
  const pkg = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf-8'));
  console.log(`hpaez-harness v${pkg.version}`);
}

function usage() {
  console.log(`hpaez-harness — discipline for AI coding

Commands:
  hpaez init                → scaffold harness in current directory
  hpaez skill list          → list installed skills
  hpaez skill new <name>    → create new skill scaffold
  hpaez verify              → run verification (build + state sync)
  hpaez registry refresh    → regenerate AGENTS.md skill table (TODO)
  hpaez --version           → print version

Docs: https://github.com/Hpael/hpaez-harness
`);
}

switch (cmd) {
  case 'init': cmdInit(); break;
  case 'skill':
    if (arg1 === 'list') cmdSkillList();
    else if (arg1 === 'new') cmdSkillNew(process.argv[4]);
    else usage();
    break;
  case 'verify': cmdVerify(); break;
  case 'registry':
    if (arg1 === 'refresh') console.log('TODO: implementar en v0.1');
    else usage();
    break;
  case '--version':
  case '-v':
  case 'version': cmdVersion(); break;
  default: usage();
}
