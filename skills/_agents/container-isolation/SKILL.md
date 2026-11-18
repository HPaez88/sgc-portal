---
name: container-isolation
description: "Trigger: aislar agente, contenedor, docker, podman, entorno reproducible, correr código no confiable, agentes en paralelo sin pisarse el entorno, sandbox, probar algo riesgoso, revisar diff por entorno. Corre un agente/track dentro de un contenedor aislado en vez de (o además de) un git worktree."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when a track needs **environment** isolation, not just filesystem isolation — running untrusted/generated code, a different stack per track, reproducible setups, or several agents in parallel that must not touch each other's environment or the host. It's the heavier sibling of `_agents/parallel-worktrees`: worktrees isolate *files* on one shared environment; containers isolate the *whole environment*.

## Hard Rules

- Pick the lightest isolation that holds: a git worktree (`_agents/parallel-worktrees`) for same-stack tracks on a trusted machine; a container only when the environment itself must be isolated (untrusted code, differing deps, reproducibility, host protection).
- The agent inside a container writes only inside the container's mounted work dir — never the host outside it. The orchestrator reviews the diff and decides **merge or discard** per environment; nothing lands on the host silently.
- One container = one track/branch (same "one owner per surface" rule as `_agents/department` / `surface-guard`).
- Never grant the container host network, host Docker socket, or host credentials unless the task explicitly needs them and the human approved — that defeats the isolation.
- Containers are disposable: pin the base image for reproducibility, and destroy the container after merge/discard. State that must survive lives in the committed diff, not the container.
- Degrade cleanly: if Docker/Podman isn't available, fall back to `parallel-worktrees` and say so — don't block the task.

## Decision Gates

| Situation | Isolation |
|-----------|-----------|
| Parallel tracks, same stack, trusted code | `parallel-worktrees` (lighter) |
| Running generated/untrusted code or a risky experiment | Container |
| Tracks need different runtimes/deps (node 18 vs 22, python envs) | Container per track |
| Reproducible "works on any machine" build | Container (pinned image) |
| Tool/agent that wants shell + network you don't fully trust | Container, no host network/socket |
| No Docker/Podman on the machine | Fall back to worktree |

## Execution Steps

1. Decide worktree vs container via the gates. If worktree, stop and use `parallel-worktrees`.
2. Define the environment: a pinned base image + the project mounted at a work dir (e.g. `docker run --rm -it -v "$PWD:/work" -w /work <image>`), no host socket/network unless approved.
3. Create one container per track; name it for the track (`track/<department>-<slug>`).
4. Delegate the track to its agent/department inside the container. It writes only under `/work`.
5. On finish: the orchestrator pulls the **diff** out (git branch pushed from inside, or `docker cp`), reviews it, and runs `_quality/verify-loop` on the host before merge.
6. Merge in DAG order (as in `parallel-worktrees`) or discard. Destroy the container.

## Output Contract

- Each track ran in its own disposable container; the host filesystem/env was untouched except by the reviewed, merged diff.
- No container held host network/socket/credentials without explicit approval.
- Base image pinned (reproducible); container removed after merge/discard; `STATE.md`/`CHANGELOG.md` record the merged track.

## References

- Related: `_agents/parallel-worktrees` (filesystem isolation), `_agents/subagent-isolation` (context isolation), `_agents/department`, `_sdd/orchestrate`, `_quality/verify-loop`
- Idea source: `dagger/container-use` (per-agent containerized environments, review/merge/discard per env) — adapted agent-agnostic, not vendored
