---
name: scope-boundaries
description: "Trigger: qué puedo editar, qué no toco, docker, .env, deploy, dist, scripts, legacy, out of scope, encontré un bug ajeno, build artifacts. Delimita archivos y comandos permitidos vs prohibidos."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill before editing any file whose path is not obviously under your role's editable zone. When in doubt, check this skill first.

## Hard Rules

- Never create ZIPs, `release/`, or `build/` folders manually. Edit in place, always.
- Never edit deploy/infra files unless your role explicitly owns infra.
- Never run `docker`, `docker compose`, `ssh`, `scp`, `prisma migrate`, `kubectl apply` unless your role is deployer.
- When you find a bug outside your current task, log it under "Fuera de la auditoría" in STATE — do not fix it inline.
- Each project's `CONSTITUTION.md` can extend or narrow this scope. Check it first.

## Decision Gates

### Universally off-limits (never edit unless deployer + explicit approval)

| Category | Typical paths |
|----------|---------------|
| Secrets | `.env`, `.env.*`, `*.pem`, `*.key`, `secrets.*` |
| Deploy config | `Dockerfile`, `docker-compose*.yml`, `.dockerignore`, `nginx.conf`, `Caddyfile` |
| Deploy scripts | `deploy.sh`, `sync.sh`, `bin/deploy*` |
| Build output | `dist/`, `build/`, `out/`, `.next/`, `target/`, `bin/*.js` (if compiled) |
| Vendored deps | `node_modules/`, `vendor/`, `.venv/`, `__pycache__/` |
| Version control | `.git/` |
| Archive folders | Anything named `*.legacy.*`, `_backup*`, `_archive*` |

### Universally safe zones (edit freely, respecting other skills)

| Category | Typical paths |
|----------|---------------|
| Frontend source | `src/`, `app/`, `components/`, `pages/`, `styles/`, `public/assets/` |
| Backend source | `src/`, `server/`, `api/`, `controllers/`, `services/`, `models/` |
| Database schema | `prisma/schema.prisma`, `migrations/` (notify deployer before `[x]`) |
| Docs | `docs/`, `README.md`, `SKILLS.md`, `CONSTITUTION.md` |
| Harness files | `skills/**/*` — improvements to the harness itself |
| Package files | `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod` (commit lockfile too) |
| Tests | `test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*` |

## Execution Steps

1. Before editing, check the file path against the tables above.
2. If off-limits and you're not the deployer: stop, add a note under "Fuera de la auditoría" in STATE describing what was needed.
3. If in safe zone: proceed with your role's skills.
4. If unsure: ask the human in your next message, do not guess.
5. If the project's `CONSTITUTION.md` extends this list, treat those additions as equally binding.

## Output Contract

- No edits to off-limits files unless the human explicitly overrode this skill for the task.
- Discovered out-of-scope bugs logged in STATE under "Fuera de la auditoría" with 1-line description.
- If you tried to edit an off-limits file and stopped, mention it in your session summary.

## References

- `AGENTS.md` — full skill index
- `STATE.md` — where to log fuera de alcance
- `CONSTITUTION.md` — project-specific extended scope rules
