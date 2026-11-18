# Agent Surfaces — one owner per path

> Maps every writable glob to **exactly one** department owner. Enforced by
> `_agents/surface-guard` (live hook) and `scripts/check-surfaces.js` (pre-commit).
> `STATE.md` and `CHANGELOG.md` are shared (every department updates them).
>
> **Order matters: most-specific first (first match wins).** `design` owns
> `src/**/*.css` and must sit above `engineering`'s `src/**`, or CSS would route
> to engineering. Add a new department's row with its charter in the same change.

| Owner | Writes (globs) |
|-------|----------------|
| design | src/**/*.css, styles/**, components/**, public/assets/** |
| product | specs/**, docs/prd/** |
| finance | docs/finance/** |
| marketing | docs/marketing/** |
| ops | docs/ops/**, runbooks/**, .github/** |
| engineering | src/**, server/**, api/**, controllers/**, services/**, models/**, test/**, tests/** |

## How the orchestrator uses this

Before delegating to a department, declare its surface so the live hook enforces it:

```bash
export ACTIVE_SURFACE="specs/**,docs/prd/**"      # e.g. product
# or write the globs (one per line or comma-separated) to .active-surface
```

Clear it when you're not inside a delegated department. Before any commit:

```bash
node scripts/check-surfaces.js --owner <department>
```
