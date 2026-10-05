---
name: release
description: "Trigger: release, publicar, npm publish, github release, version bump, tag release, deployment production. Ejecuta release semver con changelog + tag + notas."
license: MIT
metadata:
  author: hpael
  version: "1.0"
---

## Activation Contract

Load this skill when preparing a versioned release — npm publish, GitHub release, Docker image tag, or any artifact that goes out with a version number. Do NOT load for continuous deploys of the same version.

## Hard Rules

- Follow strict semver: MAJOR.MINOR.PATCH.
  - MAJOR: breaking change to public API
  - MINOR: backwards-compatible new feature
  - PATCH: backwards-compatible bug fix
- Never publish without a tag. Never tag without a corresponding CHANGELOG section.
- CHANGELOG for releases uses "Keep a Changelog" format — separate from the daily `CHANGELOG.md` which is a project-work timeline.
- All tests pass before publish (run `verify-loop` phase 3 explicitly).
- Never publish from a dirty working tree.
- Never `--force` push a release tag.

## Decision Gates

| Change type | Version bump |
|-------------|--------------|
| Bug fix, no API change | PATCH (x.y.**Z**) |
| New feature, no breaking change | MINOR (x.**Y**.0) |
| Breaking API change, removed export, contract break | MAJOR (**X**.0.0) |
| Pre-release / experimental | append `-beta.N` or `-rc.N` |
| Documentation only | usually no release; if needed → PATCH |

## Execution Steps

1. Verify clean tree: `git status` returns empty.
2. Run full `verify-loop` (all 6 phases).
3. Update version in `package.json` / `Cargo.toml` / equivalent.
4. Regenerate or update `RELEASES.md` (Keep-a-Changelog format) with new section for this version.
5. Commit: `git commit -am "release: v<X.Y.Z>"`.
6. Tag: `git tag -a v<X.Y.Z> -m "Release <X.Y.Z>"`.
7. Push tag: `git push origin v<X.Y.Z>` (and the branch).
8. If npm: `npm publish` (verify with `npm view <pkg> version`).
9. If GitHub: `gh release create v<X.Y.Z> --notes-file <notes.md>`.
10. Announce in whatever channels the project uses (Slack, Discord, mailing list).

## Output Contract

`RELEASES.md` new entry:
```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- Feature A
- Feature B

### Changed
- Behavior C

### Fixed
- Bug D

### Removed / Deprecated / Security
(as applicable)

**Full commits:** https://github.com/<org>/<repo>/compare/v<prev>...v<X.Y.Z>
```

CHANGELOG (daily) entry tagged `[RELEASE]` with the version and link to `RELEASES.md` section.

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- Related: `_delivery/work-unit-commits`, `_delivery/branch-pr`
