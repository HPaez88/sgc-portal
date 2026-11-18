---
name: prelaunch-guard
description: "Trigger: prelaunch-guard, revisión pre-lanzamiento, primer deploy público, tarea [DEPLOY] que expone una URL nueva, alta de un proveedor de pago por uso o de envío de mensajes. Checklist con evidencia de 6 riesgos que no se ven en la demo (costo sin tope, accesibilidad, datos abiertos, mensajes sin consentimiento, llamadas sin límite, datos personales). Incluye un script de sondas pasivas (solo GET/HEAD) que cubre parte de los riesgos 1 y 3; lo demás es revisión manual. Solo sistemas propios o autorizados; toda acción de red se confirma con el humano."
license: MIT
metadata:
  author: hpael
  version: "1.0"
  language: "es por defecto (harness para equipos en México); el agente responde en el idioma del usuario"
  allowed-tools: "Read, Grep, Glob, Bash(bash skills/_quality/prelaunch-guard/check.sh *), Bash(curl -sS -I *), Bash(curl -sS -o /dev/null -w *)"
---

## Activation Contract

Load this skill only on an explicit trigger: @human asks for `prelaunch-guard` / a pre-launch review, or a task tagged
`[DEPLOY]` exposes a new public URL, adds a pay-per-use provider, starts sending messages, or starts storing personal
data (`verify-loop` suggests it in that case). Conversation about costs or lawsuits alone does not activate it.
Before any network action the agent states the exact target and waits for @human's confirmation.

What it is: a **checklist with evidence** for six risks plus a small probe script. What it is not: a pentest,
a legal opinion, or full coverage. The script automates only part of risks 1 and 3; risks 2, 4, 5 and 6 are
checked manually with the steps below. Origin: revolutia, "5 formas de que te demanden por una app que no ha
vendido nada" (2026), generalized beyond Supabase/US, plus a 6th risk (personal data) from the SGC Portal audit.

## Hard Rules

- **Scope and permissions** (see `allowed-tools`). Read repo files, `grep`, passive `curl` GET/HEAD, and `check.sh`
  against a target @human confirmed as owned or authorized (`PRELAUNCH_AUTORIZADO=<host>`). The skill never sends
  credentials, never changes infrastructure, billing, DNS or data; fixes go through normal tasks.
- **Active tests are manual.** The login rate-limit test sends POST requests and can trigger alerts or block an IP.
  It is not in the script: the agent proposes the exact command and @human runs it or approves it explicitly.
- Every item is answered with **evidence** (command output, config line, screenshot). An item without evidence counts as FAIL.
- Pay-per-use infrastructure should have a hard spend cap or a budget kill-switch before launch. Alerts alone are not a cap.
- Nothing returns user data without a session. Authorization is enforced **on the server** (DB policies or API checks),
  never only by hiding buttons in the UI.
- No secret ships to the browser: no service-role keys, no LLM/API keys, no passwords in the bundle or the repo.
- No outbound message (SMS, WhatsApp, email campaign, push) without recorded prior consent and an opt-out.
- No external call (LLM, payment, email, cloud function) can recurse or retry without a bound.
- **The decision to launch is @human's.** The agent recommends: FAIL in rows 1, 3 or 5 → "recommend not launching";
  FAIL in 2, 4 or 6 → "launch only with written risk acceptance". The agent does not deploy, roll back or block on its own.

## Decision Gates

| # | Risk | What to check | Pass criteria | Stack-specific notes |
|---|------|---------------|---------------|----------------------|
| 1 | **Bill shock** (DoS / traffic / abuse) | Hosting billing model; rate limit on login, AI, uploads, signup; spend cap | Fixed-price hosting **or** hard cap set; repeated requests get `429`; an expensive endpoint can't be looped | Vercel/Netlify/Cloudflare: spend management or CDN rate rules. Supabase: spend cap ON. Firebase/AWS/GCP: budgets only alert — add a kill-switch. VPS: Traefik/Nginx `ratelimit`. |
| 2 | **Accessibility lawsuit** | Alt text, keyboard use, labels on icon buttons, visible focus, contrast, `lang` | WCAG 2.2 AA basics: 0 images without `alt`, every action reachable by Tab/Enter, icon-only buttons have `aria-label`, focus visible | US: ADA suits (5,000+/yr, mostly small businesses). Run axe/Lighthouse; fix all "critical". |
| 3 | **Data open to anyone** | Unauthenticated requests to data endpoints; DB policies; secrets in bundle; DB port exposure | Data endpoints return `401/403` without session; role checks server-side; 0 secrets in bundle; DB not reachable from the internet | Supabase/Firebase: **RLS ON for every table** (`select tablename, rowsecurity from pg_tables where schemaname='public'` → all `t`); Firestore rules never `if true`. Never ship `service_role`. Own API: auth on every router, tenant from the token. |
| 4 | **Messages without consent** | Any SMS/WhatsApp/email to lists (launch notices, waitlists, reminders) | Written opt-in stored with date/source; opt-out in every message; transactional vs marketing separated | US TCPA: up to $500–$1,500 **per message**. MX: consent + privacy notice (LFPDPPP); check REPEP (PROFECO) for marketing. WhatsApp Business requires opt-in. |
| 5 | **Runaway calls** (recursion / retries) | Functions calling themselves, triggers that write to their own source, unbounded retries, LLM loops, `useEffect` calling APIs every render | Max depth/attempts in code; idempotent triggers; per-provider monthly usage limit set | Cloud functions + DB triggers are the classic loop. Agent/LLM code: cap iterations and tokens per request. |
| 6 | **Personal data** | Personal data stored; privacy notice; image metadata (EXIF/GPS); retention; backup encryption | Privacy notice published; EXIF stripped from uploads; access logged; retention defined; backups encrypted off-site | MX private: LFPDPPP. MX government bodies: Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados. EU users: GDPR. |

## Execution Steps

1. Identify the stack: hosting + billing model, database/BaaS, auth, paid APIs, messaging. Write it at the top of the report.
2. Confirm with @human the target URL and that they own it or are authorized.
3. Passive probes (GET/HEAD only):
   ```bash
   PRELAUNCH_AUTORIZADO=<host> bash skills/_quality/prelaunch-guard/check.sh https://<host> "/api/<data-1> /api/<data-2>"
   ```
   Covers: security headers, unauthenticated access to the listed data routes, secrets in served JavaScript,
   exposed API docs.
   Active login rate-limit test — manual, only with explicit @human approval, 6 attempts max, fake credentials:
   ```bash
   for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code} ' -X POST https://<host>/<login> -H 'Content-Type: application/json' -d '{"email":"prelaunch@invalid.test","password":"x"}'; done
   ```
   Pass: at least one `429`.
4. Manual checks in the repo:
   - Secrets: `grep -rEn '(^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9]{20,}|gsk_[A-Za-z0-9]{20,})|service_role|AKIA[0-9A-Z]{16}|-----BEGIN' .` (exclude `node_modules`). The leading boundary avoids false positives such as Tailwind's `mask-linear-…`.
   - Accessibility: `<img` without `alt`, icon-only `<button>` without `aria-label`, `onClick` on `div/span` without `role`+`onKeyDown`. Lighthouse/axe on the 3 main screens.
   - Loops: functions/triggers that call themselves or write to their trigger source; retries without a max.
   - Messaging and personal data: list every place that sends messages or stores personal data, with the consent/notice evidence.
5. Provider consoles (@human if no access): spend caps, usage limits, RLS status, backup encryption.
6. Fill the report (Output Contract) and present the recommendation. @human decides.
7. After fixes, re-run the probes and attach the new output; hand off to `verify-loop`.

## Output Contract

A `docs/prelaunch/<YYYY-MM-DD>.md` report (or a section in the PR) — no empty cells:

```markdown
# Pre-launch guard — <app> — <date>
Stack: <hosting + billing> · <db/BaaS> · <auth> · <paid APIs> · <messaging>
Target authorized by: @human (<date>)

| # | Risk | Status | Evidence | Action / owner / date |
|---|------|--------|----------|-----------------------|
| 1 | Bill shock | PASS/FAIL/N.A. | `6 POST /login → 429 after 5` · spend cap $X | — |
| 2 | Accessibility | ... | ... | ... |
| 3 | Data exposure | ... | ... | ... |
| 4 | Consent | ... | ... | ... |
| 5 | Runaway calls | ... | ... | ... |
| 6 | Personal data | ... | ... | ... |

Recommendation: LAUNCH / LAUNCH WITH ACCEPTED RISKS / DO NOT LAUNCH YET
Decision (@human): ...
```

N.A. needs a one-line reason (e.g. "4: the app sends no messages").

## References

- `skills/_quality/prelaunch-guard/check.sh` — passive probes (GET/HEAD only, requires `PRELAUNCH_AUTORIZADO`)
- [`_quality/verify-loop`](../verify-loop/SKILL.md) — suggests this skill for `[DEPLOY]` tasks
- [`_quality/silent-failure-hunter`](../silent-failure-hunter/SKILL.md) — complementary code-level audit
- [`_quality/security-audit`](../security-audit/SKILL.md) — the **deep** version: for anything internet-exposed or touching auth/payments/user-data, run a full security-audit, not just this checklist
- [`_meta/skill-security`](../../_meta/skill-security/SKILL.md) — supply chain of skills/plugins (different scope)
- ECC rules reused: `~/.claude/rules/ecc/common/security.md`, `web/security.md`; ECC skill `accessibility`
- First case: SGC Portal (OOMAPASC) audit 2026-10-16 — missing rate limit, missing security headers, server-side role gaps
